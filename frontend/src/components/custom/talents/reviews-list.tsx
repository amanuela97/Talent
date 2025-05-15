import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReviewsForm } from './reviews-form';
import axiosInstance from '@/app/utils/axios';
import type { Talent } from '@/types/prismaTypes';

interface Review {
  reviewId: string;
  rating: number;
  comment: string;
  createdAt: string | Date;
  user: {
    name: string;
    profilePicture?: string;
  };
}

interface ReviewsListProps {
  talent: Talent;
}

export function ReviewsList({ talent }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [averageRating, setAverageRating] = useState(talent.rating || 0);
  const [totalReviews, setTotalReviews] = useState(0);

  // Helper function to format date
  function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const fetchReviews = async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(
        `/talents/${talent.talentId}/reviews`,
        {
          params: {
            page: pageNum,
            limit: 5,
          },
        }
      );

      const data = response.data;

      if (pageNum === 1) {
        setReviews(data.reviews || []);
      } else {
        setReviews((prev) => [...prev, ...(data.reviews || [])]);
      }

      setHasMore(data.hasMore || false);
      setAverageRating(data.averageRating || talent.rating || 0);
      setTotalReviews(data.total || data.reviews?.length || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talent.talentId]);

  const handleLoadMore = () => {
    fetchReviews(page + 1);
  };

  const handleReviewAdded = () => {
    // Reset to page 1 and refresh reviews
    fetchReviews(1);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Reviews</h3>
        <div className="flex items-center">
          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
          <span className="ml-1 font-medium text-lg">
            {averageRating.toFixed(1)}
          </span>
          <span className="ml-2 text-gray-500">
            ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
          </span>
        </div>
      </div>

      {/* Add review form */}
      <ReviewsForm talent={talent} onReviewAdded={handleReviewAdded} />

      {/* Loading state */}
      {loading && page === 1 && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        </div>
      )}

      {/* Reviews list */}
      <div className="space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <Card key={review.reviewId} className="border-none shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage
                      src={review.user.profilePicture || '/placeholder.svg'}
                      alt={review.user.name}
                    />
                    <AvatarFallback>
                      {review.user.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium">{review.user.name}</h4>
                        <div className="flex items-center mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(review.rating)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm text-gray-500">
                            {formatDate(review.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-gray-700">{review.comment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : !loading ? (
          <div className="text-center py-8 text-gray-500">
            No reviews yet. Be the first to leave a review!
          </div>
        ) : null}

        {/* Load more button */}
        {hasMore && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={handleLoadMore}
              disabled={loading}
              className="border-orange-200 text-orange-600 hover:bg-orange-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                </>
              ) : (
                'Load More Reviews'
              )}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
