import {
  Injectable,
  BadRequestException,
  NotFoundException,
  HttpException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CategoryStatus, CategoryType, Category } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  // Explicitly type prisma as PrismaService to avoid 'error' type issues
  constructor(private readonly prisma: PrismaService) {}

  // Helper function to add delay between retries
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Execute query with retry logic for transient database errors
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries = this.MAX_RETRIES,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (this.isTransientError(error) && retries > 0) {
        this.logger.warn(
          `Transient database error detected. Retrying... (${this.MAX_RETRIES - retries + 1}/${this.MAX_RETRIES})`,
        );
        await this.delay(this.RETRY_DELAY);
        return this.executeWithRetry(operation, retries - 1);
      }
      throw error;
    }
  }

  // Determine if an error is transient and can be retried
  private isTransientError(error: unknown): boolean {
    // Check for connection errors or deadlocks
    if (
      error instanceof PrismaClientKnownRequestError &&
      (error.code === 'P1001' || // Connection error
        error.code === 'P1008' || // Operation timed out
        error.code === 'P1017' || // Connection pooling error
        error.code === 'P2034') // Transaction deadlock
    ) {
      return true;
    }

    // Check for prepared statement errors
    if (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      typeof error.message === 'string' &&
      (error.message.includes('prepared statement') ||
        error.message.includes('ConnectorError'))
    ) {
      return true;
    }

    return false;
  }

  async findAll({
    type,
    search,
    parentId,
    status,
  }: {
    type?: CategoryType;
    search?: string;
    parentId?: string;
    status?: CategoryStatus;
  }): Promise<Category[]> {
    try {
      return await this.executeWithRetry(async () => {
        const categories = await this.prisma.safeQuery(() =>
          this.prisma.category.findMany({
            where: {
              type: type,
              parentId: parentId,
              status: status || undefined, // Remove default to fetch all statuses if not specified
              ...(search
                ? {
                    name: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  }
                : {}),
            },
            orderBy: { name: 'asc' },
            include: {
              parent: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                },
              },
            },
          }),
        );

        if (!categories || categories.length === 0) {
          return [];
        }
        return categories;
      });
    } catch (error: unknown) {
      this.logger.error(
        `Error in findAll categories: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof HttpException) {
        throw error; // Re-throw known HTTP exceptions
      }

      throw new InternalServerErrorException(
        'Failed to fetch categories. Please try again later.',
      );
    }
  }

  // Helper function to calculate Levenshtein distance for fuzzy matching
  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
      .fill(null)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= b.length; j++) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + substitutionCost, // substitution
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return matrix[b.length][a.length];
  }

  // Check if the name is similar to any existing category
  private isSimilarToExisting(
    name: string,
    existingCategories: Category[],
  ): Category | null {
    const normalizedInput = name.toLowerCase().trim();

    // Check for exact matches (case-insensitive)
    const exactMatch = existingCategories.find(
      (cat) => cat.name.toLowerCase().trim() === normalizedInput,
    );

    if (exactMatch) {
      return exactMatch;
    }

    // Check for very similar names using Levenshtein distance
    const similarCategories = existingCategories.filter((cat) => {
      const normalizedCatName = cat.name.toLowerCase().trim();

      // Calculate similarity
      const distance = this.levenshteinDistance(
        normalizedInput,
        normalizedCatName,
      );
      const maxLength = Math.max(
        normalizedInput.length,
        normalizedCatName.length,
      );
      const similarityRatio = 1 - distance / maxLength;

      // Consider it similar if distance is small or similarity ratio is high
      return distance <= 2 || similarityRatio >= 0.85;
    });

    return similarCategories.length > 0 ? similarCategories[0] : null;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    try {
      // Normalize the category name to prevent duplicates with different casing
      const normalizedName = dto.name.trim();

      // Get all existing categories of the same type and parent (including all statuses)
      const existingCategories = await this.executeWithRetry(() =>
        this.prisma.category.findMany({
          where: {
            type: dto.type,
            parentId: dto.parentId || null,
          },
        }),
      );

      // Check for exact match or similar category
      const similarCategory = this.isSimilarToExisting(
        normalizedName,
        existingCategories,
      );

      if (similarCategory) {
        let errorMessage = 'Category already exists or is pending';

        // If we found a similar (but not exact) category, include its name
        if (
          similarCategory.name.toLowerCase() !== normalizedName.toLowerCase()
        ) {
          errorMessage = `Category name is too similar to existing category "${similarCategory.name}"`;
        }

        throw new BadRequestException(errorMessage);
      }

      // If no duplicate or similar category found, proceed with creation
      return await this.executeWithRetry(() =>
        this.prisma.safeQuery(() =>
          this.prisma.category.create({
            data: {
              name: normalizedName, // Use the normalized name
              type: dto.type,
              parentId: dto.parentId || null,
              status: CategoryStatus.PENDING,
            },
          }),
        ),
      );
    } catch (error) {
      this.logger.error(
        `Error creating category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      // If it's already a BadRequestException, just rethrow it
      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create category. Please try again later.',
      );
    }
  }

  async updateStatus(
    id: string,
    status: CategoryStatus,
    name?: string,
    parentId?: string,
  ): Promise<Category> {
    try {
      return await this.executeWithRetry(() =>
        this.prisma.safeQuery(async () => {
          const category = await this.prisma.category.findUnique({
            where: { id },
          });
          if (!category) throw new NotFoundException('Category not found');

          return this.prisma.category.update({
            where: { id },
            data: {
              status,
              ...(name ? { name } : {}),
              ...(parentId !== undefined ? { parentId: parentId || null } : {}),
            },
          });
        }),
      );
    } catch (error) {
      this.logger.error(
        `Error updating category status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to update category. Please try again later.',
      );
    }
  }

  // Add a new method to delete a category
  async deleteCategory(id: string): Promise<void> {
    try {
      await this.executeWithRetry(async () => {
        const category = await this.prisma.category.findUnique({
          where: { id },
        });
        if (!category) {
          throw new NotFoundException('Category not found');
        }

        await this.prisma.category.delete({ where: { id } });
      });
    } catch (error) {
      this.logger.error(
        `Error deleting category: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to delete the category. Please try again later.',
      );
    }
  }
}
