"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardLayout from "@/components/custom/talent/edit/DashboardLayout";
import ProfileSidebar from "@/components/custom/talent/edit/ProfileSideBar";
import ProfileOverviewEditor from "@/components/custom/talent/edit/ProfileOverview";
import GeneralInfoEditor from "@/components/custom/talent/edit/GeneralInfo";
import PhotosEditor from "@/components/custom/talent/edit/Photos";
import VideosEditor from "@/components/custom/talent/edit/Videos";
import AudioEditor from "@/components/custom/talent/edit/Audio";
import DetailsEditor from "@/components/custom/talent/edit/Details";
import CalendarEditor from "@/components/custom/talent/edit/Calendar";
import { useTalentProfile } from "@/hooks/useTalentProfile";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function ProfileDashboardPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState("overview");
  const [initialLoading, setInitialLoading] = useState(true);
  const pageInitialized = useRef(false);
  const {
    talent,
    loading: talentLoading,
    error: talentError,
    updateGeneralInfo,
    updateDetails,
    uploadAudio,
    uploadImages,
    uploadVideos,
    removeMedia,
    refreshTalentData,
  } = useTalentProfile();

  // Only run this effect once after initial load
  useEffect(() => {
    if (pageInitialized.current) return;

    // Check for section query parameter on initial load
    const sectionParam = searchParams.get("section");
    const validSections = [
      "overview",
      "general",
      "photos",
      "videos",
      "audio",
      "details",
      "calendar",
    ];

    if (sectionParam && validSections.includes(sectionParam)) {
      setActiveSection(sectionParam);
    }

    // After initial data is loaded, set initialLoading to false
    if (!talentLoading && talent) {
      setInitialLoading(false);
      pageInitialized.current = true;
    }
  }, [searchParams, talentLoading, talent]);

  // Update URL without navigation when active section changes - but only after initialization
  useEffect(() => {
    if (!initialLoading && pageInitialized.current) {
      const url = new URL(window.location.href);
      url.searchParams.set("section", activeSection);
      window.history.replaceState({}, "", url.toString());
    }
  }, [activeSection, initialLoading]);

  // Helper function to set active section and scroll to top
  const handleSectionChange = (section: string) => {
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Define navigation items with click handlers
  const navigationItems = [
    {
      label: "Profile Overview",
      href: "/talent/profile/edit/overview",
      active: activeSection === "overview",
      onClick: () => handleSectionChange("overview"),
    },
    {
      label: "General Info",
      href: "/talent/profile/edit/general",
      active: activeSection === "general",
      onClick: () => handleSectionChange("general"),
    },
    {
      label: "Photos",
      href: "/talent/profile/edit/photos",
      active: activeSection === "photos",
      onClick: () => handleSectionChange("photos"),
    },
    {
      label: "Videos",
      href: "/talent/profile/edit/videos",
      active: activeSection === "videos",
      onClick: () => handleSectionChange("videos"),
    },
    {
      label: "Audio",
      href: "/talent/profile/edit/audio",
      active: activeSection === "audio",
      onClick: () => handleSectionChange("audio"),
    },
    {
      label: "Details",
      href: "/talent/profile/edit/details",
      active: activeSection === "details",
      onClick: () => handleSectionChange("details"),
    },
    {
      label: "Calendar",
      href: "/talent/profile/edit/calendar",
      active: activeSection === "calendar",
      onClick: () => handleSectionChange("calendar"),
    },
  ];

  // Calculate profile completion percentage
  const calculateCompletionPercentage = () => {
    if (!talent) return 0;

    let totalFields = 0;
    let completedFields = 0;

    // Check basic info
    const requiredFields = [
      talent.firstName,
      talent.lastName,
      talent.phoneNumber,
      talent.address,
      talent.city,
      talent.bio,
      talent.serviceName,
    ];

    totalFields += requiredFields.length;
    completedFields += requiredFields.filter(
      (field) => field && field.length > 0
    ).length;

    // Check categories
    totalFields += 1; // We need at least one category
    if (talent.categories && talent.categories.length > 0) {
      completedFields += 1;
    } else if (talent.generalCategory) {
      // Legacy field support
      completedFields += 1;
    }

    // Count media that meets requirements
    totalFields += 3; // One point each for images, videos, audio meeting minimum requirements

    const imageCount = talent.media.filter((m) => m.type === "IMAGE").length;
    const videoCount = talent.media.filter((m) => m.type === "VIDEO").length;
    const audioCount = talent.media.filter((m) => m.type === "AUDIO").length;

    if (imageCount >= 4) completedFields += 1;
    if (videoCount >= 2) completedFields += 1;
    if (audioCount >= 2) completedFields += 1;

    return Math.round((completedFields / totalFields) * 100);
  };

  // Calculate an incomplete message based on missing items
  const getIncompleteMessage = () => {
    if (!talent) return "Please complete your profile.";

    const imageCount = talent.media.filter((m) => m.type === "IMAGE").length;
    const videoCount = talent.media.filter((m) => m.type === "VIDEO").length;
    const audioCount = talent.media.filter((m) => m.type === "AUDIO").length;

    const missingItems = [];

    if (imageCount < 4) missingItems.push("photos");
    if (videoCount < 2) missingItems.push("videos");
    if (audioCount < 2) missingItems.push("audio files");

    if (missingItems.length === 0) {
      return "Your profile is complete! Looking great.";
    }

    return `Your profile needs more ${missingItems.join(", ")} to be complete.`;
  };

  // Define the Category interface
  interface Category {
    id: string;
    name: string;
    type: "GENERAL" | "SPECIFIC";
    parentId?: string | null;
  }

  // Define TalentCategory interface for mapping
  interface TalentCategory {
    id: string;
    talentId: string;
    categoryId: string;
    category: Category;
  }

  // Define a typing for talent with categories
  interface TalentWithCategoriesFields {
    categories?: TalentCategory[];
    generalCategory?: string;
    generalCategoryId?: string;
    specificCategory?: string;
    specificCategoryId?: string;
  }

  // Map categories from the TalentCategory structure to a simpler Category structure
  const mapTalentCategories = (
    talent: TalentWithCategoriesFields
  ): Category[] => {
    // If we have the new categories structure, use it
    if (talent.categories && Array.isArray(talent.categories)) {
      return talent.categories.map((tc: TalentCategory) => ({
        id: tc.category.id,
        name: tc.category.name,
        type: tc.category.type,
        parentId: tc.category.parentId,
      }));
    }

    // Fallback to legacy structure if needed
    const categories: Category[] = [];

    if (talent.generalCategory) {
      categories.push({
        id: talent.generalCategoryId || talent.generalCategory,
        name: talent.generalCategory,
        type: "GENERAL",
      });
    }

    if (talent.specificCategory) {
      categories.push({
        id: talent.specificCategoryId || talent.specificCategory,
        name: talent.specificCategory,
        type: "SPECIFIC",
        parentId: talent.generalCategoryId || talent.generalCategory,
      });
    }

    return categories;
  };

  // Handle form submissions for each section
  const handleGeneralInfoUpdate = async (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    city: string;
    bio: string;
    categories: Category[];
    serviceName: string;
  }) => {
    try {
      await updateGeneralInfo({
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        address: data.address,
        city: data.city,
        bio: data.bio,
        categories: data.categories,
        serviceName: data.serviceName,
      });
      toast.success("General information updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update general information");
    }
  };

  const handleDetailsUpdate = async (data: {
    services: string[];
    hourlyRate: number;
    availability: Record<string, string[]>;
    languagesSpoken: string[];
    socialLinks: Record<string, string>;
  }) => {
    try {
      await updateDetails({
        services: data.services,
        hourlyRate: data.hourlyRate,
        availability: data.availability,
        languagesSpoken: data.languagesSpoken,
        socialLinks: data.socialLinks,
      });
      toast.success("Profile details updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update profile details");
    }
  };

  const handlePhotoSubmit = async (
    profilePicture: File | null,
    galleryImages: File[]
  ) => {
    try {
      await uploadImages(profilePicture, galleryImages);
      toast.success("Photos updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update photos");
    }
  };

  const handleVideoSubmit = async (videos: File[]) => {
    try {
      if (videos.length > 0) {
        await uploadVideos(videos);
        toast.success("Videos updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update videos");
    }
  };

  const handleAudioSubmit = async (audioFiles: File[]) => {
    try {
      if (audioFiles.length > 0) {
        await uploadAudio(audioFiles);
        toast.success("Audio files updated successfully");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update audio files");
    }
  };

  const handleMediaRemove = async (mediaId: string) => {
    try {
      await removeMedia(mediaId);
      toast.success("Media removed successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove media");
    }
  };

  // Loading state - only show on initial page load
  if (
    authStatus === "loading" ||
    (initialLoading && !pageInitialized.current)
  ) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-xl">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (talentError || !talent) {
    return (
      <DashboardLayout>
        <div className="flex flex-col justify-center items-center min-h-screen">
          <h2 className="text-xl text-red-500 mb-4">Error loading profile</h2>
          <p className="text-gray-600 mb-4">
            We couldn&apos;t load your talent profile information. Please try
            again later.
          </p>
          <button
            onClick={() => router.refresh()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  // Render the active section component
  const renderActiveSection = () => {
    // Only show loading indicator on the specific section when it's being updated
    if (talentLoading && pageInitialized.current) {
      return (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <span className="ml-2">Loading...</span>
        </div>
      );
    }

    switch (activeSection) {
      case "overview":
        return (
          <ProfileOverviewEditor
            setActiveSection={handleSectionChange}
            talent={talent}
            images={
              talent ? talent.media.filter((m) => m.type === "IMAGE") : []
            }
            videos={
              talent ? talent.media.filter((m) => m.type === "VIDEO") : []
            }
            audioFiles={
              talent ? talent.media.filter((m) => m.type === "AUDIO") : []
            }
            refreshTalentData={refreshTalentData}
          />
        );

      case "general":
        return (
          <GeneralInfoEditor
            firstName={talent.firstName || ""}
            lastName={talent.lastName || ""}
            email={talent.email || ""}
            phoneNumber={talent.phoneNumber || ""}
            address={talent.address || ""}
            city={talent.city || ""}
            bio={talent.bio || ""}
            categories={mapTalentCategories(talent)}
            serviceName={talent.serviceName || ""}
            onSubmit={handleGeneralInfoUpdate}
          />
        );

      case "photos":
        const imageMedia = talent.media
          .filter((m) => m.type === "IMAGE")
          .map((m) => ({ id: m.id, url: m.url }));

        return (
          <PhotosEditor
            profilePicture={talent.talentProfilePicture}
            images={imageMedia}
            onSubmit={handlePhotoSubmit}
            onRemove={handleMediaRemove}
          />
        );

      case "videos":
        const videoMedia = talent.media
          .filter((m) => m.type === "VIDEO")
          .map((m) => ({ id: m.id, url: m.url }));

        return (
          <VideosEditor
            videos={videoMedia}
            onSubmit={handleVideoSubmit}
            onRemove={handleMediaRemove}
          />
        );

      case "audio":
        const audioMedia = talent.media
          .filter((m) => m.type === "AUDIO")
          .map((m) => ({ id: m.id, url: m.url }));

        return (
          <AudioEditor
            audioFiles={audioMedia}
            onSubmit={handleAudioSubmit}
            onRemove={handleMediaRemove}
          />
        );

      case "details":
        return (
          <DetailsEditor
            services={talent.services || []}
            hourlyRate={talent.hourlyRate || 0}
            availability={talent.availability || {}}
            languagesSpoken={talent.languagesSpoken || []}
            socialLinks={talent.socialLinks || {}}
            onSubmit={handleDetailsUpdate}
          />
        );

      case "calendar":
        return <CalendarEditor talentId={talent.talentId} />;

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col lg:flex-row gap-8 mx-12 mt-8">
        <div className="w-full lg:w-64 shrink-0">
          <ProfileSidebar
            name={`${talent.firstName} ${talent.lastName}`}
            profileImage={talent.talentProfilePicture}
            completionPercentage={calculateCompletionPercentage()}
            incompleteMessage={getIncompleteMessage()}
            navigationItems={navigationItems}
          />
        </div>
        <div className="flex-1 mx-6">{renderActiveSection()}</div>
      </div>
    </DashboardLayout>
  );
}
