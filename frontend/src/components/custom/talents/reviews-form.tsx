import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { StarIcon } from 'lucide-react';
import { toast } from 'sonner';
import axiosInstance from '@/app/utils/axios';
import type { Talent } from '@/types/prismaTypes';

interface ReviewsFormProps {
  talent: Talent;
  onReviewAdded: () => void;
}

export function ReviewsForm({ talent, onReviewAdded }: ReviewsFormProps) {
  const { data: session, status } = useSession();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setIsSubmitting(true);
      await axiosInstance.post(`/talents/${talent.talentId}/review`, {
        rating,
        comment,
      });

      // Reset form
      setRating(0);
      setComment('');

      // Notify parent component to refresh reviews
      onReviewAdded();

      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'unauthenticated') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 text-amber-800 mb-6">
        <p className="text-sm">
          Please{' '}
          <a href="/login" className="font-medium underline">
            sign in
          </a>{' '}
          to leave a review.
        </p>
      </div>
    );
  }

  return (
    <div className="mb-8 bg-gray-50 p-5 rounded-lg border border-gray-100">
      <h3 className="font-semibold text-lg mb-4">Write a Review</h3>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Label className="block mb-2">Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none"
              >
                <StarIcon
                  size={24}
                  className={`${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <Label htmlFor="comment" className="block mb-2">
            Review
          </Label>
          <Textarea
            id="comment"
            placeholder="Share your experience with this talent..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <Button
          type="submit"
          className="bg-orange-500 hover:bg-orange-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </Button>
      </form>
    </div>
  );
}
