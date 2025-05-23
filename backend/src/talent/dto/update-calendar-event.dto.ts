import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { CalendarEventType } from '@prisma/client';

export class UpdateCalendarEventDto {
  @IsEnum(CalendarEventType)
  @IsOptional()
  type?: CalendarEventType; // "available" | "unavailable" | "booked" | etc.

  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  start?: string;

  @IsDateString()
  @IsOptional()
  end?: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  clientName?: string;

  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;
}
