import { TalentStatus } from '@prisma/client';
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

export class CreateTalentDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  email: string;

  @IsString()
  serviceName: string;

  @IsString()
  address: string;

  @IsString()
  phoneNumber: string;

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
  isEmailVerified?: boolean;

  @IsString()
  verificationToken: string;

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
  @IsObject()
  socialLinks?: Record<string, any>;

  @IsArray()
  @IsString({ each: true })
  generalCategories: string[];

  @IsArray()
  @IsString({ each: true })
  specificCategories: string[];
}
