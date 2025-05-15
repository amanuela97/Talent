"use client";
import { useFormContext } from "react-hook-form";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { AutoSuggestCategory } from "./AutoSuggestCategory";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Define Category interface
interface Category {
  id: string;
  name: string;
  type: "GENERAL" | "SPECIFIC";
  parentId?: string | null;
}

export default function SpecificCategoryStep() {
  const { control, watch } = useFormContext();

  // Get all categories
  const categories: Category[] = watch("categories") || [];

  // Filter for categories by type
  const generalCategories = categories.filter(
    (cat: Category) => cat && cat.type === "GENERAL"
  );
  const specificCategories = categories.filter(
    (cat: Category) => cat && cat.type === "SPECIFIC"
  );

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Select one or more specific categories within your talent area
        {generalCategories.length > 0 && (
          <span className="font-medium">
            {" "}
            ({generalCategories.map((cat) => cat.name).join(", ")})
          </span>
        )}
      </p>

      {/* Display selected specific categories */}
      {specificCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {specificCategories.map((cat: Category, index: number) => (
            <Badge
              key={cat.id || index}
              className="bg-blue-100 text-blue-800 px-3 py-1 flex items-center gap-1"
            >
              {cat.name}
              <FormField
                control={control}
                name="categories"
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => {
                      const updatedCategories = field.value.filter(
                        (c: Category) => c.id !== cat.id
                      );
                      field.onChange(updatedCategories);
                    }}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <X size={14} />
                  </button>
                )}
              />
            </Badge>
          ))}
        </div>
      )}

      <FormField
        control={control}
        name="categories"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Add Specific Category</FormLabel>
            <FormControl>
              <AutoSuggestCategory
                value={null}
                onChange={(category) => {
                  if (!category) return;

                  // Check if category already exists
                  const exists = field.value?.some(
                    (cat: Category) => cat.id === category.id
                  );

                  if (!exists) {
                    // Add new category to the array
                    const newCategories = [...(field.value || []), category];
                    field.onChange(newCategories);
                  }
                }}
                type="SPECIFIC"
                parentId={
                  generalCategories.length > 0
                    ? generalCategories[0].id
                    : undefined
                }
                placeholder="Search or create a specific category"
              />
            </FormControl>
            <FormMessage />
            {generalCategories.length === 0 && (
              <p className="text-sm text-orange-600 mt-2">
                Please select at least one general category first
              </p>
            )}
          </FormItem>
        )}
      />
    </div>
  );
}
