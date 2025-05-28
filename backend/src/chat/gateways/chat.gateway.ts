/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
import { JwtService } from '@nestjs/jwt';
import { MessagesService } from '../services/messages.service';
import { ConversationsService } from '../services/conversations.service';
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
  // Map to store processed request IDs with timestamps
  private processedRequests = new Map<string, number>();
  // Cleanup interval for processed requests
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
  ) {
    // Set up cleanup interval for processed requests
    this.cleanupInterval = setInterval(
      () => this.cleanupProcessedRequests(),
      5000,
    );
  }

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token;
      if (!token) {
        console.error('Token is undefined');
        client.disconnect();
        return;
      }

      try {
        // Verify token and get user
        const decoded = this.jwtService.verify<UserPayload>(token, {
          secret: process.env.JWT_SECRET,
        });
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
        for (const conversation of conversations) {
          await client.join(`conversation-${conversation.id}`);
        }

        console.log(`User ${userId} connected with socket ${client.id}`);
      } catch (error) {
        console.error('Token verification error:', error.message);
        if (error.name === 'TokenExpiredError') {
          console.error('Token expired, disconnecting client');
          client.emit('tokenExpired');
        } else if (error.name === 'JsonWebTokenError') {
          console.error('Invalid token:', error.message);
          client.emit('error', { message: 'Invalid token' });
        }
        client.disconnect();
      }
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

  @SubscribeMessage('joinConversation')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error('Token is undefined');
      }

      const decoded = this.jwtService.verify<UserPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = decoded.userId;

      // Verify user belongs to conversation
      const isParticipant =
        await this.conversationsService.isUserInConversation(
          userId,
          conversationId,
        );

      if (!isParticipant) {
        client.emit('error', {
          message: 'You are not part of this conversation',
        });
        return;
      }

      // Join the conversation room
      await client.join(`conversation-${conversationId}`);
      console.log(`User ${userId} joined conversation ${conversationId}`);
    } catch (error) {
      console.error('Error joining conversation:', error);
      client.emit('error', { message: 'Failed to join conversation' });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() createMessageDto: CreateMessageDto & { requestId?: string },
  ) {
    try {
      const { content, conversationId, requestId } = createMessageDto;

      // Generate a request ID if not provided
      const messageRequestId =
        requestId ||
        `${client.id}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

      // Check if this request was already processed
      const lastProcessedTime = this.processedRequests.get(messageRequestId);
      if (lastProcessedTime && Date.now() - lastProcessedTime < 5000) {
        // Increased window to 5 seconds
        console.log('Duplicate request detected, skipping:', {
          requestId: messageRequestId,
          lastProcessedTime,
          timeSinceLastProcess: Date.now() - lastProcessedTime,
        });
        return null;
      }

      // Mark this request as processed BEFORE creating the message
      this.processedRequests.set(messageRequestId, Date.now());

      console.log('Processing sendMessage request:', {
        content,
        conversationId,
        socketId: client.id,
        requestId: messageRequestId,
      });

      const token = client.handshake.auth?.token;
      if (!token) {
        console.error('Token is undefined in sendMessage');
        throw new Error('Token is undefined');
      }

      const decoded = this.jwtService.verify<UserPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const senderId = decoded.userId;
      console.log('Verified sender:', { senderId, socketId: client.id });

      // Verify user belongs to conversation
      const isParticipant =
        await this.conversationsService.isUserInConversation(
          senderId,
          conversationId,
        );

      if (!isParticipant) {
        console.error('User not in conversation:', {
          senderId,
          conversationId,
        });
        client.emit('error', {
          message: 'You are not part of this conversation',
        });
        return null;
      }

      // Check for duplicate message within last second
      const recentMessage = await this.messagesService.findRecentMessage(
        conversationId,
        senderId,
        content,
        1000, // 1 second
      );

      if (recentMessage) {
        console.log(
          'Duplicate message detected, returning existing message:',
          recentMessage.id,
        );
        // Update conversation timestamp
        await this.conversationsService.touch(conversationId);
        // Return existing message
        return recentMessage;
      }

      // Create message
      const message = await this.messagesService.create({
        content,
        conversationId,
        senderId,
      });

      if (!message) {
        console.error('Failed to create message');
        throw new Error('Failed to create message');
      }

      console.log('Message created:', {
        messageId: message.id,
        conversationId,
      });

      // Update conversation updatedAt timestamp
      await this.conversationsService.touch(conversationId);

      // Send to all participants in the conversation room
      this.server
        .to(`conversation-${conversationId}`)
        .emit('newMessage', message);

      console.log('Message broadcasted to room:', {
        messageId: message.id,
        conversationId,
        room: `conversation-${conversationId}`,
      });

      // Return the message to the sender
      return message;
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('error', {
        message: 'Failed to send message',
        error: error.message,
      });
      return null;
    }
  }

  private cleanupProcessedRequests() {
    const now = Date.now();
    for (const [requestId, timestamp] of this.processedRequests.entries()) {
      if (now - timestamp > 5000) {
        // Remove requests older than 5 seconds
        this.processedRequests.delete(requestId);
      }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error('Token is undefined');
      }

      const decoded = this.jwtService.verify<UserPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = decoded.userId;

      // Notify about typing status
      client.to(`conversation-${conversationId}`).emit('typing', userId);
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  }

  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() conversationId: string,
  ) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error('Token is undefined');
      }

      const decoded = this.jwtService.verify<UserPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = decoded.userId;

      // Notify about typing status
      client.to(`conversation-${conversationId}`).emit('stopTyping', userId);
    } catch (error) {
      console.error('Error handling typing indicator:', error);
    }
  }

  @SubscribeMessage('markMessageRead')
  async handleMarkMessageRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { messageId: string },
  ) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) {
        throw new Error('Token is undefined');
      }

      const decoded = this.jwtService.verify<UserPayload>(token, {
        secret: process.env.JWT_SECRET,
      });
      const userId = decoded.userId;

      // Mark message as read
      const readStatus = await this.messagesService.markAsRead(
        data.messageId,
        userId,
      );

      if (readStatus) {
        // Get the conversation ID for the message
        const message = await this.messagesService.findOne(data.messageId);

        // Broadcast read status to all participants
        this.server
          .to(`conversation-${message.conversationId}`)
          .emit('messageRead', {
            messageId: data.messageId,
            userId,
            readAt: readStatus.readAt,
          });

        console.log('Message marked as read:', {
          messageId: data.messageId,
          userId,
          readAt: readStatus.readAt,
        });
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      client.emit('error', {
        message: 'Failed to mark message as read',
        error: error.message,
      });
    }
  }
}
