import Link from "next/link";
import Image from "next/image";
import { MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Talent } from "@/types/prismaTypes";

interface TalentCardProps {
  talent: Partial<Talent>;
}

export function TalentCard({ talent }: TalentCardProps) {
  // Format service name for URL - replace spaces with underscores and make lowercase
  const formattedServiceName = talent.serviceName
    ? talent.serviceName.toLowerCase().replace(/\s+/g, "_")
    : "";

  // Safely handle categories - ensure it's an array
  const categories = Array.isArray(talent.categories) ? talent.categories : [];
  const hasCategories = categories.length > 0;

  // Get specific categories with safe access
  const specificCategories = hasCategories
    ? categories
        .filter((tc) => {
          // Make sure tc and tc.category exist before checking type
          if (!tc || !tc.category) return false;
          return (
            tc.category.type === "SPECIFIC" ||
            // If we can't determine type, include it as fallback
            !tc.category.type
          );
        })
        .map((tc) => tc.category)
        .filter(Boolean) // Remove any nullish values
        .slice(0, 2)
    : [];

  // Fallback to legacy categories if needed
  const hasLegacyCategories =
    typeof talent.specificCategory === "string" &&
    talent.specificCategory.length > 0 &&
    specificCategories.length === 0;

  return (
    <Link href={`/talents/${formattedServiceName}`} className="group">
      <div className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
        <div className="relative h-64 overflow-hidden">
          <Image
            width={300}
            height={300}
            src={talent.talentProfilePicture || "/placeholder.svg"}
            alt={`${talent.firstName || ""} ${talent.lastName || ""}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {typeof talent.hourlyRate === "number" && (
            <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 text-sm font-medium text-gray-900 shadow">
              ${talent.hourlyRate}/hr
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900">
              {talent.firstName || ""} {talent.lastName || ""}
            </h3>
            {typeof talent.rating === "number" && talent.rating > 0 && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                <span className="ml-1 text-sm font-medium">
                  {talent.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {talent.serviceName && (
            <p className="text-orange-600 font-medium mb-2">
              {talent.serviceName}
            </p>
          )}

          {talent.city && (
            <div className="flex items-center text-gray-500 mb-3">
              <MapPin className="h-4 w-4 mr-1" />
              <span className="text-sm">{talent.city}</span>
            </div>
          )}

          {/* Display categories - either specific categories or general categories */}
          {specificCategories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {specificCategories.map((category) => (
                <Badge
                  key={category.id}
                  variant="secondary"
                  className="bg-blue-50 text-blue-600 border-blue-100"
                >
                  {category.name}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-orange-600 border-orange-100"
                >
                  +{categories.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* If no specific categories found, but we have categories, show the first 2 */}
          {specificCategories.length === 0 && hasCategories && (
            <div className="flex flex-wrap gap-1 mt-3">
              {categories.slice(0, 2).map((tc) => (
                <Badge
                  key={tc.category?.id || tc.id}
                  variant="secondary"
                  className="bg-blue-50 text-blue-600 border-blue-100"
                >
                  {tc.category?.name || "Category"}
                </Badge>
              ))}
              {categories.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-orange-600 border-orange-100"
                >
                  +{categories.length - 2} more
                </Badge>
              )}
            </div>
          )}

          {/* Fallback to legacy categories if needed */}
          {hasLegacyCategories && (
            <div className="flex flex-wrap gap-1 mt-3">
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-600 border-blue-100"
              >
                {talent.specificCategory}
              </Badge>
            </div>
          )}

          {/* Show services if we have them */}
          {Array.isArray(talent.services) && talent.services.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {talent.services.slice(0, 2).map((service, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-orange-50 text-orange-600 border-orange-100"
                >
                  {service}
                </Badge>
              ))}
              {talent.services.length > 2 && (
                <Badge
                  variant="secondary"
                  className="bg-orange-50 text-orange-600 border-orange-100"
                >
                  +{talent.services.length - 2} more
                </Badge>
              )}
            </div>
          )}

          <Button className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
            View Profile
          </Button>
        </div>
      </div>
    </Link>
  );
}
