"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitReply } from "@/lib/api/talents";
import { TalentProfileProps } from "./TalentProfile";

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  talentId: string;
  serviceName: string;
}

export function ReplyModal({
  isOpen,
  onClose,
  reviewId,
  talentId,
  serviceName,
}: ReplyModalProps) {
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();

  const { mutate: submitReplyMutation, isPending } = useMutation({
    mutationFn: (data: { reviewId: string; comment: string }) =>
      submitReply(data.reviewId, data.comment),
    onSuccess: (data) => {
      // Update reviews cache
      queryClient.invalidateQueries({ queryKey: ["reviews", talentId] });

      // Update talent data in cache
      queryClient.setQueryData(
        ["talent", serviceName.replace(/ /g, "_")],
        (oldData: TalentProfileProps["talent"] | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            reviews: oldData.reviews.map((review) =>
              review.reviewId === reviewId
                ? {
                    ...review,
                    replies: [...(review.replies || []), data.reply],
                  }
                : review
            ),
          };
        }
      );

      toast.success("Your reply has been submitted successfully!");
      handleClose();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit reply. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!comment.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    submitReplyMutation({ reviewId, comment });
  };

  const handleClose = () => {
    setComment("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reply to Review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="reply" className="block text-sm font-medium mb-2">
              Your Reply
            </label>
            <Textarea
              id="reply"
              placeholder="Write your response to this review..."
              value={comment}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setComment(value);
                }
              }}
              rows={4}
              maxLength={1000}
              className="resize-none min-h-[100px] whitespace-pre-wrap break-words"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!comment.trim() || isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? "Submitting..." : "Submit Reply"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
