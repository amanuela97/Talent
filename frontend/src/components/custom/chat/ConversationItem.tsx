import React from 'react';
import Image from 'next/image';
import { Conversation } from './types';
import { formatDistanceToNow } from 'date-fns';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  unreadCount: number;
  onClick: () => void;
  currentUserId: string | null;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isSelected,
  unreadCount,
  onClick,
  currentUserId,
}) => {
  // Helper to get conversation name or list of participants
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

  // Get last message preview
  const getLastMessage = () => {
    if (conversation.messages.length === 0) {
      return 'No messages yet';
    }

    const lastMessage = conversation.messages[0];
    const isSentByCurrentUser = lastMessage.senderId === currentUserId;

    return `${
      isSentByCurrentUser ? 'You: ' : ''
    }${lastMessage.content.substring(0, 30)}${
      lastMessage.content.length > 30 ? '...' : ''
    }`;
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

  // Get time of last message
  const getLastMessageTime = () => {
    if (conversation.messages.length === 0) {
      return '';
    }

    return formatDistanceToNow(new Date(conversation.messages[0].createdAt), {
      addSuffix: true,
    });
  };

  return (
    <li
      className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
        isSelected ? 'bg-blue-50' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 h-12 w-12 mr-3">
          <Image
            src={getAvatar()}
            alt={getConversationName()}
            className="h-full w-full rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-avatar.png';
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-medium truncate">
              {getConversationName()}
            </h3>
            <span className="text-xs text-gray-500">
              {getLastMessageTime()}
            </span>
          </div>
          <p className="text-sm text-gray-500 truncate">{getLastMessage()}</p>
        </div>
        {unreadCount > 0 && (
          <div className="ml-2 bg-blue-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </div>
        )}
      </div>
    </li>
  );
};

export default ConversationItem;
