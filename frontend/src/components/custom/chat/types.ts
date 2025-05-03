export interface User {
  userId: string;
  name: string;
  profilePicture: string | null;
}

export interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  groupImage: string | null;
  createdAt: string;
  updatedAt: string;
  participants: {
    userId: string;
    user: User;
  }[];
  messages: Message[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  conversationId: string;
  senderId: string;
  sender: User;
  readStatuses: {
    userId: string;
    readAt: string;
  }[];
}

export interface MessageReadEvent {
  messageId: string;
  userId: string;
  readAt: string;
}

export interface UserTypingEvent {
  conversationId: string;
  isTyping: boolean;
  userId: string;
}

// Callback types
export type NewMessageCallback = (message: Message) => void;
export type MessageReadCallback = (event: MessageReadEvent) => void;
export type TypingCallback = (event: UserTypingEvent) => void;
