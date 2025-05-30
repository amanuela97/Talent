"use client";

import { useSession } from "next-auth/react";
import { ReplyModal } from "./reply-modal";
import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getTalentReviews } from "@/lib/api/talents";
import { MessageSquare, Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TalentProfileProps } from "./TalentProfile";
import { Reply, Review } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

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
              <div
                className="w-10 h-10 rounded-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${
                    review.user.profilePicture || "/default-avatar.png"
                  })`,
                }}
              />
              <div>
                <div className="font-medium">{review.user.name}</div>
                <div className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(review.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
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
          </div>

          <p className="text-gray-700">{review.comment}</p>

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
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-8 h-8 rounded-full bg-cover bg-center"
                        style={{
                          backgroundImage: `url(${
                            talent.talentProfilePicture || "/default-avatar.png"
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
    </div>
  );
}
