// Example of how to connect to the WebSocket service from frontend
import { io, Socket } from 'socket.io-client';

export type SendMessageResponse = {
  id: string;
  content: string;
  createdAt: string;
  sender: {
    userId: string;
    name: string;
    profilePicture: string | null;
  };
  error?: string; // Optional error property
};

export class ChatService {
  private socket: Socket;
  private accessToken: string;

  constructor(baseUrl: string) {
    this.accessToken = localStorage.getItem('accessToken') || '';
    this.socket = io(baseUrl, {
      auth: {
        token: `Bearer ${this.accessToken}`,
      },
      autoConnect: false,
    });

    this.setupEventListeners();
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  private setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  sendMessage(conversationId: string, content: string) {
    return new Promise((resolve, reject) => {
      this.socket.emit(
        'sendMessage',
        { conversationId, content },
        (response: SendMessageResponse) => {
          if (response.error) {
            reject(response.error);
          } else {
            resolve(response);
          }
        }
      );
    });
  }

  markMessageAsRead(messageId: string) {
    this.socket.emit('markMessageRead', { messageId });
  }

  onNewMessage(callback: (message: SendMessageResponse) => void) {
    this.socket.on('newMessage', callback);
    return () => this.socket.off('newMessage', callback);
  }

  onMessageRead(
    callback: (data: {
      messageId: string;
      userId: string;
      readAt: string;
    }) => void
  ) {
    this.socket.on('messageRead', callback);
    return () => this.socket.off('messageRead', callback);
  }

  sendTypingIndicator(conversationId: string, isTyping: boolean) {
    this.socket.emit('typing', { conversationId, isTyping });
  }

  onUserTyping(
    callback: (data: {
      userId: string;
      conversationId: string;
      isTyping: boolean;
    }) => void
  ) {
    this.socket.on('userTyping', callback);
    return () => this.socket.off('userTyping', callback);
  }

  updateToken(token: string) {
    this.accessToken = token;
    if (this.socket.connected) {
      this.socket.disconnect().connect();
    }
  }
}
