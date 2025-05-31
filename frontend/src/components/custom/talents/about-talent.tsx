"use client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  DollarSign,
  Mail,
  Phone,
  Link2,
  Heart,
  Share2,
  MessageSquare,
} from "lucide-react";
import { ReviewsList } from "./reviews-list";
import { TalentProfileProps } from "./TalentProfile";
import { useState } from "react";
import { ReviewModal } from "./review-modal";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { getTalentByServiceName } from "@/lib/api/talents";

interface AboutTalentProps {
  talent: TalentProfileProps["talent"];
}

export function AboutTalent({ talent: initialTalent }: AboutTalentProps) {
  const { data: session } = useSession();
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Use React Query to keep talent data in sync
  const { data: talent } = useQuery({
    queryKey: ["talent", initialTalent.serviceName.replace(/ /g, "_")],
    queryFn: () =>
      getTalentByServiceName(initialTalent.serviceName.replace(/ /g, "_")),
    initialData: initialTalent,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });

  // Get categories by type
  const generalCategories = talent.categories
    ? talent.categories.filter((tc) => tc.type === "GENERAL").map((tc) => tc)
    : [];

  const specificCategories = talent.categories
    ? talent.categories.filter((tc) => tc.type === "SPECIFIC").map((tc) => tc)
    : [];

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">About Me</h2>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Show new categories if available */}
            {generalCategories.length > 0 &&
              generalCategories.map((category) => (
                <Badge
                  key={category.id}
                  className="bg-orange-100 text-orange-600 border-orange-200"
                >
                  {category.name}
                </Badge>
              ))}

            {specificCategories.length > 0 &&
              specificCategories.map((category) => (
                <Badge
                  key={category.id}
                  className="bg-blue-100 text-blue-600 border-blue-200"
                >
                  {category.name}
                </Badge>
              ))}

            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="ml-1 font-medium">
                {talent.rating.toFixed(1)}
              </span>
              <span className="ml-2 text-gray-500">
                ({talent.reviews?.length || 0} reviews)
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="rounded-full">
            <Heart className="h-4 w-4 text-orange-500" />
          </Button>
          <Button variant="outline" size="icon" className="rounded-full">
            <Share2 className="h-4 w-4 text-orange-500" />
          </Button>
        </div>
      </div>

      <p className="text-gray-700 mb-6">{talent.bio}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center text-gray-600">
          <MapPin className="h-5 w-5 mr-2 text-orange-500" />
          <span>{talent.city}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <DollarSign className="h-5 w-5 mr-2 text-orange-500" />
          <span>${talent.hourlyRate}/hour</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Mail className="h-5 w-5 mr-2 text-orange-500" />
          <span>{talent.email}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Phone className="h-5 w-5 mr-2 text-orange-500" />
          <span>{talent.phoneNumber}</span>
        </div>
      </div>

      <div className="flex gap-3">
        {Object.entries(talent.socialLinks || {}).map(([key, value]) => (
          <Link
            key={key}
            href={value}
            className="text-orange-500 hover:text-orange-700"
          >
            <span className="sr-only">{key}</span>
            <span>{key}</span>
            <Link2 className="h-5 w-5" />
          </Link>
        ))}
      </div>

      {/* Reviews section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2 p-2">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reviews</h2>
          <div className="flex items-center gap-4">
            {session?.user && talent.talentId !== session.user.userId && (
              <Button
                onClick={() => setIsReviewModalOpen(true)}
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {talent.reviews?.some(
                  (review) => review.userRevieweId === session.user.userId
                )
                  ? "Change Review"
                  : "Leave Review"}
              </Button>
            )}
          </div>
        </div>
        <ReviewsList talent={talent} />
      </div>
      <ReviewModal
        talent={talent}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      />
    </div>
  );
}
