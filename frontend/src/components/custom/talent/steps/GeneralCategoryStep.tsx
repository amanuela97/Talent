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

export default function GeneralCategoryStep() {
  const { control, watch } = useFormContext();
  const categories: Category[] = watch("categories") || [];

  // Filter for general categories only
  const generalCategories = categories.filter(
    (cat: Category) => cat && cat.type === "GENERAL"
  );

  return (
    <div className="space-y-4">
      <p className="text-gray-600 mb-4">
        Choose one or more general categories that best describe your talent
      </p>

      {/* Display selected general categories */}
      {generalCategories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {generalCategories.map((cat: Category, index: number) => (
            <Badge
              key={cat.id || index}
              className="bg-orange-100 text-orange-800 px-3 py-1 flex items-center gap-1"
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
                    className="text-orange-600 hover:text-orange-800 ml-1"
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
            <FormLabel>Add General Category</FormLabel>
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
                type="GENERAL"
                placeholder="Search or create a general category"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
