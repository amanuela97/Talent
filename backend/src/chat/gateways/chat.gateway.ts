/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../services/messages.service';
import { ConversationsService } from '../services/conversations.service';
import { WsJwtGuard } from '../../auth/guards/ws-jwt.guard';
import { CreateMessageDto } from '../dto/create-message.dto';
import { UserPayload } from 'src/backendTypes';
@WebSocketGateway(4001, {
  cors: {
    origin: '*', // In production, restrict this to your frontend domain
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map to store active user connections
  private userSocketMap = new Map<string, string[]>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token
        ? client.handshake.auth.token.split(' ')[1]
        : null;
      if (!token) {
        console.error('Token is undefined');
        client.disconnect();
        return;
      }

      if (typeof token !== 'string') {
        throw new Error('Invalid token format');
      }

      // Verify token and get user
      const decoded = this.jwtService.verify<UserPayload>(token);
      const userId = decoded.userId;

      // Store socket connection
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, []);
      }
      const userSockets = this.userSocketMap.get(userId);
      if (userSockets) {
        userSockets.push(client.id);
      }

      // Join socket rooms for all user's conversations
      const conversations =
        await this.conversationsService.findAllForUser(userId);
      if (!conversations) {
        throw new Error('Failed to fetch conversations for the user');
      }
      for (const conversation of conversations) {
        await client.join(`conversation-${conversation.id}`);
      }

      console.log(`User ${userId} connected with socket ${client.id}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Remove socket from userSocketMap
    for (const [userId, sockets] of this.userSocketMap.entries()) {
      const index = sockets.indexOf(client.id);
      if (index !== -1) {
        sockets.splice(index, 1);
        console.log(`User ${userId} disconnected socket ${client.id}`);
        if (sockets.length === 0) {
          this.userSocketMap.delete(userId);
        }
        break;
      }
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const { content, conversationId } = createMessageDto;
      const token = client.handshake.auth?.token?.split(' ')[1];
      if (!token) {
        throw new Error('Token is undefined');
      }
      if (typeof token !== 'string') {
        throw new Error('Invalid token format');
      }
      const decoded = this.jwtService.verify<UserPayload>(token);
      const senderId = decoded.userId;

      // Verify user belongs to conversation
      const isParticipant =
        await this.conversationsService.isUserInConversation(
          senderId,
          conversationId,
        );

      if (!isParticipant) {
        client.emit('error', {
          message: 'You are not part of this conversation',
        });
        return;
      }

      // Create message
      const message = await this.messagesService.create({
        content,
        conversationId,
        senderId,
      });

      if (!message || typeof message !== 'object') {
        throw new Error('Failed to create message');
      }

      // Update conversation updatedAt timestamp
      await this.conversationsService.touch(conversationId);

      // Broadcast to all participants in the conversation
      this.server
        .to(`conversation-${conversationId}`)
        .emit('newMessage', message);

      return message;
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markMessageRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const token = client.handshake.auth?.token?.split(' ')[1];
      if (!token) {
        throw new Error('Token is undefined');
      }
      if (typeof token !== 'string') {
        throw new Error('Invalid token format');
      }
      const decoded = this.jwtService.verify<UserPayload>(token);
      const userId = decoded.userId;

      const readStatus = await this.messagesService.markAsRead(
        data.messageId,
        userId,
      );
      const message = await this.messagesService.findOne(data.messageId);

      // Notify all users in the conversation about the read status
      this.server
        .to(`conversation-${message.conversationId}`)
        .emit('messageRead', {
          messageId: data.messageId,
          userId,
          readAt: readStatus.readAt,
        });

      return readStatus;
    } catch (error) {
      console.error('Error marking message as read:', error);
      client.emit('error', { message: 'Failed to mark message as read' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    try {
      const token = client.handshake.auth?.token?.split(' ')[1];
      if (!token) {
        throw new Error('Token is undefined');
      }
      if (typeof token !== 'string') {
        throw new Error('Invalid token format');
      }
      const decoded = this.jwtService.verify<UserPayload>(token);
      const userId = decoded.userId;

      // Notify about typing status
      client.to(`conversation-${data.conversationId}`).emit('userTyping', {
        userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping,
      });
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  }

  // Helper method to send event to a specific user across all their socket connections
  sendToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSocketMap.get(userId) || [];
    userSockets.forEach((socketId) => {
      this.server.to(socketId).emit(event, data);
    });
  }
}
