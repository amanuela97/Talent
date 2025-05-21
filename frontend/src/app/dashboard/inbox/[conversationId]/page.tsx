"use client";

import { useSession } from "next-auth/react";
import ChatRoom from "@/components/custom/chat/ChatRoom";
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
    <div className="h-screen">
      <ChatRoom conversationId={conversationId} />
    </div>
  );
}
