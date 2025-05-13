import { useSession } from 'next-auth/react';
import { useState, useEffect, useRef } from 'react';
import axiosInstance from '@/app/utils/axios';

interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO';
  url: string;
  description?: string;
}

export interface Talent {
  talentId: string;
  firstName: string;
  lastName: string;
  email: string;
  talentProfilePicture: string;
  generalCategory: string;
  specificCategory: string;
  serviceName: string;
  address: string;
  phoneNumber: string;
  bio: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isEmailVerified: boolean;
  verificationToken: string;
  services: string[];
  hourlyRate: number;
  city: string;
  availability: Record<string, string[]>;
  isOnline: boolean;
  isPublic: boolean;
  languagesSpoken: string[];
  rating: number;
  socialLinks: Record<string, string>;
  media: Media[];
  createdAt: string;
  updatedAt: string;
}

// Create a cache to store talent profiles globally
const talentCache = new Map<string, { talent: Talent; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const useTalentProfile = () => {
  const { data: session } = useSession();
  const userId = session?.user?.userId;
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initialFetchDone = useRef(false);

  // Fetch talent profile when user changes
  useEffect(() => {
    const fetchTalentProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      // Check if we already have cached data
      const cachedData = talentCache.get(userId);
      const now = Date.now();

      // If we have valid cached data, use it immediately
      if (cachedData && now - cachedData.timestamp < CACHE_DURATION) {
        setTalent(cachedData.talent);
        setLoading(false);
        initialFetchDone.current = true;
        return;
      }

      try {
        setLoading(true);
        const response = await axiosInstance.get(`/talents/${userId}`);

        if (response.status === 404) {
          // User doesn't have a talent profile yet
          console.error('Talent profile not found');
          setTalent(null);
          return;
        }

        // Cache the data
        talentCache.set(userId, {
          talent: response.data,
          timestamp: now,
        });

        setTalent(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        initialFetchDone.current = true;
      }
    };

    // Only fetch if we haven't already fetched or cached data
    if (!initialFetchDone.current) {
      fetchTalentProfile();
    }
  }, [userId]);

  // Update general info (firstName, lastName, etc.)
  interface GeneralInfoData {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    address: string;
    city: string;
    bio: string;
    generalCategory: string;
    specificCategory: string;
    serviceName: string;
  }

  const updateGeneralInfo = async (data: GeneralInfoData) => {
    if (!talent) return;

    try {
      const response = await axiosInstance.patch(
        `/talents/${talent.talentId}`,
        {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          address: data.address,
          city: data.city,
          bio: data.bio,
          generalCategory: data.generalCategory,
          specificCategory: data.specificCategory,
          serviceName: data.serviceName,
        }
      );

      // Update cache
      if (userId) {
        talentCache.set(userId, {
          talent: response.data,
          timestamp: Date.now(),
        });
      }

      setTalent(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  // Update profile details (services, hourlyRate, etc.)
  interface UpdateDetailsData {
    services: string[];
    hourlyRate: number;
    availability: Record<string, string[]>;
    languagesSpoken: string[];
    socialLinks: Record<string, string>;
  }

  const updateDetails = async (data: UpdateDetailsData) => {
    if (!talent) return;

    try {
      const response = await axiosInstance.patch(
        `/talents/${talent.talentId}`,
        {
          services: data.services,
          hourlyRate: data.hourlyRate,
          availability: data.availability,
          languagesSpoken: data.languagesSpoken,
          socialLinks: data.socialLinks,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        }
      );

      // Update cache
      if (userId) {
        talentCache.set(userId, {
          talent: response.data,
          timestamp: Date.now(),
        });
      }

      setTalent(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  // Upload profile picture and/or gallery images
  const uploadImages = async (
    profilePicture: File | null,
    galleryImages: File[]
  ) => {
    if (!talent) return;

    try {
      const formData = new FormData();
      let hasFiles = false;

      // Add the profile picture if provided
      if (profilePicture) {
        formData.append('profilePicture', profilePicture);
        hasFiles = true;
      }

      // Add gallery images if any
      if (galleryImages && galleryImages.length > 0) {
        galleryImages.forEach((file) => {
          formData.append('images', file);
        });
        hasFiles = true;
      }

      // Don't make the request if no files are provided
      if (!hasFiles) {
        setError('No media files provided');
        throw new Error('No media files provided');
      }

      const response = await axiosInstance.post(
        `/talents/${talent.talentId}/media/bulk`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Upload response:', response);

      // Refresh talent data to get updated media
      await refreshTalentData(true);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  // Upload videos
  const uploadVideos = async (videos: File[]) => {
    if (!talent) return;

    try {
      const formData = new FormData();

      // Validate videos array
      if (!videos || videos.length === 0) {
        setError('No video files provided');
        throw new Error('No video files provided');
      }

      // Add videos
      videos.forEach((file) => {
        formData.append('videos', file);
      });

      // Log the FormData to debug
      console.log('FormData contents for videos:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axiosInstance.post(
        `/talents/${talent.talentId}/media/bulk`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Upload video response:', response);

      // Refresh talent data to get updated media
      await refreshTalentData(true);
    } catch (err) {
      console.error('Upload video error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  // Upload audio files
  const uploadAudio = async (audioFiles: File[]) => {
    if (!talent) return;

    try {
      const formData = new FormData();

      // Validate audio files array
      if (!audioFiles || audioFiles.length === 0) {
        setError('No audio files provided');
        throw new Error('No audio files provided');
      }

      // Add audio files
      audioFiles.forEach((file) => {
        formData.append('audios', file);
      });

      // Log the FormData to debug
      console.log('FormData contents for audio:');
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }

      const response = await axiosInstance.post(
        `/talents/${talent.talentId}/media/bulk`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      console.log('Upload audio response:', response);

      // Refresh talent data to get updated media
      await refreshTalentData(true);
    } catch (err) {
      console.error('Upload audio error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  // Remove media item
  const removeMedia = async (mediaId: string) => {
    if (!talent) return;

    try {
      await axiosInstance.delete(`/talents/media/${mediaId}`);

      // Update local state by removing the deleted media
      const updatedTalent = {
        ...talent,
        media: talent.media.filter((item) => item.id !== mediaId),
      };

      // Update cache
      if (userId) {
        talentCache.set(userId, {
          talent: updatedTalent,
          timestamp: Date.now(),
        });
      }

      setTalent(updatedTalent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  // Refresh talent data from the server - use force parameter to force a refresh
  const refreshTalentData = async (force: boolean = false) => {
    if (!userId) return;

    if (!force) {
      // Check if we have fresh cached data
      const cachedData = talentCache.get(userId);
      const now = Date.now();

      if (cachedData && now - cachedData.timestamp < 30000) {
        // 30 seconds
        // Data is fresh enough, just use the cache
        setTalent(cachedData.talent);
        return cachedData.talent;
      }
    }

    try {
      setLoading(true);
      const response = await axiosInstance.get(`/talents/${userId}`);

      // Update cache
      talentCache.set(userId, {
        talent: response.data,
        timestamp: Date.now(),
      });

      setTalent(response.data);
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to filter media by type
  const getMediaByType = (type: 'IMAGE' | 'VIDEO' | 'AUDIO') => {
    if (!talent) return [];
    return talent.media.filter((item) => item.type === type);
  };

  return {
    talent,
    loading,
    error,
    updateGeneralInfo,
    updateDetails,
    uploadImages,
    uploadVideos,
    uploadAudio,
    removeMedia,
    refreshTalentData,
    getMediaByType,
    // Computed properties
    images: talent ? getMediaByType('IMAGE') : [],
    videos: talent ? getMediaByType('VIDEO') : [],
    audioFiles: talent ? getMediaByType('AUDIO') : [],
  };
};
