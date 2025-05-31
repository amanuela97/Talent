"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";
import { Participant } from "./types";
import useChatSocket from "@/hooks/useChatSocket";
import Loader from "../Loader";
import { Check } from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readStatuses: {
    userId: string;
    readAt: string;
  }[];
  sender: {
    name: string;
  };
}

interface ChatRoomProps {
  conversationId: string;
}

export default function ChatRoom({ conversationId }: ChatRoomProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const processedMessagesRef = useRef<Set<string>>(new Set());
  const { isTyping, sendMessage, sendTyping, socket } = useChatSocket({
    token: session?.accessToken,
    conversationId,
    userId: session?.user?.userId,
  });

  // Fetch conversation details and messages
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/conversations/${conversationId}`
      );
      return response.data;
    },
    enabled: !!conversationId,
  });

  // Handle message visibility
  const handleMessageVisible = useCallback(
    (messageId: string) => {
      if (
        !socket ||
        !session?.user?.userId ||
        processedMessagesRef.current.has(messageId)
      ) {
        return;
      }

      const message = conversation?.messages?.find(
        (msg: Message) => msg.id === messageId
      );
      if (!message) return;

      // Only mark as read if it's not our message and hasn't been read by us
      if (
        message.senderId !== session.user.userId &&
        !message.readStatuses.some(
          (status: { userId: string }) => status.userId === session.user.userId
        )
      ) {
        processedMessagesRef.current.add(messageId);
        socket.emit("markMessageRead", { messageId });
        console.log("Marking message as read:", messageId);
      }
    },
    [socket, session?.user?.userId, conversation?.messages]
  );

  // Set up intersection observer
  useEffect(() => {
    if (!conversation?.messages) return;

    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute("data-message-id");
            if (messageId) {
              handleMessageVisible(messageId);
            }
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: "0px",
        threshold: 0.5, // Message is considered visible when 50% is in view
      }
    );

    // Observe all message elements
    const messageElements = document.querySelectorAll("[data-message-id]");
    messageElements.forEach((element) => {
      observerRef.current?.observe(element);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [conversation?.messages, handleMessageVisible]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  // Reset processed messages when conversation changes
  useEffect(() => {
    processedMessagesRef.current = new Set();
  }, [conversationId]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage("");
  };

  const handleTyping = () => {
    sendTyping();
  };

  if (isLoading) {
    return <Loader />;
  }

  const otherParticipant = conversation?.participants.find(
    (p: Participant) => p.userId !== session?.user?.userId
  );

  const getMessageReadStatus = (msg: Message) => {
    if (msg.senderId !== session?.user?.userId) return null;

    const isRead = msg.readStatuses.some(
      (status) => status.userId === otherParticipant?.userId
    );

    return (
      <div className="flex items-center space-x-1">
        <Check
          className={`h-4 w-4 ${isRead ? "text-green-500" : "text-gray-400"}`}
        />
        {isRead && <Check className="h-4 w-4 -ml-2 text-green-500" />}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <Card className="rounded-none border-x-0 border-t-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative h-12 w-12 rounded-full overflow-hidden">
              <Image
                src={
                  otherParticipant?.user?.profilePicture ||
                  "/default-avatar.png"
                }
                alt={otherParticipant?.user?.name || "User"}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {otherParticipant?.user?.name}
              </h2>
              {isTyping && (
                <p className="text-sm text-gray-500">
                  {otherParticipant?.user?.name} is typing...
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation?.messages?.map((msg: Message) => {
          const isOwnMessage = msg.senderId === session?.user?.userId;
          return (
            <div
              key={msg.id}
              data-message-id={msg.id}
              className={`flex ${
                isOwnMessage ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isOwnMessage
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  {!isOwnMessage && (
                    <span className="text-sm font-semibold">
                      {msg.sender.name}
                    </span>
                  )}
                </div>
                <p className="whitespace-pre-wrap break-all">{msg.content}</p>
                <div className="flex items-center justify-end space-x-2 text-xs mt-1 opacity-70">
                  <span>
                    {format(new Date(msg.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                  {getMessageReadStatus(msg)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <Card className="rounded-none border-x-0 border-b-0">
        <CardContent className="p-4">
          <div className="flex flex-col space-y-2">
            <Textarea
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message..."
              className="min-h-[100px] resize-none break-all"
              rows={4}
            />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage}>Send</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
