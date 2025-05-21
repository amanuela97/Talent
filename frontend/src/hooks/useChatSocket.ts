import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

// Singleton socket instance
let socketInstance: Socket | null = null;
let refreshTimeout: NodeJS.Timeout | null = null;

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
    if (!token) {
      console.log("No token available, skipping socket connection");
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
          auth: {
            token,
          },
          reconnectionAttempts: 3,
          reconnectionDelay: 1000,
          timeout: 10000,
        }
      );

      // Set up socket event handlers
      const setupSocketHandlers = () => {
        if (!socketInstance) return;

        socketInstance.on("connect", () => {
          console.log(
            "Connected to chat server with socket ID:",
            socketInstance?.id
          );
          setIsConnected(true);
          scheduleTokenRefresh();
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Disconnected from chat server. Reason:", reason);
          setIsConnected(false);
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Socket connection error:", error.message);
          toast.error("Failed to connect to chat server");
          setIsConnected(false);
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
      };

      setupSocketHandlers();
    }

    // Join conversation room
    if (socketInstance?.connected) {
      console.log("Joining conversation room:", conversationId);
      socketInstance.emit("joinConversation", conversationId);
    }

    // Set up message handler
    const handleNewMessage = (message: Message) => {
      console.log("New message received:", {
        messageId: message.id,
        content: message.content,
        senderId: message.senderId,
        timestamp: new Date().toISOString(),
      });

      // Check if message already exists in the conversation
      queryClient.setQueryData(
        ["conversation", conversationId],
        (oldData: { messages?: Message[] } | undefined) => {
          if (!oldData) return oldData;

          // Check if message already exists
          const messageExists = oldData.messages?.some(
            (m) => m.id === message.id
          );
          if (messageExists) {
            console.log(
              "Message already exists in conversation, skipping:",
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
    };

    // Set up typing handlers
    const handleTyping = (typingUserId: string) => {
      if (typingUserId !== userId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (typingUserId: string) => {
      if (typingUserId !== userId) {
        setIsTyping(false);
      }
    };

    // Remove all existing listeners
    if (socketInstance) {
      socketInstance.removeAllListeners("newMessage");
      socketInstance.removeAllListeners("typing");
      socketInstance.removeAllListeners("stopTyping");
    }

    // Add new listeners
    socketInstance?.on("newMessage", handleNewMessage);
    socketInstance?.on("typing", handleTyping);
    socketInstance?.on("stopTyping", handleStopTyping);

    // Cleanup function
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socketInstance) {
        socketInstance.removeAllListeners("newMessage");
        socketInstance.removeAllListeners("typing");
        socketInstance.removeAllListeners("stopTyping");
      }
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

    socketInstance.emit(
      "sendMessage",
      {
        conversationId,
        content: content.trim(),
      },
      (response: MessageResponse | undefined) => {
        // Handle acknowledgment if the server sends one
        if (!response) {
          console.log("no response");
        }
      }
    );

    // Add error handler for this specific emit
    socketInstance.once("error", (error) => {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    });

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
