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

  constructor() {
    super({
      log: ['error', 'warn'],
      // Add connection management settings to help prevent connection issues
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Successfully connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database');
  }

  // Replace your current cleanupTransactions method with this version
  async cleanupTransactions() {
    try {
      // First, always use $executeRawUnsafe instead of $queryRaw to avoid
      // prepared statement issues during the cleanup itself
      await this.$executeRawUnsafe('DEALLOCATE ALL');
      this.logger.log('Successfully deallocated all prepared statements');

      // Then terminate idle transactions
      await this.$executeRawUnsafe(`
        SELECT pg_terminate_backend(pid) 
        FROM pg_stat_activity 
        WHERE state = 'idle in transaction'
        AND query_start < NOW() - interval '5 minutes'
      `);

      this.logger.log('Successfully cleaned up stale database transactions');
    } catch (error) {
      this.logger.warn(
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
          this.logger.log(
            'Successfully cleaned up with direct PostgreSQL connection',
          );
        } finally {
          client.release();
          await pool.end();
        }
      } catch (pgError) {
        this.logger.warn(
          'Failed to clean up even with direct connection, proceeding with caution',
          pgError instanceof Error ? pgError.message : String(pgError),
        );
        // At this point, we've tried our best, so we'll just continue
      }
    }
  }

  // Add this method for safer raw SQL execution
  async executeRawSafely(sql: string) {
    try {
      // Use executeRawUnsafe to prevent prepared statement issues
      return await this.$executeRawUnsafe(sql);
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string' &&
        ((error as { message: string }).message.includes(
          'prepared statement',
        ) ||
          (error as { message: string }).message.includes('already exists'))
      ) {
        this.logger.warn(
          `Prepared statement issue detected, attempting recovery: ${
            typeof error === 'object' && error !== null && 'message' in error
              ? String((error as { message: unknown }).message)
              : 'Unknown error'
          }`,
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

  // Update the safeQuery method to include retry logic
  async safeQuery<T>(queryFn: () => Promise<T>, retryCount = 0): Promise<T> {
    const MAX_RETRIES = 2;

    try {
      return await queryFn();
    } catch (error) {
      // Handle the specific "prepared statement already exists" error
      if (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string' &&
        (error as { message: string }).message.includes('prepared statement') &&
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as { message: unknown }).message === 'string' &&
        (error as { message: string }).message.includes('already exists') &&
        retryCount < MAX_RETRIES
      ) {
        this.logger.warn(
          `Prepared statement error detected, attempting recovery (retry ${retryCount + 1}/${MAX_RETRIES})`,
        );

        try {
          // Try to deallocate all statements
          await this.$executeRawUnsafe('DEALLOCATE ALL');

          // Then retry the query with incremented retry count
          return await this.safeQuery(queryFn, retryCount + 1);
        } catch (cleanupError) {
          this.logger.error(
            `Failed to recover from prepared statement error: ${
              cleanupError instanceof Error
                ? cleanupError.message
                : 'Unknown error'
            }`,
            cleanupError instanceof Error ? cleanupError.stack : undefined,
          );
        }
      }

      // Existing error handling logic
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

      // For all other errors, throw a generic 500 error
      throw new InternalServerErrorException(
        'An unexpected error occurred while accessing the database',
      );
    }
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
