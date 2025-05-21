"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";
import { Participant } from "./types";
import useChatSocket from "@/hooks/useChatSocket";
import Loader from "../Loader";

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
  const { isTyping, sendMessage, sendTyping } = useChatSocket({
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

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

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
                <p className="text-sm text-gray-500">{`${otherParticipant?.user?.name?.toLowerCase()} is typing...`}</p>
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
                <p>{msg.content}</p>
                <div className="text-xs mt-1 opacity-70">
                  {format(new Date(msg.createdAt), "p")}
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
          <div className="flex space-x-2">
            <Input
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
              className="flex-1"
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
