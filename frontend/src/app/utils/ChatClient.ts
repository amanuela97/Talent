// Example of how to connect to the WebSocket service from frontend
import { io, Socket } from 'socket.io-client';
import {
  NewMessageCallback,
  MessageReadCallback,
  TypingCallback,
} from '@/components/custom/chat/types';

export class ChatService {
  private socket: Socket;

  constructor(socketUrl: string) {
    this.socket = io(socketUrl, {
      autoConnect: false,
    });
  }

  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // --- Event Subscriptions ---

  onNewMessage(callback: NewMessageCallback): () => void {
    const event = 'newMessage';
    this.socket.on(event, callback);
    return () => this.socket.off(event, callback);
  }

  onMessageRead(callback: MessageReadCallback): () => void {
    const event = 'messageRead';
    this.socket.on(event, callback);
    return () => this.socket.off(event, callback);
  }

  onUserTyping(callback: TypingCallback): () => void {
    const event = 'userTyping';
    this.socket.on(event, callback);
    return () => this.socket.off(event, callback);
  }

  // --- Emitting Events ---

  async sendMessage(conversationId: string, content: string): Promise<void> {
    this.socket.emit('sendMessage', { conversationId, content });
  }

  markMessageAsRead(messageId: string): void {
    this.socket.emit('markMessageRead', { messageId });
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean): void {
    this.socket.emit('typing', { conversationId, isTyping });
  }
}
