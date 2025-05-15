// Updated DTOs
import { CategoryType } from '@prisma/client';

export interface CategoryDto {
  id: string;
  type: CategoryType;
}
