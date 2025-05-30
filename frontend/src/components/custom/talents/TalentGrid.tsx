"use client";

import { useQuery } from "@tanstack/react-query";
import { TalentCard } from "@/components/custom/talents/talent-card";
import { Button } from "@/components/ui/button";
import type { Talent } from "@/types/prismaTypes";
import axiosInstance from "@/app/utils/axios";
import { toast } from "sonner";

interface TalentGridProps {
  filters: {
    search?: string;
    category?: string;
    services?: string[];
    city?: string;
    languages?: string[];
    priceRange?: [number, number];
    page: number;
    pageSize: number;
    sortBy: string;
  };
  onPageChange: (page: number) => void;
}

export default function TalentGrid({ filters, onPageChange }: TalentGridProps) {
  const fetchTalents = async () => {
    const params: Record<string, string | number | boolean> = {
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      isPublic: true,
    };

    if (filters.search) params.search = filters.search;
    if (filters.category) params.generalCategory = filters.category;
    if (filters.services?.length) params.services = filters.services.join(",");
    if (filters.city) params.city = filters.city;
    if (filters.languages?.length)
      params.languages = filters.languages.join(",");
    if (filters.priceRange) {
      if (filters.priceRange[0] > 0)
        params.minHourlyRate = filters.priceRange[0];
      if (filters.priceRange[1] < 500)
        params.maxHourlyRate = filters.priceRange[1];
    }

    // Sorting
    if (filters.sortBy === "highest_rated") {
      params.sortBy = "rating";
      params.sortOrder = "desc";
    } else if (filters.sortBy === "lowest_price") {
      params.sortBy = "hourlyRate";
      params.sortOrder = "asc";
    } else if (filters.sortBy === "highest_price") {
      params.sortBy = "hourlyRate";
      params.sortOrder = "desc";
    } else {
      params.sortBy = "createdAt";
      params.sortOrder = "desc";
    }

    const response = await axiosInstance.get("/talents", { params });
    return response.data;
  };

  const { data, isLoading, error } = useQuery<{
    talents: Partial<Talent>[];
    totalCount: number;
    page: number;
    pageSize: number;
    pageCount: number;
  }>({
    queryKey: ["talents", filters],
    queryFn: fetchTalents,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    toast.error("Failed to load talents. Please try again.");
    return null;
  }

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Loading talents...</p>
      </div>
    );
  }

  const talents = data?.talents || [];
  const totalTalents = data?.totalCount || 0;

  if (totalTalents === 0) {
    return (
      <div className="text-center py-16">
        <h3 className="text-xl font-medium text-gray-900 mb-2">
          No talents found
        </h3>
        <p className="text-gray-600 mb-6">
          Try adjusting your filters or search terms
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <p className="text-gray-600">
          {totalTalents} {totalTalents === 1 ? "talent" : "talents"} found
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {talents.map((talent: Partial<Talent>) => (
          <TalentCard key={talent.talentId} talent={talent} />
        ))}
      </div>

      {totalTalents > filters.pageSize && (
        <div className="flex justify-center mt-10">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => onPageChange(filters.page - 1)}
            >
              Previous
            </Button>

            {Array.from({
              length: Math.ceil(totalTalents / filters.pageSize),
            }).map((_, i) => (
              <Button
                key={i}
                variant={filters.page === i + 1 ? "default" : "outline"}
                className={
                  filters.page === i + 1
                    ? "bg-orange-500 hover:bg-orange-600"
                    : ""
                }
                onClick={() => onPageChange(i + 1)}
              >
                {i + 1}
              </Button>
            ))}

            <Button
              variant="outline"
              disabled={
                filters.page === Math.ceil(totalTalents / filters.pageSize)
              }
              onClick={() => onPageChange(filters.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
