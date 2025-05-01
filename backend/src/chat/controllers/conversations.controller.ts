import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { ConversationsService } from '../services/conversations.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RequestWithUser } from 'src/backendTypes';
import { Conversation } from '@prisma/client';

@ApiTags('Conversations')
@Controller('conversations')
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiResponse({
    status: 201,
    description: 'Conversation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(
    @Body() createConversationDto: CreateConversationDto,
    @Request() req: RequestWithUser,
  ): Promise<Conversation> {
    return this.conversationsService.create(
      createConversationDto,
      req.user.userId,
    );
  }

  @Get()
  @ApiOperation({ summary: "List user's conversations" })
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
  @ApiResponse({ status: 200, description: 'List of conversations' })
  async findAll(
    @Request() req: RequestWithUser,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ): Promise<Conversation[]> {
    return this.conversationsService.findAll(
      req.user.userId,
      skip ? parseInt(skip) : 0,
      take ? parseInt(take) : 10,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({ status: 200, description: 'Conversation details' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<Conversation> {
    return await this.conversationsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a conversation (rename group, etc.)' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async update(
    @Param('id') id: string,
    @Body() updateConversationDto: UpdateConversationDto,
    @Request() req: RequestWithUser,
  ): Promise<Conversation> {
    return await this.conversationsService.update(
      id,
      updateConversationDto,
      req.user.userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a conversation' })
  @ApiParam({ name: 'id', description: 'Conversation ID' })
  @ApiResponse({
    status: 200,
    description: 'Conversation deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user not part of conversation',
  })
  async remove(@Param('id') id: string, @Request() req: RequestWithUser) {
    await this.conversationsService.remove(id, req.user.userId);
    return { message: 'Conversation deleted successfully' };
  }
}
