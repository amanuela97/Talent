import { Module } from '@nestjs/common';
import { TalentService } from './talent.service';
import { TalentController } from './talent.controller';
import { CalendarEventsController } from './calendar-events.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  controllers: [TalentController, CalendarEventsController],
  providers: [
    TalentService,
    CloudinaryService,
    PrismaService,
    JwtService,
    MailService,
  ],
})
export class TalentModule {}
