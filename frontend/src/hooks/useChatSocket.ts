import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Singleton socket instance
let socketInstance: Socket | null = null;
let refreshTimeout: NodeJS.Timeout | null = null;
let isInitialized = false; // Add flag to track initialization

interface SocketAuth {
  token: string;
}

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

interface MessageResponse {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  conversationId: string;
}

interface UseChatSocketProps {
  token: string | undefined;
  conversationId: string;
  userId: string | undefined;
}

interface UseChatSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isTyping: boolean;
  sendMessage: (content: string) => void;
  sendTyping: () => void;
  stopTyping: () => void;
}

const useChatSocket = ({
  token,
  conversationId,
  userId,
}: UseChatSocketProps): UseChatSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();
  const processedMessageIds = useRef(new Set<string>());

  // Function to refresh token before it expires
  const scheduleTokenRefresh = useCallback(() => {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
    }

    // Refresh token 5 minutes before it expires
    refreshTimeout = setTimeout(async () => {
      try {
        console.log("Refreshing token before expiration...");
        await updateSession();
      } catch (error) {
        console.error("Failed to refresh token:", error);
        toast.error("Session expired. Please log in again.");
      }
    }, 55 * 60 * 1000); // 55 minutes (assuming 1 hour token expiration)
  }, [updateSession]);

  useEffect(() => {
    if (!token || isInitialized) {
      console.log(
        "Skipping socket connection:",
        !token ? "no token" : "already initialized"
      );
      return;
    }

    // Initialize socket if it doesn't exist or if token has changed
    if (
      !socketInstance ||
      (socketInstance.auth as SocketAuth).token !== token
    ) {
      console.log("Initializing new socket connection");

      // Disconnect existing socket if it exists
      if (socketInstance) {
        console.log("Disconnecting existing socket");
        socketInstance.disconnect();
        socketInstance = null;
      }

      console.log("Creating new socket instance");
      socketInstance = io(
        process.env.NEXT_PUBLIC_WS_URL || "http://localhost:4001",
        {
          auth: { token },
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
        }
      );

      // Set up socket event handlers only once
      const setupSocketHandlers = () => {
        if (!socketInstance) return;

        // Remove any existing listeners first
        socketInstance.removeAllListeners();

        socketInstance.on("connect", () => {
          console.log(
            "Connected to chat server with socket ID:",
            socketInstance?.id
          );
          setIsConnected(true);
          scheduleTokenRefresh();

          // Join conversation room only after successful connection
          if (conversationId) {
            console.log("Joining conversation room:", conversationId);
            socketInstance?.emit("joinConversation", conversationId);
          }
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Disconnected from chat server. Reason:", reason);
          setIsConnected(false);
          isInitialized = false; // Reset initialization flag on disconnect
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
          toast.error("Failed to connect to chat server");
          setIsConnected(false);
          isInitialized = false; // Reset initialization flag on error
        });

        socketInstance.on("error", (error) => {
          console.error("Socket error:", error);
        });

        socketInstance.on("tokenExpired", async () => {
          console.log("Token expired, attempting to refresh...");
          try {
            await updateSession();
          } catch (error) {
            console.error("Failed to refresh token:", error);
            toast.error("Session expired. Please log in again.");
          }
        });

        // Set up message handler
        socketInstance.on("newMessage", (message: Message) => {
          console.log("New message received:", message);

          if (processedMessageIds.current.has(message.id)) {
            console.log("Duplicate message detected, skipping:", message.id);
            return;
          }

          processedMessageIds.current.add(message.id);

          queryClient.setQueryData(
            ["conversation", conversationId],
            (oldData: { messages?: Message[] } | undefined) => {
              if (!oldData) return oldData;

              if (oldData.messages?.some((m) => m.id === message.id)) {
                console.log(
                  "Message already in conversation, skipping:",
                  message.id
                );
                return oldData;
              }

              console.log("Adding new message to conversation:", message.id);
              return {
                ...oldData,
                messages: [...(oldData.messages || []), message],
              };
            }
          );

          setTimeout(() => {
            processedMessageIds.current.delete(message.id);
          }, 5000);
        });

        // Set up typing handlers
        socketInstance.on("typing", (typingUserId: string) => {
          if (typingUserId !== userId) {
            setIsTyping(true);
          }
        });

        socketInstance.on("stopTyping", (typingUserId: string) => {
          if (typingUserId !== userId) {
            setIsTyping(false);
          }
        });

        // Add read receipt handler
        socketInstance.on(
          "messageRead",
          (data: { messageId: string; userId: string }) => {
            console.log("Message read:", data);
            queryClient.setQueryData(
              ["conversation", conversationId],
              (oldData: { messages?: Message[] } | undefined) => {
                if (!oldData?.messages) return oldData;

                return {
                  ...oldData,
                  messages: oldData.messages.map((msg) => {
                    if (msg.id === data.messageId) {
                      return {
                        ...msg,
                        readStatuses: [
                          ...msg.readStatuses,
                          {
                            userId: data.userId,
                            readAt: new Date().toISOString(),
                          },
                        ],
                      };
                    }
                    return msg;
                  }),
                };
              }
            );
          }
        );
      };

      setupSocketHandlers();
      isInitialized = true;
    }

    // Cleanup function
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
      // Note: We don't remove listeners or disconnect here anymore
    };
  }, [
    token,
    conversationId,
    userId,
    queryClient,
    updateSession,
    scheduleTokenRefresh,
  ]);

  const sendMessage = (content: string) => {
    if (!socketInstance || !content.trim()) {
      console.log("Cannot send message:", {
        hasSocket: !!socketInstance,
        hasContent: !!content.trim(),
      });
      return;
    }

    // Generate a unique request ID with timestamp and random suffix
    const requestId = `${socketInstance.id}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 15)}`;

    // Add error handler for this specific emit
    const errorHandler = (error: unknown) => {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      socketInstance?.off("error", errorHandler);
    };

    socketInstance.once("error", errorHandler);

    console.log("Sending message with request ID:", requestId);

    socketInstance.emit(
      "sendMessage",
      {
        conversationId,
        content: content.trim(),
        requestId,
      },
      (response: MessageResponse | undefined) => {
        if (!response) {
          console.log("No response from server");
          return;
        }
        console.log("Message sent successfully:", response.id);
      }
    );

    stopTyping();
  };

  const sendTyping = () => {
    if (!socketInstance) return;

    socketInstance.emit("typing", conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const stopTyping = () => {
    if (!socketInstance) return;

    socketInstance.emit("stopTyping", conversationId);
    setIsTyping(false);
  };

  return {
    socket: socketInstance,
    isConnected,
    isTyping,
    sendMessage,
    sendTyping,
    stopTyping,
  };
};

export default useChatSocket;
