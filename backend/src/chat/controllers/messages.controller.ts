/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import {
  MessagesService,
  CreateMessageResponse,
} from '../services/messages.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestWithUser } from 'src/backendTypes';

@ApiTags('Messages')
@Controller('conversations/:conversationId/messages')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @ApiOperation({ summary: 'Send a new message to a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async create(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Request() req: RequestWithUser,
  ): Promise<CreateMessageResponse> {
    // Ensure conversationId from param matches DTO
    const messageDto = {
      ...createMessageDto,
      conversationId,
      senderId: req.user.userId,
    };

    return await this.messagesService.create(messageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get messages from a conversation' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiQuery({
    name: 'skip',
    required: false,
    description: 'Number of items to skip',
  })
  @ApiQuery({
    name: 'take',
    required: false,
    description: 'Number of items to take',
  })
  @ApiResponse({ status: 200, description: 'List of messages' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async findAll(
    @Param('conversationId') conversationId: string,
    @Request() req: RequestWithUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.messagesService.findAllInConversation(
      conversationId,
      req.user.userId,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 20,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific message' })
  @ApiParam({ name: 'conversationId', description: 'Conversation ID' })
  @ApiParam({ name: 'id', description: 'Message ID' })
  @ApiResponse({ status: 200, description: 'Message details' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async findOne(
    @Param('conversationId') conversationId: string,
    @Param('id') id: string,
  ) {
    try {
      const message = await this.messagesService.findOne(id);

      // Verify message belongs to the specified conversation
      if (message.conversationId !== conversationId) {
        throw new NotFoundException('Message not found in this conversation');
      }

      return message;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error in findOne:', error.message);
      } else {
        console.error('Unknown error in findOne:', error);
      }

      throw new NotFoundException('Message not found');
    }
  }
}
