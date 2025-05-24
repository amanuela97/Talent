import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateConversationDto } from '../dto/create-conversation.dto';
import { UpdateConversationDto } from '../dto/update-conversation.dto';
import { Conversation, UserOnConversation } from '@prisma/client';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createConversationDto: CreateConversationDto,
    creatorId: string,
  ): Promise<Conversation> {
    const { participantIds, isGroup, name, groupImage } = createConversationDto;

    // Ensure creator is included in participants
    if (!participantIds.includes(creatorId)) {
      participantIds.push(creatorId);
    }

    // For non-group chats, ensure exactly 2 participants
    if (!isGroup && participantIds.length !== 2) {
      throw new BadRequestException(
        'Non-group conversations must have exactly 2 participants',
      );
    }

    // For non-group chats, check if conversation already exists
    if (!isGroup) {
      const existingConversation = await this.findOneToOneConversation(
        creatorId,
        participantIds[0] === creatorId ? participantIds[1] : participantIds[0],
      );
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create the conversation
    return await this.prisma.safeQuery(async () => {
      return await this.prisma.$transaction(async (tx) => {
        // Create conversation
        const conversation = await tx.conversation.create({
          data: {
            isGroup: isGroup || false,
            name: isGroup ? name : null,
            groupImage: isGroup ? groupImage : null,
          },
        });

        // Create participant associations
        await tx.userOnConversation.createMany({
          data: participantIds.map((userId) => ({
            userId,
            conversationId: conversation.id,
          })),
        });

        return conversation;
      });
    });
  }

  async findAll(userId: string, skip = 0, take = 20): Promise<Conversation[]> {
    return await this.prisma.safeQuery(() =>
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  userId: true,
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            include: {
              readStatuses: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        skip,
        take,
      }),
    );
  }

  async findAllForUser(userId: string): Promise<{ id: string }[]> {
    return await this.prisma.safeQuery(() =>
      this.prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        select: {
          id: true,
        },
      }),
    );
  }

  async findOne(id: string, userId: string): Promise<Conversation> {
    const conversation = await this.prisma.safeQuery(() =>
      this.prisma.conversation.findUnique({
        where: { id },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  userId: true,
                  name: true,
                  profilePicture: true,
                },
              },
            },
          },
          messages: {
            orderBy: {
              createdAt: 'asc',
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
          },
        },
      }),
    );

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // Check if user is a participant
    if (!this.isUserParticipant(conversation, userId)) {
      throw new ForbiddenException(
        'You are not a participant in this conversation',
      );
    }

    return conversation;
  }

  async update(
    id: string,
    updateConversationDto: UpdateConversationDto,
    userId: string,
  ): Promise<Conversation> {
    // Check if conversation exists and user is a participant
    const conversation = await this.findOne(id, userId);

    // Only allow updates for group conversations
    if (!conversation.isGroup) {
      throw new BadRequestException('Cannot update non-group conversations');
    }

    return await this.prisma.safeQuery(() =>
      this.prisma.conversation.update({
        where: { id },
        data: {
          name: updateConversationDto.name,
          groupImage: updateConversationDto.groupImage,
          isGroup: updateConversationDto.isGroup,
        },
      }),
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    // Check if conversation exists and user is a participant
    await this.findOne(id, userId);

    // Delete the conversation and related data
    await this.prisma.safeQuery(async () => {
      await this.prisma.$transaction(async (tx) => {
        await tx.messageReadStatus.deleteMany({
          where: {
            message: {
              conversationId: id,
            },
          },
        });

        await tx.message.deleteMany({
          where: {
            conversationId: id,
          },
        });

        await tx.userOnConversation.deleteMany({
          where: {
            conversationId: id,
          },
        });

        await tx.conversation.delete({
          where: { id },
        });
      });
    });
  }

  async findOneToOneConversation(
    userId1: string,
    userId2: string,
  ): Promise<Conversation | null> {
    // Find conversations where both users are participants and it's not a group
    const conversations = await this.prisma.safeQuery(() =>
      this.prisma.conversation.findMany({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: {
                in: [userId1, userId2],
              },
            },
          },
        },
        include: {
          participants: true,
        },
      }),
    );

    // Filter to find a conversation with exactly these two users
    for (const conversation of conversations) {
      if (conversation.participants.length === 2) {
        const participantIds = conversation.participants.map((p) => p.userId);
        if (
          participantIds.includes(userId1) &&
          participantIds.includes(userId2)
        ) {
          return conversation;
        }
      }
    }

    return null;
  }

  async isUserInConversation(
    userId: string,
    conversationId: string,
  ): Promise<boolean> {
    try {
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

      return !!userInConversation;
    } catch (error) {
      console.error('Error checking user in conversation:', error);
      return false;
    }
  }

  async touch(conversationId: string): Promise<void> {
    try {
      await this.prisma.safeQuery(async () => {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });
      });
    } catch (error) {
      console.error('Error updating conversation timestamp:', error);
    }
  }

  private isUserParticipant(
    conversation: Conversation & { participants: UserOnConversation[] },
    userId: string,
  ): boolean {
    return conversation.participants.some(
      (participant) => participant.userId === userId,
    );
  }
}
