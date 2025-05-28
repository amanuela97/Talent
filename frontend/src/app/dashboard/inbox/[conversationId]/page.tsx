"use client";

import { useSession } from "next-auth/react";
import ChatRoom from "@/components/custom/chat/ChatRoom";
import ConversationsList from "@/components/custom/chat/ConversationsList";
import Loader from "@/components/custom/Loader";
import { use } from "react";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { status } = useSession();
  const { conversationId } = use(params);

  if (status === "loading") {
    return <Loader />;
  }

  return (
    <div className="flex h-screen">
      {/* Left sidebar with conversations list */}
      <div className="w-80 border-r border-border">
        <ConversationsList />
      </div>

      {/* Main chat area */}
      <div className="flex-1">
        <ChatRoom conversationId={conversationId} />
      </div>
    </div>
  );
}
