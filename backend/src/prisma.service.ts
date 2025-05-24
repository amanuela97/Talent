import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  // Track seen prepared statement errors to avoid repeated logging
  private seenPreparedStatementErrors = new Set<string>();
  // Track when we last deallocated statements
  private lastDeallocateTime = 0;
  // Set a minimum interval between deallocate operations (1 second)
  private readonly MIN_DEALLOCATE_INTERVAL = 1000;

  constructor() {
    super({
      log: ['error', 'warn'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to database');

      // Clean up any stale transactions
      await this.cleanupTransactions();

      // Set up periodic connection checks and cleanup
      this.startConnectionHealthCheck();
    } catch (error) {
      this.logger.error(
        'Failed to initialize database connection',
        error instanceof Error ? error.stack : String(error),
      );

      // Attempt to recover by reconnecting
      try {
        await this.$disconnect();
        await this.$connect();
        this.logger.log(
          'Successfully reconnected to database after initial failure',
        );
      } catch (reconnectError) {
        this.logger.error(
          'Failed to reconnect to database, application may be unstable',
          reconnectError instanceof Error
            ? reconnectError.stack
            : String(reconnectError),
        );
      }
    }
  }

  async onModuleDestroy() {
    // Clean up the health check interval
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
      this.connectionCheckInterval = null;
    }

    try {
      // Clean up any prepared statements before disconnecting
      await this.$executeRawUnsafe('DEALLOCATE ALL').catch((err) =>
        this.logger.warn(
          'Error deallocating prepared statements during shutdown',
          String(err),
        ),
      );

      await this.$disconnect();
      this.logger.log('Disconnected from database');
    } catch (error) {
      this.logger.error(
        'Error during database disconnection',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // Start a periodic connection health check
  private startConnectionHealthCheck() {
    // Run every 30 seconds
    this.connectionCheckInterval = setInterval(() => {
      void (async () => {
        try {
          // Simple query to check if the connection is still alive
          await this.$executeRawUnsafe('SELECT 1');

          // Also clean up any stale transactions and prepared statements
          await this.cleanupTransactions();

          this.logger.debug('Database connection health check passed');
        } catch (error) {
          this.logger.error(
            'Database connection health check failed',
            error instanceof Error ? error.message : String(error),
          );

          // Try to reconnect
          try {
            await this.$disconnect();
            await this.$connect();
            this.logger.log('Successfully reconnected to database');
          } catch (reconnectError) {
            this.logger.error(
              'Failed to reconnect to database after health check failure',
              reconnectError instanceof Error
                ? reconnectError.stack
                : String(reconnectError),
            );
          }
        }
      })();
    }, 30 * 1000);
  }

  // New helper method to determine if we should deallocate
  private shouldDeallocate(): boolean {
    const now = Date.now();
    if (now - this.lastDeallocateTime > this.MIN_DEALLOCATE_INTERVAL) {
      this.lastDeallocateTime = now;
      return true;
    }
    return false;
  }

  // New helper method to safely deallocate with reduced logging
  private async safeDeallocate(): Promise<boolean> {
    // Only proceed if we haven't deallocated recently
    if (!this.shouldDeallocate()) {
      return false;
    }

    try {
      await this.$executeRawUnsafe('DEALLOCATE ALL');
      return true;
    } catch (error) {
      // Don't log prepared statement errors at all
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (!this.isPreparedStatementError(error)) {
        // Only log non-prepared statement errors
        this.logger.warn('Failed to deallocate statements', errorMsg);
      }
      return false;
    }
  }

  // Helper to identify prepared statement errors
  private isPreparedStatementError(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      const errorMsg = (error as { message: string }).message.toLowerCase();
      return (
        errorMsg.includes('prepared statement') &&
        errorMsg.includes('does not exist')
      );
    }
    return false;
  }

  // Replace your current cleanupTransactions method with this version
  async cleanupTransactions() {
    try {
      // First, always use $executeRawUnsafe to deallocate statements
      await this.safeDeallocate();

      // Then terminate idle transactions
      await this.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE state = 'idle in transaction'
        AND query_start < NOW() - interval '5 minutes'
      `);

      // Use debug level to reduce log noise
      this.logger.debug('Successfully cleaned up stale database transactions');
    } catch (error) {
      // Only log at debug level for common cleanup failures
      this.logger.debug(
        'Failed to clean up transactions, but continuing startup',
        error instanceof Error ? error.message : String(error),
      );

      // If we fail with the current connection, try with a completely separate connection
      try {
        // Create a fresh PostgreSQL connection using the native driver
        // This is a more direct approach that bypasses Prisma's connection pool
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });

        // Execute the cleanup directly
        const client = await pool.connect();
        try {
          await client.query('DEALLOCATE ALL');
          this.logger.debug(
            'Successfully cleaned up with direct PostgreSQL connection',
          );
        } finally {
          client.release();
          await pool.end();
        }
      } catch (pgError) {
        // Only log at debug level for common failures
        this.logger.debug(
          'Failed to clean up with direct connection, proceeding with caution',
          pgError instanceof Error ? pgError.message : String(pgError),
        );
      }
    }
  }

  // Add this method for safer raw SQL execution
  async executeRawSafely(sql: string) {
    try {
      // Try to deallocate statements first
      await this.safeDeallocate();
      // Use executeRawUnsafe to prevent prepared statement issues
      return await this.$executeRawUnsafe(sql);
    } catch (error) {
      if (this.isPreparedStatementError(error)) {
        // Log at debug level for prepared statement issues
        this.logger.debug(
          'Prepared statement issue detected, attempting recovery',
          error instanceof Error ? error.message : String(error),
        );

        try {
          // Try to deallocate all statements first
          await this.$executeRawUnsafe('DEALLOCATE ALL');

          // Then retry the original query
          return await this.$executeRawUnsafe(sql);
        } catch (retryError) {
          this.logger.error(
            `Failed to recover from prepared statement error: ${
              retryError instanceof Error ? retryError.message : 'Unknown error'
            }`,
            retryError instanceof Error ? retryError.stack : undefined,
          );
          throw retryError;
        }
      }

      // If it's not a prepared statement issue, rethrow
      throw error;
    }
  }

  // Helper method to safely execute queries with retries
  async safeQuery<T>(queryFn: () => Promise<T>, retries = 3): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < retries; i++) {
      try {
        // Try to deallocate statements before each query
        await this.safeDeallocate();
        return await queryFn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (
          error instanceof Error &&
          (error.message.includes('prepared statement') ||
            error.message.includes('connection'))
        ) {
          // If it's a connection or prepared statement error, try to reconnect
          await this.$disconnect();
          await this.$connect();
          // Wait a bit before retrying
          await new Promise((resolve) => setTimeout(resolve, 100 * (i + 1)));
          continue;
        }
        throw error;
      }
    }

    throw lastError || new Error('Failed to execute query after retries');
  }

  // Helper method to determine if an error is retryable
  private isRetryableError(error: unknown): boolean {
    // Check for prepared statement errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof (error as { message: unknown }).message === 'string'
    ) {
      const errorMessage = (error as { message: string }).message.toLowerCase();

      // Check various transient error messages
      return (
        errorMessage.includes('prepared statement') ||
        errorMessage.includes('already exists') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection pool') ||
        errorMessage.includes('deadlock') ||
        errorMessage.includes('serialization') ||
        errorMessage.includes('too many clients')
      );
    }

    // Check for specific Prisma error codes
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Common retryable error codes
      return [
        'P1001', // Connection error
        'P1002', // Connection timed out
        'P1008', // Operation timed out
        'P1017', // Connection pooling error
        'P2024', // Timed out fetching
        'P2028', // Transaction API error
        'P2034', // Transaction deadlock
      ].includes(error.code);
    }

    return false;
  }

  // Update this method to work with Prisma 5.0.0+
  enableShutdownHooks(app: { close: () => Promise<void> }) {
    // Use process events instead of Prisma's beforeExit hook
    process.on('beforeExit', () => {
      void (async () => {
        this.logger.log(
          'Detected process beforeExit event, shutting down gracefully',
        );
        await app.close();
      })();
    });

    // Add other graceful shutdown handlers
    process.on('SIGINT', () => {
      void (async () => {
        this.logger.log('Detected SIGINT signal, shutting down gracefully');
        await this.$disconnect();
        process.exit(0);
      })();
    });

    process.on('SIGTERM', () => {
      void (async () => {
        this.logger.log('Detected SIGTERM signal, shutting down gracefully');
        await this.$disconnect();
        process.exit(0);
      })();
    });
  }

  // Add this new method to your service
  async executeDirectQuery(sql: string, params: any[] = []) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    try {
      const client = await pool.connect();
      try {
        const result = await client.query(sql, params);
        return result.rows as { [key: string]: any }[];
      } finally {
        client.release();
      }
    } finally {
      await pool.end();
    }
  }
}
