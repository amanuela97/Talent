"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TalentSearchHeader from "@/components/custom/talents/TalentSearchHeader";
import TalentFilters from "@/components/custom/talents/TalentFilters";
import TalentGrid from "@/components/custom/talents/TalentGrid";
import AdvancedFilters from "@/components/custom/talents/AdvancedFilters";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";

export default function TalentsPage() {
  const searchParams = useSearchParams();
  const { categories, isLoading: loadingCategories } = useCategories();

  // State for filters
  const [filters, setFilters] = useState({
    search: searchParams.get("q") || "",
    category: searchParams.get("category") || "",
    services: [] as string[],
    city: searchParams.get("city") || "",
    languages: (searchParams.get("languages")?.split(",") || []) as string[],
    priceRange: [
      Number(searchParams.get("minPrice")) || 0,
      Number(searchParams.get("maxPrice")) || 500,
    ] as [number, number],
    page: 1,
    pageSize: 12,
    sortBy: "newest",
  });

  // Process URL search params on initial load
  const updateUrl = (params: {
    q?: string;
    category?: string;
    city?: string;
    languages?: string;
    minPrice?: string;
    maxPrice?: string;
  }) => {
    const newParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${newParams.toString()}`
    );
  };

  // Handlers
  const handleSearch = (query: string) => {
    setFilters((prev) => ({ ...prev, search: query, page: 1 }));
    updateUrl({ q: query });
  };

  const handleCategorySelect = (_categoryId: string, categoryName: string) => {
    const newCategory = filters.category === categoryName ? "" : categoryName;
    setFilters((prev) => ({ ...prev, category: newCategory, page: 1 }));
    updateUrl({ category: newCategory });
  };

  const handleAdvancedFiltersChange = (advancedFilters: {
    priceRange: [number, number];
    languages: string[];
    city: string;
  }) => {
    setFilters((prev) => ({
      ...prev,
      ...advancedFilters,
      page: 1,
    }));
    updateUrl({
      city: advancedFilters.city,
      languages: advancedFilters.languages.join(","),
      minPrice: advancedFilters.priceRange[0].toString(),
      maxPrice: advancedFilters.priceRange[1].toString(),
    });
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSortChange = (sortBy: string) => {
    setFilters((prev) => ({ ...prev, sortBy, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TalentSearchHeader
        onSearch={handleSearch}
        initialQuery={filters.search}
      />

      <div className="container mx-auto px-6 py-12">
        <div className="flex flex-wrap justify-between items-center mb-8">
          <Suspense fallback={<div>Loading categories...</div>}>
            <TalentFilters
              categories={categories}
              selectedCategory={filters.category}
              onCategorySelect={handleCategorySelect}
              isLoading={loadingCategories}
            />
          </Suspense>

          <div className="flex gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  Sort:
                  <span className="ml-1 font-medium">
                    {filters.sortBy === "newest" && "Newest"}
                    {filters.sortBy === "highest_rated" && "Highest Rated"}
                    {filters.sortBy === "lowest_price" && "Lowest Price"}
                    {filters.sortBy === "highest_price" && "Highest Price"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSortChange("newest")}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("highest_rated")}
                >
                  Highest Rated
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("lowest_price")}
                >
                  Lowest Price
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleSortChange("highest_price")}
                >
                  Highest Price
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <AdvancedFilters
              filters={{
                priceRange: filters.priceRange,
                languages: filters.languages,
                city: filters.city,
              }}
              onFiltersChange={handleAdvancedFiltersChange}
            />
          </div>
        </div>

        <Suspense fallback={<div>Loading talents...</div>}>
          <TalentGrid filters={filters} onPageChange={handlePageChange} />
        </Suspense>
      </div>
    </div>
  );
}
