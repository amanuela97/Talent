/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateMessageDto } from '../dto/create-message.dto';
import { Prisma, Message, MessageReadStatus } from '@prisma/client';

export type CreateMessageResponse = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        userId: true;
        name: true;
        profilePicture: true;
      };
    };
  };
}>;

export type FindOneMessageResponse = Prisma.MessageGetPayload<{
  include: {
    sender: {
      select: {
        userId: true;
        name: true;
        profilePicture: true;
      };
    };
    readStatuses: true;
  };
}>;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createMessageDto: CreateMessageDto,
  ): Promise<CreateMessageResponse> {
    const { content, conversationId, senderId } = createMessageDto;

    if (!senderId) {
      throw new ForbiddenException('Sender ID is required');
    }

    // Check if user is part of the conversation
    const userInConversation = await this.prisma.userOnConversation.findUnique({
      where: {
        userId_conversationId: {
          userId: senderId,
          conversationId,
        },
      },
    });

    if (!userInConversation) {
      throw new ForbiddenException('User is not part of this conversation');
    }

    // Create message and automatically mark as read by sender
    const message: CreateMessageResponse = await this.prisma.$transaction(
      async (tx) => {
        const createdMessage = await tx.message.create({
          data: {
            content,
            conversationId,
            senderId,
          },
          include: {
            sender: {
              select: {
                userId: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        });

        // Mark as read by sender
        await tx.messageReadStatus.create({
          data: {
            messageId: createdMessage.id,
            userId: senderId,
          },
        });

        return createdMessage;
      },
    );

    return message;
  }

  async findAllInConversation(
    conversationId: string,
    userId: string,
    skip = 0,
    take = 20,
  ): Promise<Message[]> {
    // Verify user is in conversation
    const userInConversation = await this.prisma.userOnConversation.findUnique({
      where: {
        userId_conversationId: {
          userId,
          conversationId,
        },
      },
    });

    if (!userInConversation) {
      throw new ForbiddenException('User is not part of this conversation');
    }

    // Get messages with read statuses
    return this.prisma.message.findMany({
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            profilePicture: true,
          },
        },
        readStatuses: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async findOne(id: string): Promise<FindOneMessageResponse> {
    const message = await this.prisma.message.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            userId: true,
            name: true,
            profilePicture: true,
          },
        },
        readStatuses: true,
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async markAsRead(
    messageId: string,
    userId: string,
  ): Promise<MessageReadStatus> {
    // Check if message exists
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: {
        readStatuses: true,
      },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Check if user is part of the conversation
    const userInConversation = await this.prisma.userOnConversation.findFirst({
      where: {
        userId,
        conversationId: message.conversationId,
      },
    });

    if (!userInConversation) {
      throw new ForbiddenException('User is not part of this conversation');
    }

    // Check if already marked as read
    const existingReadStatus = message.readStatuses.find(
      (status) => status.userId === userId,
    );

    if (existingReadStatus) {
      return existingReadStatus;
    }

    // Mark as read
    return this.prisma.messageReadStatus.create({
      data: {
        messageId,
        userId,
      },
    });
  }

  async getReadStatus(
    messageId: string,
    userId: string,
  ): Promise<MessageReadStatus[]> {
    // Check if message exists
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Verify user can access the message
    const userInConversation = await this.prisma.userOnConversation.findFirst({
      where: {
        userId,
        conversationId: message.conversationId,
      },
    });

    if (!userInConversation) {
      throw new ForbiddenException('User is not part of this conversation');
    }

    // Get read statuses
    return this.prisma.messageReadStatus.findMany({
      where: {
        messageId,
      },
      include: {
        user: {
          select: {
            userId: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });
  }
}
