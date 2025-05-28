"use client";

import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";
import Loader from "../Loader";

interface Conversation {
  id: string;
  name: string | null;
  isGroup: boolean;
  groupImage: string | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  }>;
  participants: Array<{
    id: string;
    userId: string;
    conversationId: string;
    user: {
      userId: string;
      name: string;
      profilePicture: string | null;
    };
  }>;
}

const fetchConversations = async (userId: string | undefined) => {
  if (!userId) {
    return console.error("no userID provided for fetchConversations");
  }
  const { data } = await axiosInstance.get(`/conversations?userId=${userId}`);
  return data;
};
export default function ConversationList() {
  const { data: session } = useSession();
  const { data: conversations, isLoading } = useQuery<Conversation[]>({
    queryKey: ["conversations", session?.user?.userId],
    queryFn: () => fetchConversations(session?.user?.userId),
    enabled: !!session?.user?.userId,
  });
  const router = useRouter();

  if (isLoading) {
    return <Loader />;
  }

  if (!conversations?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No conversations found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {conversations.map((conversation) => {
        // Get the other participant (not the current user)
        const otherParticipant = conversation.participants.find(
          (p) => p.userId !== session?.user?.userId
        )?.user;

        // Get the last message
        const lastMessage =
          conversation.messages[conversation.messages.length - 1];

        return (
          <Card
            key={conversation.id}
            className="cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => router.push(`/dashboard/inbox/${conversation.id}`)}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={
                      otherParticipant?.profilePicture || "/default-avatar.png"
                    }
                    alt={otherParticipant?.name || "User"}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium truncate">
                      {otherParticipant?.name || "Unknown User"}
                    </h3>
                    {lastMessage && (
                      <span className="text-xs text-gray-500">
                        {format(
                          new Date(lastMessage.createdAt),
                          "MMM d, h:mm a"
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {lastMessage?.content || "No messages yet"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
