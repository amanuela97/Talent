import {
  IsString,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
  IsBoolean,
  IsEnum,
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
  bio?: string;

  @IsOptional()
  @IsEnum(TalentStatus)
  status?: TalentStatus;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsString()
  verificationToken?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isOnline?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languagesSpoken?: string[];

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
  city?: string;

  @IsOptional()
  @IsObject()
  availability?: Record<string, any>;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  removedCategories?: string[];
}
