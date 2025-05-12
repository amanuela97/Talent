import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { CalendarEventType } from '@prisma/client';
export class CreateCalendarEventDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(CalendarEventType)
  type: CalendarEventType; // "available" | "unavailable" | "booked" | etc.

  @IsString()
  title: string;

  @IsDateString()
  start: string;

  @IsDateString()
  end: string;

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
