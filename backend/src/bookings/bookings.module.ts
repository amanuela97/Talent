import { Module } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { PrismaService } from 'src/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [BookingsController],
  providers: [
    BookingsService,
    PrismaService,
    JwtService,
    ConfigService,
    MailService,
  ],
})
export class BookingsModule {}
