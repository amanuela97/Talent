"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  MapPin,
  DollarSign,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { TalentCard } from "@/components/custom/talents/talent-card";
import axiosInstance from "@/app/utils/axios";
import { toast } from "sonner";
import type { Category, Talent } from "@/types/prismaTypes";

// Common languages
const languages = [
  "English",
  "Spanish",
  "French",
  "German",
  "Chinese",
  "Japanese",
  "Arabic",
  "Russian",
  "Portuguese",
  "Hindi",
];

export default function TalentsPage() {
  const searchParams = useSearchParams();

  // State for talents and loading
  const [talents, setTalents] = useState<Partial<Talent>[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTalents, setTotalTalents] = useState(0);

  // State for categories from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<
    [number, number]
  >([0, 500]);

  // Pending filter states for the filter sheet
  const [pendingCity, setPendingCity] = useState("");
  const [pendingPriceRange, setPendingPriceRange] = useState<[number, number]>([
    0, 500,
  ]);
  const [pendingLanguages, setPendingLanguages] = useState<string[]>([]);
  const [pendingServices, setPendingServices] = useState<string[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);

  // Sorting
  const [sortBy, setSortBy] = useState("newest");

  // Mounted state to avoid hydration mismatch
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Process URL search params on initial load
  useEffect(() => {
    if (!isMounted) return;

    const q = searchParams.get("q");
    const category = searchParams.get("category");
    const city = searchParams.get("city");

    if (q) setSearchQuery(q);
    if (category) setSelectedCategory(category);
    if (city) setSelectedCity(city);

    // Update pending states too
    if (city) setPendingCity(city);
  }, [searchParams, isMounted]);

  // When the main filter states change, sync the pending states
  useEffect(() => {
    if (!isMounted) return;
    setPendingCity(selectedCity);
  }, [selectedCity, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    setPendingPriceRange(priceRange);
  }, [priceRange, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    setPendingLanguages(selectedLanguages);
  }, [selectedLanguages, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    setPendingServices(selectedServices);
  }, [selectedServices, isMounted]);

  // Fetch categories from the database
  useEffect(() => {
    if (!isMounted) return;

    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await axiosInstance.get("/talent_categories", {
          params: {
            type: "GENERAL",
            status: "ACTIVE",
          },
        });

        if (Array.isArray(response.data)) {
          setCategories(response.data);
        } else {
          console.error(
            "Unexpected categories response format:",
            response.data
          );
          setCategories([]);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories. Using default filters.");
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [isMounted]);

  // Implement debounced search
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [searchQuery, isMounted]);

  // Implement debounced price range
  useEffect(() => {
    if (!isMounted) return;

    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 500);

    return () => {
      clearTimeout(timer);
    };
  }, [priceRange, isMounted]);

  // Fetch talents with filters
  useEffect(() => {
    if (!isMounted) return;

    const fetchTalents = async () => {
      setLoading(true);
      try {
        // Build query parameters
        const params: Record<string, string | number | boolean> = {
          skip: (currentPage - 1) * pageSize,
          take: pageSize,
          isPublic: true,
        };

        // Add filters to params if they exist
        if (debouncedSearchQuery) {
          params.search = debouncedSearchQuery;
        }

        if (selectedCategory) {
          params.generalCategory = selectedCategory;
        }

        if (selectedServices.length > 0) {
          params.services = selectedServices.join(",");
        }

        if (selectedCity) {
          params.city = selectedCity;
        }

        if (selectedLanguages.length > 0) {
          params.languages = selectedLanguages.join(",");
        }

        if (debouncedPriceRange[0] > 0) {
          params.minHourlyRate = debouncedPriceRange[0];
        }

        if (debouncedPriceRange[1] < 500) {
          params.maxHourlyRate = debouncedPriceRange[1];
        }

        // Sorting
        if (sortBy === "highest_rated") {
          params.sortBy = "rating";
          params.sortOrder = "desc";
        } else if (sortBy === "lowest_price") {
          params.sortBy = "hourlyRate";
          params.sortOrder = "asc";
        } else if (sortBy === "highest_price") {
          params.sortBy = "hourlyRate";
          params.sortOrder = "desc";
        } else {
          // Default to sorting by newest
          params.sortBy = "createdAt";
          params.sortOrder = "desc";
        }

        const response = await axiosInstance.get("/talents", { params });

        // Handle different response formats
        let talentsData: Partial<Talent>[] = [];
        let total = 0;

        if (response.data) {
          if (Array.isArray(response.data)) {
            talentsData = response.data;
            total = response.data.length;
          } else if (
            response.data.talents &&
            Array.isArray(response.data.talents)
          ) {
            talentsData = response.data.talents;
            total = response.data.totalCount || talentsData.length;
          }
        }

        // Normalize talents data to prevent hydration issues
        const normalizedTalents = talentsData.map((talent) => ({
          ...talent,
          categories: Array.isArray(talent.categories) ? talent.categories : [],
          services: Array.isArray(talent.services) ? talent.services : [],
          media: Array.isArray(talent.media) ? talent.media : [],
          languagesSpoken: Array.isArray(talent.languagesSpoken)
            ? talent.languagesSpoken
            : [],
          hourlyRate:
            typeof talent.hourlyRate === "number" ? talent.hourlyRate : 0,
          rating: typeof talent.rating === "number" ? talent.rating : 0,
        }));

        setTalents(normalizedTalents);
        setTotalTalents(total);
      } catch (error) {
        console.error("Error fetching talents:", error);
        toast.error("Failed to load talents. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTalents();
  }, [
    debouncedSearchQuery,
    selectedCategory,
    selectedServices,
    selectedCity,
    selectedLanguages,
    debouncedPriceRange,
    currentPage,
    pageSize,
    sortBy,
    isMounted,
  ]);

  // Update URL with filters
  const updateUrlParams = () => {
    if (!isMounted) return;

    const params = new URLSearchParams();

    if (searchQuery) {
      params.set("q", searchQuery);
    }

    if (selectedCategory) {
      params.set("category", selectedCategory);
    }

    if (selectedCity) {
      params.set("city", selectedCity);
    }

    // Update URL without refreshing page
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newUrl }, "", newUrl);
  };

  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    updateUrlParams();
  };

  // Handle category selection
  const handleCategoryClick = (categoryId: string, categoryName: string) => {
    if (selectedCategory === categoryName) {
      // If already selected, deselect it
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryName);
    }
    setCurrentPage(1);
  };

  // Apply filters from modal
  const applyFilters = () => {
    setSelectedCity(pendingCity);
    setPriceRange(pendingPriceRange);
    setSelectedLanguages(pendingLanguages);
    setSelectedServices(pendingServices);
    setCurrentPage(1);
    updateUrlParams();
  };

  // Reset all filters
  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedServices([]);
    setSelectedCity("");
    setSelectedLanguages([]);
    setPriceRange([0, 500]);
    setSortBy("newest");
    setCurrentPage(1);
    setPendingCity("");
    setPendingPriceRange([0, 500]);
    setPendingLanguages([]);
    setPendingServices([]);
    updateUrlParams();
  };

  // Toggle service selection
  const toggleService = (service: string) => {
    setPendingServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  // Toggle language selection
  const toggleLanguage = (language: string) => {
    setPendingLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Avoid rendering anything on the server to prevent hydration mismatch
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero section with search */}
      <section className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-6 text-center">
            Discover Amazing Talent
          </h1>
          <p className="text-xl mb-8 text-center max-w-2xl mx-auto">
            Find the perfect performer for your next event, production, or
            project
          </p>

          <form
            onSubmit={handleSearch}
            className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-2 flex"
          >
            <Input
              placeholder="Search by talent name, category, or service..."
              className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button
              type="submit"
              className="ml-2 bg-orange-500 hover:bg-orange-600"
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto px-6 py-12">
        {/* Top filters row with categories, sort, and filter button */}
        <div className="flex flex-wrap justify-between items-center mb-8">
          <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
            <h2 className="text-lg font-semibold mr-4 flex items-center">
              Categories:
            </h2>
            {loadingCategories ? (
              // Show loading text for categories
              <p className="text-gray-500 text-sm">Loading categories...</p>
            ) : categories.length > 0 ? (
              // Show categories from database
              categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={
                    selectedCategory === category.name ? "default" : "outline"
                  }
                  className={`px-4 py-2 text-sm cursor-pointer ${
                    selectedCategory === category.name
                      ? "bg-orange-500 hover:bg-orange-600"
                      : "hover:bg-orange-100 border-orange-200"
                  }`}
                  onClick={() =>
                    handleCategoryClick(category.id, category.name)
                  }
                >
                  {category.name}
                </Badge>
              ))
            ) : (
              // Fallback if no categories are found
              <p className="text-gray-500 text-sm">No categories available</p>
            )}
          </div>

          <div className="flex gap-3">
            {/* Sort dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  Sort:
                  <span className="ml-1 font-medium">
                    {sortBy === "newest" && "Newest"}
                    {sortBy === "highest_rated" && "Highest Rated"}
                    {sortBy === "lowest_price" && "Lowest Price"}
                    {sortBy === "highest_price" && "Highest Price"}
                  </span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortBy("newest")}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("highest_rated")}>
                  Highest Rated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("lowest_price")}>
                  Lowest Price
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy("highest_price")}>
                  Highest Price
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Filter button and sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[300px] sm:w-[400px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                  <SheetDescription>
                    Refine your search with these filters
                  </SheetDescription>
                </SheetHeader>

                <div className="py-6 space-y-6">
                  {/* City filter */}
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <Input
                        id="city"
                        placeholder="Enter city name"
                        value={pendingCity}
                        onChange={(e) => setPendingCity(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Price range filter */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Hourly Rate ($)</Label>
                      <div className="flex items-center font-medium">
                        <DollarSign className="h-3 w-3" />
                        <span>{pendingPriceRange[0]}</span>
                        <span className="mx-2">-</span>
                        <DollarSign className="h-3 w-3" />
                        <span>{pendingPriceRange[1]}</span>
                      </div>
                    </div>
                    <Slider
                      min={0}
                      max={500}
                      step={5}
                      value={[pendingPriceRange[0], pendingPriceRange[1]]}
                      onValueChange={(value) =>
                        setPendingPriceRange([value[0], value[1]])
                      }
                      className="mt-6"
                    />
                  </div>

                  {/* Languages filter */}
                  <div className="space-y-2">
                    <Label>Languages</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {languages.map((language) => (
                        <div key={language} className="flex items-center">
                          <Checkbox
                            id={`lang-${language}`}
                            checked={pendingLanguages.includes(language)}
                            onCheckedChange={() => toggleLanguage(language)}
                          />
                          <label
                            htmlFor={`lang-${language}`}
                            className="ml-2 text-sm font-medium cursor-pointer"
                          >
                            {language}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services filter */}
                  <div className="space-y-2">
                    <Label>Services</Label>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {[
                          "Wedding",
                          "Corporate Events",
                          "Birthday Parties",
                          "Festivals",
                          "Studio Recording",
                        ].map((service) => (
                          <Badge
                            key={service}
                            variant={
                              pendingServices.includes(service)
                                ? "default"
                                : "outline"
                            }
                            className={`cursor-pointer ${
                              pendingServices.includes(service)
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "hover:bg-orange-100 border-orange-200"
                            }`}
                            onClick={() => toggleService(service)}
                          >
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <SheetFooter className="flex-row justify-between sm:justify-between">
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="text-orange-500 hover:text-orange-600"
                  >
                    Reset All
                  </Button>
                  <SheetClose asChild>
                    <Button
                      onClick={applyFilters}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Apply Filters
                    </Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Active filters display */}
        {(selectedCategory ||
          selectedServices.length > 0 ||
          selectedCity ||
          selectedLanguages.length > 0 ||
          priceRange[0] > 0 ||
          priceRange[1] < 500) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">
              Active filters:
            </span>

            {selectedCategory && (
              <Badge className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
                Category: {selectedCategory}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedCategory(null)}
                />
              </Badge>
            )}

            {selectedCity && (
              <Badge className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
                City: {selectedCity}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setSelectedCity("")}
                />
              </Badge>
            )}

            {(priceRange[0] > 0 || priceRange[1] < 500) && (
              <Badge className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
                Price: ${priceRange[0]} - ${priceRange[1]}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => setPriceRange([0, 500])}
                />
              </Badge>
            )}

            {selectedServices.map((service) => (
              <Badge
                key={service}
                className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200"
              >
                Service: {service}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleService(service)}
                />
              </Badge>
            ))}

            {selectedLanguages.map((language) => (
              <Badge
                key={language}
                className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200"
              >
                Language: {language}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleLanguage(language)}
                />
              </Badge>
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700"
              onClick={resetFilters}
            >
              Clear All
            </Button>
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <div className="mb-4">
            <p className="text-gray-600">
              {totalTalents} {totalTalents === 1 ? "talent" : "talents"} found
            </p>
          </div>
        )}

        {/* Talent grid with loading text */}
        {loading ? (
          <div className="text-center py-16">
            <p className="text-gray-600">Loading talents...</p>
          </div>
        ) : talents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {talents.map((talent) => (
              <TalentCard key={talent.talentId} talent={talent} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No talents found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search terms
            </p>
            <Button
              onClick={resetFilters}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Reset All Filters
            </Button>
          </div>
        )}

        {/* Pagination */}
        {!loading && talents.length > 0 && totalTalents > pageSize && (
          <div className="flex justify-center mt-10">
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Previous
              </Button>

              {Array.from({ length: Math.ceil(totalTalents / pageSize) }).map(
                (_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    className={
                      currentPage === i + 1
                        ? "bg-orange-500 hover:bg-orange-600"
                        : ""
                    }
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Button>
                )
              )}

              <Button
                variant="outline"
                disabled={currentPage === Math.ceil(totalTalents / pageSize)}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
