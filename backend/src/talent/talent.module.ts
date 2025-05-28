import { Module } from '@nestjs/common';
import { TalentService } from './talent.service';
import { TalentController } from './talent.controller';
import { CalendarEventsController } from './calendar-events.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [CloudinaryModule],
  controllers: [TalentController, CalendarEventsController],
  providers: [
    TalentService,
    PrismaService,
    JwtService,
    MailService,
  ],
})
export class TalentModule { }
