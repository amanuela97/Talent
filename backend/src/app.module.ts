import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { TalentModule } from './talent/talent.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { MailModule } from './mail/mail.module';
import { BookingsModule } from './bookings/bookings.module';
import { CategoryModule } from './category/category.module';
import { ChatGateway } from './chat/gateways/chat.gateway';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: path.resolve(process.cwd(), '.env'),
      cache: true,
      expandVariables: true,
    }),
    UserModule,
    AuthModule,
    TalentModule,
    ChatModule,
    HealthModule,
    MailModule,
    BookingsModule,
    CategoryModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, ChatGateway, JwtService],
  exports: [PrismaService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly prismaService: PrismaService) { }

  async onModuleInit() {
    // Clean up any stale connections when app starts
    await this.prismaService.cleanupTransactions();
  }
}
