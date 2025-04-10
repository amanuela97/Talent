import {
  IsString,
  IsArray,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Media } from '@prisma/client';

export class UpdateTalentDto {
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
  location?: string;

  @IsOptional()
  @IsObject()
  availability?: Record<string, string[]>;

  @IsOptional()
  @IsObject()
  socialLinks?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @Type(() => Object)
  mediasToRemove?: Media[];
}
