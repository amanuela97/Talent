import {
  IsString,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TalentStatus } from '@prisma/client';

export class UpdateTalentDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[]; // Array of category IDs to associate with talent

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedCategories?: string[]; // Category IDs to remove from talent

  @IsOptional()
  @IsString()
  serviceName?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  status?: TalentStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsString()
  verificationToken?: string;

  @IsOptional()
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagesSpoken?: string[];

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hourlyRate?: number;

  @IsOptional()
  @IsString()
  city?: string; // Add this for direct city access

  @IsOptional()
  @IsObject()
  availability?: Record<string, any>;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mediasToRemove?: string[];
}
