import {
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

export class CreateBookingDto {
  @IsUUID()
  talentId: string;

  @IsDateString()
  eventDate: string;

  @IsString()
  eventType: string;

  @IsNumber()
  @Min(1)
  @Max(24)
  duration: number;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  comments?: string;
}
