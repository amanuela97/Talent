import { CategoryStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCategoryStatusDto {
  @IsEnum(CategoryStatus)
  status: CategoryStatus;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}
