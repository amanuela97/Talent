"use client";

import { useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { formatDistanceToNowStrict } from "date-fns";
import axiosInstance from "@/app/utils/axios";
import { useSession } from "next-auth/react";
import { useIntersection } from "@mantine/hooks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  updatedAt: string;
  participants: {
    userId: string;
    user: {
      name: string;
      profilePicture: string;
    };
  }[];
  messages: {
    id: string;
    content: string;
    createdAt: string;
    sender: {
      name: string;
    };
  }[];
}

export default function ConversationsList() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const lastItemRef = useRef<HTMLDivElement>(null);

  const { ref, entry } = useIntersection({
    root: lastItemRef.current,
    threshold: 1,
  });
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["conversations-list"],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await axiosInstance.get("/conversations", {
          params: {
            page: pageParam,
            limit: 8,
          },
        });
        return response.data;
      },
      getNextPageParam: (lastPage: Conversation[], pages) => {
        return lastPage.length === 8 ? pages.length + 1 : undefined;
      },
      initialPageParam: 1,
    });

  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [entry, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const currentConversationId = pathname.split("/").pop();

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(
      (p) => p.userId !== session?.user?.userId
    );
  };

  const getLatestMessage = (conversation: Conversation) => {
    return conversation.messages[0];
  };

  if (status === "pending") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div>Loading Messages...</div>
      </div>
    );
  }

  if (status === "error") {
    return <div>Error loading conversations</div>;
  }

  return (
    <ScrollArea className="h-screen">
      <div className="p-4 space-y-2">
        <h2 className="text-2xl font-bold mb-6">Messages</h2>
        {data?.pages.map((page) =>
          page.map((conversation: Conversation, index: number) => {
            const isLastItem =
              index === page.length - 1 &&
              data.pages[data.pages.length - 1] === page;
            const otherParticipant = getOtherParticipant(conversation);
            const latestMessage = getLatestMessage(conversation);
            const isSelected = conversation.id === currentConversationId;

            return (
              <div
                key={conversation.id}
                ref={isLastItem ? ref : null}
                className={cn(
                  "p-5 rounded-lg cursor-pointer transition-all",
                  "hover:bg-accent/50 mb-3",
                  isSelected
                    ? "bg-accent shadow-sm border border-accent"
                    : "hover:translate-x-1"
                )}
                onClick={() =>
                  router.push(`/dashboard/inbox/${conversation.id}`)
                }
              >
                <div className="flex items-start space-x-4">
                  <div className="relative h-12 w-12 flex-shrink-0">
                    <Image
                      src={
                        otherParticipant?.user?.profilePicture ||
                        "/default-avatar.png"
                      }
                      alt={otherParticipant?.user?.name || "User"}
                      fill
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex justify-between items-center w-full gap-4">
                      <div className="flex-shrink-0 max-w-[70%]">
                        <h3 className="text-sm font-medium">
                          {otherParticipant?.user?.name}
                        </h3>
                      </div>
                      {latestMessage && (
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                          {formatDistanceToNowStrict(
                            new Date(latestMessage.createdAt)
                          )}
                        </span>
                      )}
                    </div>
                    {latestMessage && (
                      <div className="flex items-baseline space-x-1 w-full">
                        <span className="text-xs font-medium text-muted-foreground/90 flex-shrink-0">
                          {latestMessage.sender?.name}
                        </span>
                        <p className="text-xs text-muted-foreground/75 truncate">
                          {latestMessage.content}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {isFetchingNextPage && (
          <div className="py-4 text-center text-sm text-muted-foreground">
            Loading more...
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
