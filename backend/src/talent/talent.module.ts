import { Module } from '@nestjs/common';
import { TalentService } from './talent.service';
import { TalentController } from './talent.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [TalentController],
  providers: [
    TalentService,
    CloudinaryService,
    PrismaService,
    JwtService,
    ConfigService,
  ],
})
export class TalentModule {}
