import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";
import { toast } from "sonner";
import type { Category } from "@prisma/client";

export function useCategories() {
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      try {
        const response = await axiosInstance.get("/talent_categories", {
          params: {
            type: "GENERAL",
            status: "ACTIVE",
          },
        });

        if (Array.isArray(response.data)) {
          return response.data;
        }
        console.error("Unexpected categories response format:", response.data);
        return [];
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
        return [];
      }
    },
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
  });

  return { categories, isLoading };
}
