'use client';
import React, { useEffect, useState } from 'react';
import { ChatService } from '@/app/utils/ChatClient';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import NewConversation from './NewConversation';
import { Conversation, UserTypingEvent } from './types';
import axios from '@/app/utils/axios';

const CHAT_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:4001';

const ChatLayout: React.FC = () => {
  const [chatService] = useState(() => new ChatService(SOCKET_URL));
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingIndicators, setTypingIndicators] = useState<{
    [conversationId: string]: UserTypingEvent[];
  }>({});

  // Fetch conversations on component mount
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await axios.get(`${CHAT_API_URL}/conversations`);
        setConversations(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  // Helper function to find user info across all conversations
  const findUserInfo = React.useCallback(
    (userId: string) => {
      for (const conv of conversations) {
        const participant = conv.participants.find((p) => p.userId === userId);
        if (participant) {
          return participant.user;
        }
      }
      return null;
    },
    [conversations]
  );

  // Connect to chat service on component mount
  useEffect(() => {
    chatService.connect();

    // Setup message listener
    const unsubscribeNewMessage = chatService.onNewMessage((message) => {
      setConversations((prevConversations) => {
        // Find conversation and add new message
        return prevConversations.map((conv) => {
          if (conv.id === message.conversationId) {
            // Update the conversation with the new message
            const updatedConv = {
              ...conv,
              messages: [
                {
                  ...message,
                  readStatuses: [
                    {
                      userId: message.senderId,
                      readAt: new Date().toISOString(),
                    },
                  ],
                },
                ...conv.messages,
              ],
            };

            // If this is the selected conversation, mark the message as read
            if (selectedConversation?.id === conv.id) {
              chatService.markMessageAsRead(message.id);
            }

            return updatedConv;
          }
          return conv;
        });
      });

      // If message is in the current conversation, mark it as read
      if (selectedConversation?.id === message.conversationId) {
        chatService.markMessageAsRead(message.id);
      }
    });

    // Setup message read status listener
    const unsubscribeMessageRead = chatService.onMessageRead((data) => {
      setConversations((prevConversations) => {
        return prevConversations.map((conv) => {
          // Find conversation containing the message
          const messageIndex = conv.messages.findIndex(
            (msg) => msg.id === data.messageId
          );

          if (messageIndex >= 0) {
            // Create a copy of the messages array
            const updatedMessages = [...conv.messages];

            // Update the read status for the specific message
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              readStatuses: [
                ...updatedMessages[messageIndex].readStatuses.filter(
                  (status) => status.userId !== data.userId
                ),
                { userId: data.userId, readAt: data.readAt },
              ],
            };

            return { ...conv, messages: updatedMessages };
          }

          return conv;
        });
      });
    });

    // Setup typing indicator listener
    const unsubscribeTyping = chatService.onUserTyping((data) => {
      setTypingIndicators((prev) => {
        const conversationTyping = prev[data.conversationId] || [];

        if (data.isTyping) {
          // Add or update typing indicator
          const existingIndex = conversationTyping.findIndex(
            (indicator) => indicator.userId === data.userId
          );

          if (existingIndex >= 0) {
            // Update existing indicator
            const updated = [...conversationTyping];
            updated[existingIndex] = {
              ...updated[existingIndex],
              isTyping: true,
            };
            return { ...prev, [data.conversationId]: updated };
          } else {
            // Add new indicator
            // Removed unused userInfo assignment
            const newIndicator: UserTypingEvent = {
              conversationId: data.conversationId,
              userId: data.userId,
              isTyping: true,
            };
            return {
              ...prev,
              [data.conversationId]: [...conversationTyping, newIndicator],
            };
          }
        } else {
          // Remove typing indicator
          return {
            ...prev,
            [data.conversationId]: conversationTyping.filter(
              (indicator) => indicator.userId !== data.userId
            ),
          };
        }
      });
    });

    return () => {
      // Cleanup listeners
      unsubscribeNewMessage();
      unsubscribeMessageRead();
      unsubscribeTyping();
      chatService.disconnect();
    };
  }, [chatService, selectedConversation, findUserInfo]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Mark all unread messages as read
    conversation.messages.forEach((message) => {
      // Check if current user has read this message
      const currentUserId = getCurrentUserId();
      const hasRead = message.readStatuses.some(
        (status) => status.userId === currentUserId
      );

      if (!hasRead) {
        chatService.markMessageAsRead(message.id);
      }
    });
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversation) return;

    try {
      await chatService.sendMessage(selectedConversation.id, content);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateConversation = async (
    participantIds: string[],
    name?: string,
    isGroup?: boolean
  ) => {
    try {
      const response = await axios.post(`${CHAT_API_URL}/conversations`, {
        participantIds,
        name,
        isGroup: isGroup || participantIds.length > 1,
      });

      const newConversation = response.data;
      setConversations([newConversation, ...conversations]);
      setSelectedConversation(newConversation);
      setIsNewConversationOpen(false);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleTyping = (isTyping: boolean) => {
    if (selectedConversation) {
      chatService.sendTypingIndicator(selectedConversation.id, isTyping);
    }
  };

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.userId;
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar with conversation list */}
      <div className="w-1/3 border-r border-gray-300 bg-white">
        <div className="p-4 border-b border-gray-300 flex justify-between items-center">
          <h2 className="text-xl font-bold">Messages</h2>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
            onClick={() => setIsNewConversationOpen(true)}
          >
            New Chat
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-full">
            <p>Loading conversations...</p>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            selectedId={selectedConversation?.id}
            onSelectConversation={handleSelectConversation}
            currentUserId={getCurrentUserId()}
          />
        )}
      </div>

      {/* Main chat window */}
      <div className="w-2/3 flex flex-col">
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onSendMessage={handleSendMessage}
            onTyping={handleTyping}
            currentUserId={getCurrentUserId()}
            typingIndicators={typingIndicators[selectedConversation.id] || []}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
            <p className="text-gray-500 text-lg">
              Select a conversation or start a new one
            </p>
          </div>
        )}
      </div>

      {/* New conversation modal */}
      {isNewConversationOpen && (
        <NewConversation
          onClose={() => setIsNewConversationOpen(false)}
          onCreate={handleCreateConversation}
        />
      )}
    </div>
  );
};

export default ChatLayout;
