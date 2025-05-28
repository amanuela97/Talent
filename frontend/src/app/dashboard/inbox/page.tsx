"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";
import Loader from "@/components/custom/Loader";

export default function InboxPage() {
  const router = useRouter();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const response = await axiosInstance.get("/conversations");
      return response.data;
    },
  });

  useEffect(() => {
    if (conversations?.length > 0) {
      router.replace(`/dashboard/inbox/${conversations[0].id}`);
    }
  }, [conversations, router]);

  if (isLoading) {
    return <Loader />;
  }

  if (!conversations?.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No conversations yet</h2>
          <p className="text-muted-foreground">
            Start a new conversation to begin chatting
          </p>
        </div>
      </div>
    );
  }

  return <Loader />;
}
