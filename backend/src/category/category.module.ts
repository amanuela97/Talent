import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, JwtService, ConfigService],
  exports: [CategoryService],
})
export class CategoryModule {}
