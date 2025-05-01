import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { MessagesService } from '../services/messages.service';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RequestWithUser } from 'src/backendTypes';
import { MessageReadStatus } from '@prisma/client';

@ApiTags('Message Read Status')
@Controller('messages/:messageId/read-status')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ReadStatusController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Mark a message as read by current user' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({ status: 201, description: 'Message marked as read' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async markAsRead(
    @Param('messageId') messageId: string,
    @Request() req: RequestWithUser,
  ): Promise<MessageReadStatus> {
    return await this.messagesService.markAsRead(messageId, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get read status for a message' })
  @ApiParam({ name: 'messageId', description: 'Message ID' })
  @ApiResponse({
    status: 200,
    description: 'List of users who have read the message',
  })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async getReadStatus(
    @Param('messageId') messageId: string,
    @Request() req: RequestWithUser,
  ): Promise<MessageReadStatus[]> {
    return await this.messagesService.getReadStatus(messageId, req.user.userId);
  }
}
