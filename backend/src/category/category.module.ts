import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, PrismaService, JwtService],
  exports: [CategoryService],
})
export class CategoryModule {}
