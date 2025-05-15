import { CategoryType } from '@prisma/client';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(2, 50)
  name: string;

  @IsEnum(CategoryType)
  type: CategoryType;

  @IsOptional()
  @IsString()
  parentId?: string;
}
