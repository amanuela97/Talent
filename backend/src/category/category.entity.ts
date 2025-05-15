import { CategoryStatus, CategoryType } from '@prisma/client';

export class CategoryEntity {
  id: string;
  name: string;
  type: CategoryType;
  parentId?: string | null;
  status: CategoryStatus;
  createdAt: Date;
  updatedAt: Date;
}
