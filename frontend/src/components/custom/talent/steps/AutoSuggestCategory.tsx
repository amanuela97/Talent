import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import axiosInstance from "@/app/utils/axios";
import { isAxiosError } from "axios";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  type: "GENERAL" | "SPECIFIC";
  parentId?: string | null;
}

interface AutoSuggestCategoryProps {
  value: Category | null;
  onChange: (cat: Category | null) => void;
  type: "GENERAL" | "SPECIFIC";
  parentId?: string;
  placeholder?: string;
}

export const AutoSuggestCategory: React.FC<AutoSuggestCategoryProps> = ({
  value,
  onChange,
  type,
  parentId,
  placeholder,
}) => {
  const [input, setInput] = useState(value?.name || "");
  const [suggestions, setSuggestions] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debouncedInput = useDebounce(input, 400);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!debouncedInput) {
        setSuggestions([]);
        return;
      }

      setLoading(true);

      try {
        const res = await axiosInstance.get(`/talent_categories`, {
          params: {
            type,
            search: debouncedInput,
            status: "ACTIVE",
            ...(parentId ? { parentId } : {}),
          },
        });
        setSuggestions(res.data);
      } catch (error) {
        const errorMessage = isAxiosError(error)
          ? error.response?.data?.message
          : error;
        if (errorMessage) {
          console.log("Error fetching categories:", errorMessage);
        } else {
          console.log("Unexpected error fetching categories:", error);
        }
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [debouncedInput, type, parentId]);

  const handleSelect = (cat: Category) => {
    setInput(cat.name);
    setShowDropdown(false);
    onChange(cat);
  };

  const handleAddNew = async () => {
    setLoading(true);
    try {
      // Log the request payload for debugging
      console.log("Sending category creation request:", {
        name: input,
        type,
        parentId: parentId || null,
      });

      const res = await axiosInstance.post("/talent_categories", {
        name: input,
        type,
        parentId: parentId || null, // Ensure null is sent instead of undefined
      });

      console.log("Category creation successful:", res.data);
      onChange(res.data);
      toast.success(
        `New ${type.toLowerCase()} category suggestion submitted for approval!`
      );
    } catch (error) {
      // Detailed error logging for debugging

      if (isAxiosError(error)) {
        console.log("Response data:", error.response?.data);
        // Log nested properties if data is an objec
        // Safely extract the error message regardless of its format
        let errorMessage = "Failed to add new category";

        if (isAxiosError(error) && error.response?.status === 400) {
          const responseData = error.response.data;

          // Handle different potential formats of error.response.data
          if (typeof responseData === "string") {
            errorMessage = responseData;
          } else if (typeof responseData?.message === "string") {
            errorMessage = responseData.message;
          } else if (responseData?.error) {
            errorMessage = responseData.error;
          } else if (Array.isArray(responseData?.message)) {
            // Handle array of error messages
            errorMessage = responseData.message.join(", ");
          } else if (typeof responseData?.message === "object") {
            // Handle object-type message (NestJS validation errors often have this format)
            const messageValues = Object.values(responseData.message);
            if (messageValues.length > 0) {
              // Flatten nested arrays if needed and join with commas
              errorMessage = messageValues
                .flat()
                .filter((val) => typeof val === "string")
                .join(", ");
            }
          }

          // Check if the error is about an existing or similar category
          const isDuplicateError =
            errorMessage.toLowerCase().includes("already exists") ||
            errorMessage.toLowerCase().includes("similar to existing") ||
            errorMessage.toLowerCase().includes("duplicate") ||
            errorMessage === "Category already exists or is pending";

          if (isDuplicateError) {
            toast.info(errorMessage);
          } else {
            toast.error(errorMessage);
          }
        } else {
          console.error("Error adding new category:", error);
          toast.error(errorMessage);
        }
      }
    } finally {
      setLoading(false);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative">
      <Input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
          setShowDropdown(true);
        }}
        placeholder={placeholder}
        onFocus={() => setShowDropdown(true)}
        autoComplete="off"
      />
      {showDropdown && (input.length > 0 || loading) && (
        <div className="absolute z-10 bg-white border w-full mt-1 rounded shadow">
          {loading && (
            <div className="p-2 text-sm text-gray-500">Loading...</div>
          )}
          {!loading &&
            suggestions.length > 0 &&
            suggestions.map((cat) => (
              <div
                key={cat.id}
                className={cn(
                  "p-2 cursor-pointer hover:bg-orange-100",
                  value?.id === cat.id && "bg-orange-200"
                )}
                onClick={() => handleSelect(cat)}
              >
                {cat.name}
              </div>
            ))}
          {!loading && suggestions.length === 0 && (
            <div className="p-2 text-sm text-gray-500 flex flex-col">
              <div className="flex items-center justify-between">
                <span>No exact match.</span>
                <Button size="sm" variant="ghost" onClick={handleAddNew}>
                  Add new: {input}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
