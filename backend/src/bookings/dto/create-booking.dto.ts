import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsArray,
  IsInt,
  IsDate,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class CreateBookingDto {
  @IsUUID()
  talentId: string;

  @IsString()
  eventType: string;

  @IsString()
  @IsOptional()
  equipmentNeeded?: string;

  @IsInt()
  guestCount: number;

  @IsString()
  location: string;

  @IsDate()
  @Type(() => Date)
  eventDate: Date;

  @IsString()
  eventTime: string;

  @IsInt()
  @IsNumber()
  @Min(1)
  @Max(24)
  duration: number;

  @IsString()
  budgetRange: string;

  @IsNumber()
  @IsOptional()
  budgetAmount?: number;

  @IsArray()
  @IsString({ each: true })
  serviceRequirements: string[];

  @IsString()
  @IsOptional()
  additionalComments?: string;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;
}
