"use client";

import { useSession } from "next-auth/react";
import { ReplyModal } from "./reply-modal";
import { useState } from "react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteReply,
  deleteReview,
  getTalentReviews,
  updateReply,
} from "@/lib/api/talents";
import { MessageSquare, Star, Loader2, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalentProfileProps } from "./TalentProfile";
import { Reply, Review } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface ReviewWithUser extends Review {
  user: {
    name: string;
    profilePicture: string | null;
  };
  replies: (Reply & {
    user: {
      name: string;
      profilePicture: string | null;
    };
  })[];
}

interface ReviewsResponse {
  reviews: ReviewWithUser[];
  total: number;
  hasMore: boolean;
  averageRating: number;
  nextPage: number;
}

export function ReviewsList({
  talent,
}: {
  talent: TalentProfileProps["talent"];
}) {
  const { data: session } = useSession();
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{
    id: string;
    comment: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery<ReviewsResponse>({
      queryKey: ["reviews", talent.talentId],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await getTalentReviews(
          talent.talentId,
          pageParam as number
        );
        return response;
      },
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextPage : undefined,
      initialPageParam: 1,
    });

  const handleDeleteReview = async (reviewId: string) => {
    try {
      const response = await deleteReview(reviewId);

      // Invalidate both reviews and talent queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reviews", talent.talentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["talent", talent.serviceName.replace(/ /g, "_")],
        }),
      ]);

      // Also invalidate the user's talent data if they are a talent
      if (session?.user?.userId && session?.user?.role === "TALENT") {
        queryClient.invalidateQueries({
          queryKey: ["talent", session.user.userId],
        });
      }

      toast.success(response?.message || "Review deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      const response = await deleteReply(replyId);
      // Invalidate both reviews and talent queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reviews", talent.talentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["talent", talent.serviceName.replace(/ /g, "_")],
        }),
      ]);
      toast.success(response?.message || "Reply deleted successfully");
    } catch (error: unknown) {
      console.error("Error deleting reply:", error);
      toast.error("Failed to delete reply");
    }
  };

  const handleEditReply = async () => {
    if (!editingReply) return;

    try {
      const response = await updateReply(editingReply.id, editingReply.comment);
      // Invalidate both reviews and talent queries
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["reviews", talent.talentId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["talent", talent.serviceName.replace(/ /g, "_")],
        }),
      ]);
      toast.success(response?.message || "Reply updated successfully");
      setEditingReply(null);
    } catch (error: unknown) {
      console.error("Error updating reply:", error);
      toast.error("Failed to update reply");
    }
  };

  // Flatten all reviews from all pages
  const reviews = data?.pages.flatMap((page) => page.reviews) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No reviews yet. Be the first to leave a review!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div
          key={review.reviewId}
          className="bg-white rounded-lg shadow-sm p-6 space-y-4"
        >
          {/* Review content */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {review.user.profilePicture ? (
                <div
                  className="w-10 h-10 rounded-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${review.user.profilePicture})`,
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-semibold">
                  {review.user.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-medium text-[15px]">
                  {review.user.name}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className={`h-4 w-4 ${
                          index < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">•</span>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            </div>
            {session?.user?.userId === review.userRevieweId && (
              <Button
                variant="ghost"
                size="icon"
                className="text-red-400 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                onClick={() => handleDeleteReview(review.reviewId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-gray-700 mt-2">{review.comment}</p>

          {/* Replies section */}
          {review.replies && review.replies.length > 0 ? (
            <div className="mt-4 space-y-4">
              {review.replies.map((reply) => (
                <div
                  key={reply.replyId}
                  className="ml-8 pl-4 border-l-2 border-orange-200 relative"
                >
                  {/* Reply connector line */}
                  <div className="absolute -left-2 top-4 w-6 h-px bg-orange-200" />

                  <div className="bg-orange-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full bg-cover bg-center"
                          style={{
                            backgroundImage: `url(${
                              talent.talentProfilePicture ||
                              "/default-avatar.png"
                            })`,
                          }}
                        />
                        <div>
                          <div className="font-medium text-orange-700">
                            {talent.firstName} {talent.lastName}
                            <span className="ml-2 text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              Talent
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(reply.createdAt), {
                              addSuffix: true,
                            })}
                          </div>
                        </div>
                      </div>
                      {session?.user?.userId === reply.userReplyId && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-orange-400 hover:text-orange-800 hover:bg-orange-50 cursor-pointer"
                            onClick={() =>
                              setEditingReply({
                                id: reply.replyId,
                                comment: reply.comment,
                              })
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400 hover:text-red-800 hover:bg-red-50 cursor-pointer"
                            onClick={() => handleDeleteReply(reply.replyId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-gray-700">{reply.comment}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Reply button */
            session?.user?.userId === talent.talentId && (
              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-orange-500 hover:text-orange-600"
                  onClick={() => setSelectedReviewId(review.reviewId)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Reply
                </Button>
              </div>
            )
          )}
        </div>
      ))}

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              "Load more reviews"
            )}
          </Button>
        </div>
      )}

      <ReplyModal
        isOpen={!!selectedReviewId}
        onClose={() => setSelectedReviewId(null)}
        reviewId={selectedReviewId || ""}
        talentId={talent.talentId}
        serviceName={talent.serviceName}
      />

      {/* Edit Reply Dialog */}
      <Dialog
        open={!!editingReply}
        onOpenChange={(open) => !open && setEditingReply(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reply</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={editingReply?.comment || ""}
              onChange={(e) =>
                setEditingReply((prev) =>
                  prev ? { ...prev, comment: e.target.value } : null
                )
              }
              placeholder="Edit your reply..."
              className="min-h-[100px] whitespace-pre-wrap break-all"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReply(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEditReply}
              disabled={!editingReply?.comment.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
