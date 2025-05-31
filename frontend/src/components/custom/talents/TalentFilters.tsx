import { Badge } from "@/components/ui/badge";
import type { Category } from "@/types/prismaTypes";

interface TalentFiltersProps {
  categories: Category[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  isLoading: boolean;
}

export default function TalentFilters({
  categories,
  selectedCategory,
  onCategorySelect,
  isLoading,
}: TalentFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
      <h2 className="text-lg font-semibold mr-4 flex items-center">
        Categories:
      </h2>
      {isLoading ? (
        <p className="text-gray-500 text-sm">Loading categories...</p>
      ) : categories.length > 0 ? (
        categories.map((category) => (
          <Badge
            key={category.id}
            variant={selectedCategory === category.name ? "default" : "outline"}
            className={`px-4 py-2 text-sm cursor-pointer ${
              selectedCategory === category.name
                ? "bg-orange-500 hover:bg-orange-600"
                : "hover:bg-orange-100 border-orange-200"
            }`}
            onClick={() => onCategorySelect(category.id, category.name)}
          >
            {category.name}
          </Badge>
        ))
      ) : (
        <p className="text-gray-500 text-sm">No categories available</p>
      )}
    </div>
  );
}
