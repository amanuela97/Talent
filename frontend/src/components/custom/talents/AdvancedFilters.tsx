"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import languagesData from "../../../../languages.json";

interface AdvancedFiltersProps {
  filters: {
    priceRange: [number, number];
    languages: string[];
    city: string;
  };
  onFiltersChange: (filters: {
    priceRange: [number, number];
    languages: string[];
    city: string;
  }) => void;
}

export default function AdvancedFilters({
  filters,
  onFiltersChange,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    let count = 0;
    if (localFilters.city) count++;
    if (localFilters.languages.length > 0) count++;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 500)
      count++;
    setActiveFiltersCount(count);
  }, [localFilters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      priceRange: [0, 500] as [number, number],
      languages: [] as string[],
      city: "",
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const toggleLanguage = (language: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter((l) => l !== language)
        : [...prev.languages, language],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center cursor-pointer">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 bg-orange-100 text-orange-700"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Advanced Filters</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Price Range Filter */}
          <div className="grid gap-2">
            <Label>Price Range (per hour)</Label>
            <div className="flex items-center gap-4">
              <span>${localFilters.priceRange[0]}</span>
              <Slider
                min={0}
                max={500}
                step={10}
                value={localFilters.priceRange}
                onValueChange={(value) =>
                  setLocalFilters((prev) => ({
                    ...prev,
                    priceRange: value as [number, number],
                  }))
                }
                className="flex-1"
              />
              <span>${localFilters.priceRange[1]}</span>
            </div>
          </div>

          {/* City Filter */}
          <div className="grid gap-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={localFilters.city}
              onChange={(e) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  city: e.target.value,
                }))
              }
              placeholder="Enter city name"
            />
          </div>

          {/* Languages Filter */}
          <div className="grid gap-2">
            <Label>Languages</Label>
            <ScrollArea className="h-[200px] rounded-md border p-4">
              <div className="grid gap-2">
                {languagesData.languages.map((language) => (
                  <div key={language} className="flex items-center space-x-2">
                    <Checkbox
                      id={language}
                      checked={localFilters.languages.includes(language)}
                      onCheckedChange={() => toggleLanguage(language)}
                    />
                    <label
                      htmlFor={language}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {language}
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={handleClearFilters} type="button">
            Clear Filters
          </Button>
          <Button
            onClick={handleApplyFilters}
            type="button"
            className="bg-orange-500 hover:bg-orange-600"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
