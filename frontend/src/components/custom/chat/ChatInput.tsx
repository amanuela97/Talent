import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSendMessage: (content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Focus input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Handle typing indicator with debounce
  useEffect(() => {
    if (message.trim() && !typingTimeoutRef.current) {
      // Start typing
      onTyping(true);

      // Clear typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        onTyping(false);
        typingTimeoutRef.current = null;
      }, 3000);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    };
  }, [message, onTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = message.trim();
    if (!content || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onSendMessage(content);
      setMessage("");

      // Stop typing indicator
      onTyping(false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
      // Focus back on input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  // Handle textarea height adjustment
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Reset height to calculate actual height
    e.target.style.height = "auto";
    // Set new height based on scrollHeight (with max-height handled by CSS)
    e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
  };

  // Handle Ctrl+Enter or Cmd+Enter to submit
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-3 bg-white border-t border-gray-300"
    >
      <div className="flex items-end">
        <Textarea
          ref={inputRef}
          value={message}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg py-2 px-3 resize-none min-h-[40px] max-h-[150px] focus:outline-none focus:ring-2 focus:ring-blue-500 break-all"
          disabled={isSubmitting}
          rows={1}
          maxLength={1000}
        />
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className={`ml-2 px-4 py-2 rounded-lg ${
            !message.trim() || isSubmitting
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {isSubmitting ? (
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          ) : (
            <span>Send</span>
          )}
        </button>
      </div>
      <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to send</p>
    </form>
  );
};

export default ChatInput;
