"use client";

import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  reviewCount: number;
  size?: "sm" | "md";
  showCount?: boolean;
}

export function RatingDisplay({
  rating = 0,
  reviewCount = 0,
  size = "sm",
  showCount = true,
}: RatingDisplayProps) {
  const starSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  // Ensure rating is a number between 0 and 5
  const normalizedRating = Math.min(Math.max(Number(rating) || 0, 0), 5);

  if (normalizedRating === 0 && reviewCount === 0) {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((_, index) => (
          <Star key={index} className={`${starSize} text-gray-400`} />
        ))}
        {showCount && (
          <span className="text-xs text-gray-500 ml-1">No Reviews</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${starSize} ${
            star <= normalizedRating
              ? "text-yellow-500 fill-yellow-500"
              : "text-gray-300"
          }`}
        />
      ))}
      {showCount && (
        <span className="text-xs text-gray-500 ml-1">
          {normalizedRating.toFixed(1)} ({reviewCount})
        </span>
      )}
    </div>
  );
}
