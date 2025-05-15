import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AutoSuggestCategory } from "../steps/AutoSuggestCategory";
import { X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  type: "GENERAL" | "SPECIFIC";
  parentId?: string | null;
}

interface GeneralInfoEditorProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  bio: string;
  email: string;
  categories?: Category[];
  serviceName: string;
  onSubmit: (data: GeneralInfoFormData) => Promise<void>;
}

type GeneralInfoFormData = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  city: string;
  bio: string;
  email: string;
  categories: Category[];
  serviceName: string;
};

export default function GeneralInfoEditor({
  firstName,
  lastName,
  phoneNumber,
  address,
  city,
  bio,
  email,
  categories = [],
  serviceName,
  onSubmit,
}: GeneralInfoEditorProps) {
  const [formData, setFormData] = useState<GeneralInfoFormData>({
    firstName,
    lastName,
    phoneNumber,
    address,
    city,
    bio,
    email,
    categories,
    serviceName,
  });
  const [submitting, setSubmitting] = useState(false);

  // Get lists of general and specific categories
  const generalCategories = formData.categories.filter(
    (cat) => cat.type === "GENERAL"
  );
  const specificCategories = formData.categories.filter(
    (cat) => cat.type === "SPECIFIC"
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (category: Category | null) => {
    if (!category) return;

    setFormData((prev) => {
      // Check if the category is already selected to avoid duplicates
      const categoryExists = prev.categories.some(
        (cat) => cat.id === category.id
      );
      if (categoryExists) return prev;

      // Add the new category to the list
      return {
        ...prev,
        categories: [...prev.categories, category],
      };
    });
  };

  const removeCategory = (categoryId: string) => {
    setFormData((prev) => ({
      ...prev,
      categories: prev.categories.filter((cat) => cat.id !== categoryId),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">
            General Information
          </h1>
          <p className="text-gray-600 mt-2">
            Update your basic profile information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Your first name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Your last name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="Your phone number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Your email address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Your street address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Your city"
                required
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>General Categories</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {generalCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-orange-100 text-orange-800 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                  >
                    {cat.name}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <AutoSuggestCategory
                value={null}
                onChange={(category) => handleCategoryChange(category)}
                type="GENERAL"
                placeholder="Add a general category (e.g. Music, Food, Art)"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Specific Categories</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {specificCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center gap-1"
                  >
                    {cat.name}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat.id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <AutoSuggestCategory
                value={null}
                onChange={(category) => handleCategoryChange(category)}
                type="SPECIFIC"
                placeholder="Add a specific category (e.g. Chef, Pianist, Photographer)"
              />
              <p className="text-sm text-gray-500 mt-1">
                You can add multiple categories to better describe your services
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="serviceName">Service Name</Label>
              <Input
                id="serviceName"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="e.g. Gourmet Cooking, Piano Lessons"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell clients about yourself and your background"
              rows={5}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
