'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/custom/talent/edit/DashboardLayout';
import ProfileSidebar from '@/components/custom/talent/edit/ProfileSideBar';
import ProfileOverviewEditor from '@/components/custom/talent/edit/ProfileOverview';
import GeneralInfoEditor from '@/components/custom/talent/edit/GeneralInfo';
import PhotosEditor from '@/components/custom/talent/edit/Photos';
import VideosEditor from '@/components/custom/talent/edit/Videos';
import AudioEditor from '@/components/custom/talent/edit/Audio';
import DetailsEditor from '@/components/custom/talent/edit/Details';
import { useTalentProfile } from '@/hooks/useTalentProfile';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function ProfileDashboardPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState('overview');
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
  } = useTalentProfile();

  // Only run this effect once after initial load
  useEffect(() => {
    if (pageInitialized.current) return;

    // Check for section query parameter on initial load
    const sectionParam = searchParams.get('section');
    const validSections = [
      'overview',
      'general',
      'photos',
      'videos',
      'audio',
      'details',
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
      url.searchParams.set('section', activeSection);
      window.history.replaceState({}, '', url.toString());
    }
  }, [activeSection, initialLoading]);

  // Define navigation items with click handlers
  const navigationItems = [
    {
      label: 'Profile Overview',
      href: '/talent/profile/edit/overview',
      active: activeSection === 'overview',
      onClick: () => setActiveSection('overview'),
    },
    {
      label: 'General Info',
      href: '/talent/profile/edit/general',
      active: activeSection === 'general',
      onClick: () => setActiveSection('general'),
    },
    {
      label: 'Photos',
      href: '/talent/profile/edit/photos',
      active: activeSection === 'photos',
      onClick: () => setActiveSection('photos'),
    },
    {
      label: 'Videos',
      href: '/talent/profile/edit/videos',
      active: activeSection === 'videos',
      onClick: () => setActiveSection('videos'),
    },
    {
      label: 'Audio',
      href: '/talent/profile/edit/audio',
      active: activeSection === 'audio',
      onClick: () => setActiveSection('audio'),
    },
    {
      label: 'Details',
      href: '/talent/profile/edit/details',
      active: activeSection === 'details',
      onClick: () => setActiveSection('details'),
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
      talent.generalCategory,
      talent.specificCategory,
      talent.serviceName,
    ];

    totalFields += requiredFields.length;
    completedFields += requiredFields.filter(
      (field) => field && field.length > 0
    ).length;

    // Count media that meets requirements
    totalFields += 3; // One point each for images, videos, audio meeting minimum requirements

    const imageCount = talent.media.filter((m) => m.type === 'IMAGE').length;
    const videoCount = talent.media.filter((m) => m.type === 'VIDEO').length;
    const audioCount = talent.media.filter((m) => m.type === 'AUDIO').length;

    if (imageCount >= 4) completedFields += 1;
    if (videoCount >= 2) completedFields += 1;
    if (audioCount >= 2) completedFields += 1;

    return Math.round((completedFields / totalFields) * 100);
  };

  // Calculate an incomplete message based on missing items
  const getIncompleteMessage = () => {
    if (!talent) return 'Please complete your profile.';

    const imageCount = talent.media.filter((m) => m.type === 'IMAGE').length;
    const videoCount = talent.media.filter((m) => m.type === 'VIDEO').length;
    const audioCount = talent.media.filter((m) => m.type === 'AUDIO').length;

    const missingItems = [];

    if (imageCount < 4) missingItems.push('photos');
    if (videoCount < 2) missingItems.push('videos');
    if (audioCount < 2) missingItems.push('audio files');

    if (missingItems.length === 0) {
      return 'Your profile is complete! Looking great.';
    }

    return `Your profile needs more ${missingItems.join(', ')} to be complete.`;
  };

  // Handle form submissions for each section
  const handleGeneralInfoUpdate = async (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    city: string;
    bio: string;
    generalCategory: string;
    specificCategory: string;
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
        generalCategory: data.generalCategory,
        specificCategory: data.specificCategory,
        serviceName: data.serviceName,
      });
      toast.success('General information updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update general information');
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
      toast.success('Profile details updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile details');
    }
  };

  const handlePhotoSubmit = async (
    profilePicture: File | null,
    galleryImages: File[]
  ) => {
    try {
      await uploadImages(profilePicture, galleryImages);
      toast.success('Photos updated successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update photos');
    }
  };

  const handleVideoSubmit = async (videos: File[]) => {
    try {
      if (videos.length > 0) {
        await uploadVideos(videos);
        toast.success('Videos updated successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update videos');
    }
  };

  const handleAudioSubmit = async (audioFiles: File[]) => {
    try {
      if (audioFiles.length > 0) {
        await uploadAudio(audioFiles);
        toast.success('Audio files updated successfully');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update audio files');
    }
  };

  const handleMediaRemove = async (mediaId: string) => {
    try {
      await removeMedia(mediaId);
      toast.success('Media removed successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to remove media');
    }
  };

  // Loading state - only show on initial page load
  if (
    authStatus === 'loading' ||
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
      case 'overview':
        return (
          <ProfileOverviewEditor
            setActiveSection={setActiveSection}
            talent={talent}
            images={
              talent ? talent.media.filter((m) => m.type === 'IMAGE') : []
            }
            videos={
              talent ? talent.media.filter((m) => m.type === 'VIDEO') : []
            }
            audioFiles={
              talent ? talent.media.filter((m) => m.type === 'AUDIO') : []
            }
          />
        );

      case 'general':
        return (
          <GeneralInfoEditor
            firstName={talent.firstName || ''}
            lastName={talent.lastName || ''}
            phoneNumber={talent.phoneNumber || ''}
            address={talent.address || ''}
            city={talent.city || ''}
            bio={talent.bio || ''}
            generalCategory={talent.generalCategory || ''}
            specificCategory={talent.specificCategory || ''}
            serviceName={talent.serviceName || ''}
            onSubmit={handleGeneralInfoUpdate}
          />
        );

      case 'photos':
        const imageMedia = talent.media
          .filter((m) => m.type === 'IMAGE')
          .map((m) => ({ id: m.id, url: m.url }));

        return (
          <PhotosEditor
            profilePicture={talent.talentProfilePicture}
            images={imageMedia}
            onSubmit={handlePhotoSubmit}
            onRemove={handleMediaRemove}
          />
        );

      case 'videos':
        const videoMedia = talent.media
          .filter((m) => m.type === 'VIDEO')
          .map((m) => ({ id: m.id, url: m.url }));

        return (
          <VideosEditor
            videos={videoMedia}
            onSubmit={handleVideoSubmit}
            onRemove={handleMediaRemove}
          />
        );

      case 'audio':
        const audioMedia = talent.media
          .filter((m) => m.type === 'AUDIO')
          .map((m) => ({ id: m.id, url: m.url }));

        return (
          <AudioEditor
            audioFiles={audioMedia}
            onSubmit={handleAudioSubmit}
            onRemove={handleMediaRemove}
          />
        );

      case 'details':
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
