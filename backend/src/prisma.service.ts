import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  NotFoundException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private static instance: PrismaService;

  constructor() {
    super({
      log: ['error', 'warn'],
      // Add connection pool configuration
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    if (!PrismaService.instance) {
      PrismaService.instance = this;
    }

    return PrismaService.instance;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method to clean up stale transactions
  async cleanupTransactions() {
    try {
      // Kill idle transactions
      await this
        .$executeRaw`SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND pid <> pg_backend_pid();`;

      // Release statement handles that might be stuck
      await this.$executeRaw`DEALLOCATE ALL;`;
    } catch (error) {
      console.error('Failed to cleanup transactions:', error);
    }
  }

  // Wrapper for user.findUnique that handles the prepared statement error
  async safeQuery<T>(queryFn: () => Promise<T>): Promise<T> {
    try {
      return await queryFn();
    } catch (error: unknown) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof Error) {
        console.error(`Prisma query error: ${error.message}`, error.stack);
      } else {
        console.error('Prisma query error:', error);
      }

      if (
        (error instanceof Error &&
          error.message.includes('prepared statement')) ||
        (typeof error === 'object' &&
          error !== null &&
          'code' in error &&
          (error as { code: string }).code === '42P05')
      ) {
        await this.cleanupTransactions();
        // Retry once after cleaning up
        return await queryFn();
      }
      throw error;
    }
  }
}
