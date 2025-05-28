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

    try {
      // Check if user is part of the conversation
      const userInConversation =
        await this.prisma.userOnConversation.findUnique({
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

      // Retry logic for transaction
      const maxRetries = 3;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Create message in a single transaction with improved deduplication
          const message = await this.prisma.$transaction(
            async (tx) => {
              // Check for duplicate message with a longer time window
              const recentMessage = await tx.message.findFirst({
                where: {
                  conversationId,
                  senderId,
                  content,
                  createdAt: {
                    gte: new Date(Date.now() - 5000), // Increased to 5 seconds
                  },
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
              });

              if (recentMessage) {
                console.log(
                  'Duplicate message detected in transaction, returning existing message:',
                  {
                    messageId: recentMessage.id,
                    timeSinceCreation:
                      Date.now() - recentMessage.createdAt.getTime(),
                  },
                );
                return recentMessage;
              }

              // If no duplicate found, create new message
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
                  readStatuses: true,
                },
              });

              console.log('Created new message:', {
                messageId: createdMessage.id,
                timestamp: createdMessage.createdAt,
              });

              return createdMessage;
            },
            {
              maxWait: 5000, // 5 seconds
              timeout: 10000, // 10 seconds
              isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
            },
          );

          return message;
        } catch (error) {
          lastError = error;
          if (
            error instanceof Prisma.PrismaClientKnownRequestError &&
            error.code === 'P2034'
          ) {
            // Transaction deadlock, wait and retry
            console.log(
              `Transaction deadlock detected, attempt ${attempt + 1} of ${maxRetries}`,
            );
            await new Promise((resolve) =>
              setTimeout(resolve, 100 * Math.pow(2, attempt)),
            ); // Exponential backoff
            continue;
          }
          throw error;
        }
      }

      throw lastError || new Error('Failed to create message after retries');
    } catch (error) {
      console.error('Error creating message:', error);
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new Error('Failed to create message');
    }
  }

  async findAllInConversation(
    conversationId: string,
    userId: string,
    skip = 0,
    take = 20,
  ): Promise<Message[]> {
    // Verify user is in conversation
    const userInConversation = await this.prisma.safeQuery(async () => {
      return await this.prisma.userOnConversation.findUnique({
        where: {
          userId_conversationId: {
            userId,
            conversationId,
          },
        },
      });
    });

    if (!userInConversation) {
      throw new ForbiddenException('User is not part of this conversation');
    }

    // Get messages with read statuses
    return await this.prisma.safeQuery(async () => {
      return await this.prisma.message.findMany({
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
    });
  }

  async findOne(id: string): Promise<FindOneMessageResponse> {
    const message = await this.prisma.safeQuery(async () => {
      return await this.prisma.message.findUnique({
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
    try {
      // Check if message exists and get read statuses in a single query
      const message = await this.prisma.safeQuery(async () => {
        return await this.prisma.message.findUnique({
          where: { id: messageId },
          include: {
            readStatuses: true,
          },
        });
      });

      if (!message) {
        throw new NotFoundException(`Message with ID ${messageId} not found`);
      }

      // Check if user is part of the conversation
      const userInConversation = await this.prisma.safeQuery(async () => {
        return await this.prisma.userOnConversation.findFirst({
          where: {
            userId,
            conversationId: message.conversationId,
          },
        });
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

      // Create read status using upsert to handle race conditions
      return await this.prisma.safeQuery(async () => {
        return await this.prisma.messageReadStatus.upsert({
          where: {
            messageId_userId: {
              messageId,
              userId,
            },
          },
          create: {
            messageId,
            userId,
          },
          update: {}, // No update needed, just return existing
        });
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new Error('Failed to mark message as read');
    }
  }

  async getReadStatus(
    messageId: string,
    userId: string,
  ): Promise<MessageReadStatus[]> {
    return await this.prisma.safeQuery(async () => {
      return await this.prisma.messageReadStatus.findMany({
        where: {
          messageId,
          userId,
        },
      });
    });
  }

  async findRecentMessage(
    conversationId: string,
    senderId: string,
    content: string,
    timeWindowMs: number,
  ): Promise<CreateMessageResponse | null> {
    try {
      const recentMessage = await this.prisma.safeQuery(async () => {
        return await this.prisma.message.findFirst({
          where: {
            conversationId,
            senderId,
            content,
            createdAt: {
              gte: new Date(Date.now() - timeWindowMs),
            },
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
          orderBy: {
            createdAt: 'desc',
          },
        });
      });

      if (recentMessage) {
        console.log('Found recent duplicate message:', {
          messageId: recentMessage.id,
          content,
          timeWindowMs,
        });
      }

      return recentMessage;
    } catch (error) {
      console.error('Error finding recent message:', error);
      return null;
    }
  }
}
