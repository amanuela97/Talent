import React from 'react';
import Image from 'next/image';
import { Conversation, TypingIndicator } from './types';
import MessageList from './MessageList';
import ChatInput from './ChatInput';

interface ChatWindowProps {
  conversation: Conversation;
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  currentUserId: string | null;
  typingIndicators: TypingIndicator[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  conversation,
  onSendMessage,
  onTyping,
  currentUserId,
  typingIndicators,
}) => {
  // Helper to get conversation name
  const getConversationName = () => {
    if (conversation.isGroup && conversation.name) {
      return conversation.name;
    }

    // For 1-on-1 conversations, show the other person's name
    if (!conversation.isGroup && currentUserId) {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== currentUserId
      );
      return otherParticipant?.user?.name || 'Unknown User';
    }

    return 'Conversation';
  };

  // Get avatar image
  const getAvatar = () => {
    if (conversation.isGroup && conversation.groupImage) {
      return conversation.groupImage;
    }

    if (!conversation.isGroup && currentUserId) {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== currentUserId
      );
      return otherParticipant?.user?.profilePicture || '/default-avatar.png';
    }

    return '/default-avatar.png';
  };

  // Get conversation participants text
  const getParticipantsText = () => {
    if (!conversation.isGroup) return '';

    return conversation.participants.map((p) => p.user.name).join(', ');
  };

  return (
    <>
      {/* Chat header */}
      <div className="p-3 border-b border-gray-300 flex items-center bg-white">
        <Image
          src={getAvatar()}
          alt={getConversationName()}
          className="h-full w-full rounded-full object-cover"
          width={40}
          height={40}
          onError={() => '/default-avatar.png'}
        />
        <div className="flex-1 ml-3"></div>
        <div>
          <h2 className="text-lg font-medium">{getConversationName()}</h2>
          {conversation.isGroup && (
            <p className="text-xs text-gray-500">{getParticipantsText()}</p>
          )}
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <MessageList
          messages={conversation.messages}
          currentUserId={currentUserId}
        />

        {/* Typing indicators */}
        {typingIndicators.length > 0 && (
          <div className="text-sm text-gray-500 italic mt-2">
            {typingIndicators.map((indicator) => indicator.name).join(', ')}{' '}
            {typingIndicators.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput onSendMessage={onSendMessage} onTyping={onTyping} />
    </>
  );
};

export default ChatWindow;
