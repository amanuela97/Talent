"use client";

import { useSession } from "next-auth/react";
import ConversationList from "@/components/custom/chat/ConversationList";
import Loader from "@/components/custom/Loader";

export default function InboxPage() {
  const { status } = useSession();

  if (status === "loading") {
    return <Loader />;
  }

  return (
    <div className="container mx-auto py-8 h-screen px-10">
      <h1 className="text-3xl font-bold mb-8">Inbox</h1>
      <ConversationList />
    </div>
  );
}
