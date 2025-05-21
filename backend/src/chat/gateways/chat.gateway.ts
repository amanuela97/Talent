/* eslint-disable @typescript-eslint/no-unsafe-argument */
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

  constructor(
    private readonly messagesService: MessagesService,
    private readonly conversationsService: ConversationsService,
    private readonly jwtService: JwtService,
  ) {}

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
    @MessageBody() createMessageDto: CreateMessageDto,
  ) {
    try {
      const { content, conversationId } = createMessageDto;
      console.log('Received sendMessage request:', {
        content,
        conversationId,
        socketId: client.id,
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
        return;
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
      client.emit('error', { message: 'Failed to send message', error: error });
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
}
