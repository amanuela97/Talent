import { IsEnum } from 'class-validator';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingStatusDto {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
