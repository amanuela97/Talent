import React, { useRef, useEffect } from 'react';
import { Message } from './types';
import MessageItem from './MessageItem';

interface MessageListProps {
  messages: Message[];
  currentUserId: string | null;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Sort messages by date (oldest first)
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sortedMessages.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No messages yet. Start the conversation!
        </div>
      ) : (
        sortedMessages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUserId}
          />
        ))
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
