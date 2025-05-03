import React from 'react';
import { Conversation } from './types';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | undefined;
  onSelectConversation: (conversation: Conversation) => void;
  currentUserId: string | null;
}

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelectConversation,
  currentUserId,
}) => {
  // Helper to count unread messages for a conversation
  const getUnreadCount = (conversation: Conversation) => {
    if (!currentUserId) return 0;

    return conversation.messages.filter(
      (message) =>
        message.senderId !== currentUserId &&
        !message.readStatuses.some((status) => status.userId === currentUserId)
    ).length;
  };

  return (
    <div className="overflow-y-auto h-full">
      {conversations.length === 0 ? (
        <div className="p-4 text-center text-gray-500">
          No conversations yet. Start a new one!
        </div>
      ) : (
        <ul>
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={conversation.id === selectedId}
              unreadCount={getUnreadCount(conversation)}
              onClick={() => onSelectConversation(conversation)}
              currentUserId={currentUserId}
            />
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConversationList;
