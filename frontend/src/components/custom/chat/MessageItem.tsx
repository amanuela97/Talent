import React from 'react';
import Image from 'next/image';
import { Message } from './types';
import { format } from 'date-fns';

interface MessageItemProps {
  message: Message;
  isOwn: boolean;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, isOwn }) => {
  const messageTime = format(new Date(message.createdAt), 'h:mm a');

  // Check if message has been read by anyone
  const hasBeenRead = message.readStatuses.some(
    (status) => status.userId !== message.senderId
  );

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden mr-2">
          <Image
            src={message.sender.profilePicture || '/default-avatar.png'}
            alt={message.sender.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-avatar.png';
            }}
          />
        </div>
      )}

      <div className="max-w-xs lg:max-w-md">
        {!isOwn && (
          <div className="text-xs text-gray-500 mb-1 ml-1">
            {message.sender.name}
          </div>
        )}

        <div className="flex flex-col">
          <div
            className={`px-4 py-2 rounded-lg ${
              isOwn
                ? 'bg-blue-500 text-white rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-bl-none'
            }`}
          >
            {message.content}
          </div>

          <div
            className={`flex items-center text-xs mt-1 text-gray-500 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            <span>{messageTime}</span>

            {isOwn && (
              <span className="ml-1">
                {hasBeenRead ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
