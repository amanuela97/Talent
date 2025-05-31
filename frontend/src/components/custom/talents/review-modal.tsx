"use client";

import type React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { TalentProfileProps } from "./TalentProfile";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitReview } from "@/lib/api/talents";
import { useSession } from "next-auth/react";

interface ReviewModalProps {
  talent: TalentProfileProps["talent"];
  isOpen: boolean;
  onClose: () => void;
}

export function ReviewModal({ talent, isOpen, onClose }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { mutate: submitReviewMutation, isPending } = useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      submitReview(talent.talentId, data),
    onSuccess: (data) => {
      // Update reviews cache
      queryClient.invalidateQueries({ queryKey: ["reviews", talent.talentId] });

      // Update talent data in cache
      queryClient.setQueryData(
        ["talent", talent.serviceName.replace(/ /g, "_")],
        (oldData: TalentProfileProps["talent"] | undefined) => {
          if (!oldData) return oldData;

          // Filter out any existing review from the same user
          const filteredReviews =
            oldData.reviews?.filter(
              (review) => review.userRevieweId !== session?.user?.userId
            ) || [];

          return {
            ...oldData,
            rating: data.newAverageRating,
            reviews: [data.review, ...filteredReviews],
          };
        }
      );

      // Also invalidate the user's talent data if they are a talent
      if (session?.user?.userId && session?.user?.role === "TALENT") {
        queryClient.invalidateQueries({
          queryKey: ["talent", session.user.userId],
        });
      }

      toast.success("Your review has been submitted successfully!");
      handleClose();
    },
    onError: (error) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit review. Please try again.";
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      toast.error("Please sign in to leave a review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating before submitting");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please enter a review comment");
      return;
    }

    submitReviewMutation({ rating, comment });
  };

  const handleClose = () => {
    setRating(0);
    setComment("");
    setHoveredRating(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leave a Review for {talent.firstName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Stars */}
          <div>
            <label className="block text-sm font-medium mb-2">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-500 fill-yellow-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <label htmlFor="comment" className="block text-sm font-medium mb-2">
              Your Review
            </label>
            <Textarea
              id="comment"
              placeholder="Share your experience working with this talent..."
              value={comment}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setComment(value);
                }
              }}
              rows={6}
              maxLength={1000}
              className="resize-none min-h-[150px] whitespace-pre-wrap break-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              {comment.length}/1000 characters
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={rating === 0 || !comment.trim() || isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isPending ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
