import { CategoryStatus, CategoryType } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class GetCategoriesDto {
  @IsOptional()
  @IsEnum(CategoryType, { message: 'Invalid category type' })
  type?: CategoryType;

  @IsOptional()
  @IsEnum(CategoryStatus, { message: 'Invalid category status' })
  status?: CategoryStatus;

  @IsOptional()
  @IsString({ message: 'Invalid parent ID' })
  parentId?: string;

  @IsOptional()
  @IsString({ message: 'Invalid search term' })
  search?: string;
}
