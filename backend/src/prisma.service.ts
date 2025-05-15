import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
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
      // Only log errors, not warnings
      log: ['error'],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      // Connection pooling is managed internally by Prisma
      // We'll handle reconnection and cleanup logic in our health check
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
    // Run every 2 minutes - increased frequency to reduce issues
    this.connectionCheckInterval = setInterval(
      () => {
        // Use void operator to explicitly ignore the Promise result
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
      },
      2 * 60 * 1000,
    ); // 2 minutes, more frequent to reduce issues
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

  // Update the safeQuery method to suppress prepared statement error logs
  async safeQuery<T>(queryFn: () => Promise<T>, retryCount = 0): Promise<T> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 500; // Start with a 500ms delay

    try {
      // Deallocate prepared statements before each query attempt
      // Use our safer method with reduced logging
      await this.safeDeallocate();

      // Now execute the actual query
      return await queryFn();
    } catch (error) {
      // Handle retryable errors
      const isRetryableError = this.isRetryableError(error);
      const isPreparedError = this.isPreparedStatementError(error);

      if (isRetryableError && retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, retryCount); // Exponential backoff

        // Only log non-prepared statement errors or critical failures
        if (!isPreparedError || retryCount >= 2) {
          // Log at different levels based on retry count
          if (retryCount === 0) {
            // First retry - don't log prepared statement errors at all
            if (!isPreparedError) {
              this.logger.debug(
                `Database error detected, attempting recovery (retry ${retryCount + 1}/${MAX_RETRIES})`,
                error instanceof Error ? error.message : String(error),
              );
            }
          } else {
            // Subsequent retries - only log at warn level if it's not a prepared statement error
            if (!isPreparedError) {
              this.logger.warn(
                `Database error still occurring (retry ${retryCount + 1}/${MAX_RETRIES})`,
                error instanceof Error ? error.message : String(error),
              );
            }
          }
        }

        // Delay before retrying - use void to fix the Promise returned in void context error
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), delay);
        });

        try {
          // Try to clean up database state more aggressively
          await this.$executeRawUnsafe('DEALLOCATE ALL').catch(() => {
            // Silently catch errors from DEALLOCATE ALL
          });

          // Also try reconnecting to the database to reset the connection state
          if (retryCount >= 1) {
            // Only on second retry and beyond
            if (!isPreparedError) {
              this.logger.warn('Reconnecting to database before retry');
            }
            await this.$disconnect();
            await this.$connect();
          }

          // Then retry the query with incremented retry count
          return await this.safeQuery(queryFn, retryCount + 1);
        } catch (cleanupError) {
          // Only log if not a prepared statement error
          if (!this.isPreparedStatementError(cleanupError)) {
            this.logger.error(
              `Failed during error recovery process: ${
                cleanupError instanceof Error
                  ? cleanupError.message
                  : 'Unknown error'
              }`,
              cleanupError instanceof Error ? cleanupError.stack : undefined,
            );
          }

          // If we can't reconnect but still have retries left
          if (retryCount < MAX_RETRIES - 1) {
            // Add additional delay to let connections reset - fix void return type
            await new Promise<void>((resolve) => {
              setTimeout(() => resolve(), delay * 2);
            });
            // Still try to retry the original query with a direct query approach
            return await this.safeQuery(queryFn, retryCount + 1);
          } else {
            // We've tried everything, rethrow the original error
            throw error;
          }
        }
      }

      // For prepared statement errors that couldn't be retried, just transform to a generic error
      // to avoid exposing sensitive details
      if (isPreparedError) {
        throw new InternalServerErrorException('A database error occurred');
      }

      // Existing error handling logic for other errors
      if (error instanceof Error) {
        this.logger.error(`Prisma query error: ${error.message}`, error.stack);
      } else {
        this.logger.error('Prisma query error: Unknown error', error);
      }

      // Map Prisma errors to appropriate NestJS exceptions
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle not found error (P2025)
        if (error.code === 'P2025') {
          throw new NotFoundException('Record not found');
        }

        // Handle unique constraint violations (P2002)
        if (error.code === 'P2002') {
          throw new BadRequestException(
            `Unique constraint violation on field: ${(error.meta?.target as string[])?.join(', ') || 'unknown'}`,
          );
        }

        // Handle foreign key constraint failures (P2003)
        if (error.code === 'P2003') {
          throw new BadRequestException(
            `Foreign key constraint failed on field: ${String(error.meta?.field_name) || 'unknown'}`,
          );
        }
      }

      // Rethrow NotFoundException as it's likely intentional
      if (error instanceof NotFoundException) {
        throw error;
      }

      // Also rethrow BadRequestException as it's likely intentional
      if (error instanceof BadRequestException) {
        throw error;
      }

      // For all other errors, throw a generic 500 error
      throw new InternalServerErrorException(
        'An unexpected error occurred while accessing the database',
      );
    }
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
