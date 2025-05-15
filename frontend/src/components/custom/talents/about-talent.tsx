import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  DollarSign,
  Mail,
  Phone,
  Instagram,
  Twitter,
  Facebook,
  Heart,
  Share2,
} from "lucide-react";
import type { Talent } from "@/types/prismaTypes";
import { ReviewsList } from "./reviews-list";

interface AboutTalentProps {
  talent: Talent;
}

export function AboutTalent({ talent }: AboutTalentProps) {
  // Get categories by type
  const generalCategories = talent.categories
    ? talent.categories
        .filter((tc) => tc.category.type === "GENERAL")
        .map((tc) => tc.category)
    : [];

  const specificCategories = talent.categories
    ? talent.categories
        .filter((tc) => tc.category.type === "SPECIFIC")
        .map((tc) => tc.category)
    : [];

  // Fallback to legacy categories if needed
  const hasLegacyCategories =
    (!generalCategories.length || !specificCategories.length) &&
    (talent.generalCategory || talent.specificCategory);

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

            {/* Fallback to legacy categories */}
            {hasLegacyCategories && (
              <>
                {talent.generalCategory && (
                  <Badge className="bg-orange-100 text-orange-600 border-orange-200">
                    {talent.generalCategory}
                  </Badge>
                )}
                {talent.specificCategory && (
                  <Badge className="bg-blue-100 text-blue-600 border-blue-200">
                    {talent.specificCategory}
                  </Badge>
                )}
              </>
            )}

            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
              <span className="ml-1 font-medium">{talent.rating}</span>
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
        {talent.socialLinks?.instagram && (
          <Link
            href={talent.socialLinks.instagram}
            className="text-orange-500 hover:text-orange-700"
          >
            <Instagram className="h-5 w-5" />
          </Link>
        )}
        {talent.socialLinks?.twitter && (
          <Link
            href={talent.socialLinks.twitter}
            className="text-orange-500 hover:text-orange-700"
          >
            <Twitter className="h-5 w-5" />
          </Link>
        )}
        {talent.socialLinks?.facebook && (
          <Link
            href={talent.socialLinks.facebook}
            className="text-orange-500 hover:text-orange-700"
          >
            <Facebook className="h-5 w-5" />
          </Link>
        )}
      </div>

      {/* Reviews section */}
      {talent?.reviews && talent.reviews.length > 0 && (
        <div className="mt-8">
          <ReviewsList talent={talent} />
        </div>
      )}
    </div>
  );
}
