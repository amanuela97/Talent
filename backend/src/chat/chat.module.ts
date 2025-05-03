import { Module } from '@nestjs/common';
import { ConversationsController } from './controllers/conversations.controller';
import { MessagesController } from './controllers/messages.controller';
import { ReadStatusController } from './controllers/read-status.controller';
import { ChatGateway } from './gateways/chat.gateway';
import { ConversationsService } from './services/conversations.service';
import { MessagesService } from './services/messages.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [
    ConversationsController,
    MessagesController,
    ReadStatusController,
  ],
  providers: [
    ConversationsService,
    MessagesService,
    ChatGateway,
    PrismaService,
    JwtService,
    ConfigService,
  ],
  exports: [ConversationsService, MessagesService],
})
export class ChatModule {}
