import { CheckCircle, AlertCircle, XCircle, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import axiosInstance from "@/app/utils/axios";
import type { Media, Talent } from "@/types/prismaTypes";
import { toast } from "sonner";

interface ProfileOverviewEditorProps {
  setActiveSection: (section: string) => void;
  talent: Talent | null;
  images: Media[];
  videos: Media[];
  audioFiles: Media[];
  refreshTalentData?: () => Promise<Talent | undefined>;
}

export default function ProfileOverviewEditor({
  setActiveSection,
  talent,
  images = [],
  videos = [],
  audioFiles = [],
  refreshTalentData,
}: ProfileOverviewEditorProps) {
  const router = useRouter();
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
  const [isPublic, setIsPublic] = useState<boolean>(talent?.isPublic || false);

  if (!talent) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-white rounded-md shadow-sm p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            No talent profile found
          </h1>
          <p className="text-gray-600 mb-6">
            You don&apos;t have a talent profile yet.
          </p>
          <Button onClick={() => router.push("/join")}>
            Create a Talent Profile
          </Button>
        </div>
      </div>
    );
  }

  // Calculate completeness scores
  const hasRequiredBasicInfo =
    talent.firstName &&
    talent.lastName &&
    ((talent.categories && talent.categories.length > 0) ||
      (talent.generalCategory && talent.specificCategory)) &&
    talent.serviceName &&
    talent.address &&
    talent.phoneNumber &&
    talent.city &&
    talent.bio;

  const hasRequiredDetails =
    talent.services?.length > 0 &&
    talent.hourlyRate &&
    talent.languagesSpoken.length > 0 &&
    talent.availability;

  const hasEnoughImages = images.length >= 4;
  const hasTooManyImages = images.length > 10;

  const hasEnoughVideos = videos.length >= 2;
  const hasTooManyVideos = videos.length > 4;

  const hasEnoughAudio = audioFiles.length >= 2;
  const hasTooManyAudio = audioFiles.length > 10;

  const hasAnyImages = images.length > 0;
  const hasAnyVideos = videos.length > 0;
  const hasAnyAudio = audioFiles.length > 0;

  const isProfileComplete =
    hasRequiredBasicInfo &&
    hasRequiredDetails &&
    hasEnoughImages &&
    hasEnoughVideos &&
    hasEnoughAudio;

  // Handle profile visibility toggle
  const handleVisibilityToggle = async () => {
    try {
      setIsUpdatingVisibility(true);
      const newIsPublic = !isPublic;

      // Make the API call to update the visibility
      await axiosInstance.patch(`/talents/${talent.talentId}`, {
        isPublic: newIsPublic,
      });

      // Update local state
      setIsPublic(newIsPublic);

      // Show success message
      toast.success(
        newIsPublic
          ? "Your profile is now public and visible to everyone"
          : "Your profile is now private"
      );

      // Refresh talent data if the refreshTalentData function is provided
      if (refreshTalentData) {
        await refreshTalentData();
      }
    } catch (error) {
      console.error("Failed to update profile visibility:", error);
      toast.error("Failed to update profile visibility. Please try again.");
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6">
          <h1 className="text-2xl font-bold text-gray-800">Profile Overview</h1>
          <p className="text-gray-600 mt-2">
            Check your profile status and make sure all requirements are met
          </p>
        </div>

        {/* Profile Visibility - New Section */}
        <div className="border rounded-md p-6">
          <h2 className="text-xl font-semibold mb-4">Profile Visibility</h2>

          <div className="flex items-center">
            <div
              className={`p-2 rounded-full mr-4 ${
                isPublic ? "bg-green-100" : "bg-gray-100"
              }`}
            >
              {isPublic ? (
                <Globe className="h-6 w-6 text-green-600" />
              ) : (
                <Lock className="h-6 w-6 text-gray-600" />
              )}
            </div>

            <div className="flex-grow">
              <h3 className="font-medium">
                {isPublic ? "Public Profile" : "Private Profile"}
              </h3>
              <p className="text-sm text-gray-500">
                {isPublic
                  ? "Your profile is visible to everyone."
                  : "Your profile is only visible to you and administrators."}
              </p>
            </div>

            <div className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                id="public-toggle"
                checked={isPublic}
                disabled={isUpdatingVisibility || talent.status !== "APPROVED"}
                onCheckedChange={handleVisibilityToggle}
                className={`${
                  isPublic
                    ? "bg-green-500 border-green-500"
                    : "bg-gray-200 border-gray-200"
                } size-6 rounded-full`}
              />
              <label htmlFor="public-toggle" className="text-sm text-gray-600">
                {isUpdatingVisibility ? "Updating..." : "Toggle visibility"}
              </label>
            </div>
          </div>

          {talent.status !== "APPROVED" && (
            <p className="mt-2 text-sm text-amber-600">
              Note: Your profile must be approved before it can be made public.
            </p>
          )}
        </div>

        <div className="p-6 space-y-8">
          {/* Profile Completeness */}
          <div className="border rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Completeness</h2>

            <div className="space-y-4">
              {/* Basic Information */}
              <div className="flex items-start space-x-3">
                {hasRequiredBasicInfo ? (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Basic Information</h3>
                  <p className="text-sm text-gray-500">
                    {hasRequiredBasicInfo
                      ? "Your basic information is complete."
                      : "Please complete your basic information (name, categories, etc.)"}
                  </p>
                  {!hasRequiredBasicInfo && (
                    <Button
                      variant="link"
                      onClick={() => setActiveSection("general")}
                      className="text-sm p-0 h-auto mt-1"
                    >
                      Complete basic information
                    </Button>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="flex items-start space-x-3">
                {hasRequiredDetails ? (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Profile Details</h3>
                  <p className="text-sm text-gray-500">
                    {hasRequiredDetails
                      ? "Your profile details are complete."
                      : "Please add more details to your profile (services, availability, hourlyRate, etc.)"}
                  </p>
                  {!hasRequiredDetails && (
                    <Button
                      variant="link"
                      onClick={() => setActiveSection("details")}
                      className="text-sm p-0 h-auto mt-1"
                    >
                      Complete profile details
                    </Button>
                  )}
                </div>
              </div>

              {/* Media - Photos */}
              <div className="flex items-start space-x-3">
                {!hasAnyImages ? (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                ) : !hasEnoughImages ? (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                ) : hasTooManyImages ? (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Photos</h3>
                  <p className="text-sm text-gray-500">
                    {!hasAnyImages
                      ? "You have no photos. Please add at least 4 photos."
                      : !hasEnoughImages
                      ? `You have ${
                          images.length
                        } photos. Please add at least ${
                          4 - images.length
                        } more.`
                      : hasTooManyImages
                      ? `You have ${images.length} photos, which exceeds the maximum of 10.`
                      : `You have ${images.length} photos. Looking good!`}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setActiveSection("photos")}
                    className="text-sm p-0 h-auto mt-1"
                  >
                    {!hasAnyImages || !hasEnoughImages
                      ? "Add more photos"
                      : hasTooManyImages
                      ? "Manage photos"
                      : "View photos"}
                  </Button>
                </div>
              </div>

              {/* Media - Videos */}
              <div className="flex items-start space-x-3">
                {!hasAnyVideos ? (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                ) : !hasEnoughVideos ? (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                ) : hasTooManyVideos ? (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Videos</h3>
                  <p className="text-sm text-gray-500">
                    {!hasAnyVideos
                      ? "You have no videos. Please add at least 2 videos."
                      : !hasEnoughVideos
                      ? `You have ${
                          videos.length
                        } videos. Please add at least ${
                          2 - videos.length
                        } more.`
                      : hasTooManyVideos
                      ? `You have ${videos.length} videos, which exceeds the maximum of 4.`
                      : `You have ${videos.length} videos. Looking good!`}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setActiveSection("videos")}
                    className="text-sm p-0 h-auto mt-1"
                  >
                    {!hasAnyVideos || !hasEnoughVideos
                      ? "Add more videos"
                      : hasTooManyVideos
                      ? "Manage videos"
                      : "View videos"}
                  </Button>
                </div>
              </div>

              {/* Media - Audio */}
              <div className="flex items-start space-x-3">
                {!hasAnyAudio ? (
                  <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                ) : !hasEnoughAudio ? (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                ) : hasTooManyAudio ? (
                  <AlertCircle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <h3 className="font-medium">Audio Files</h3>
                  <p className="text-sm text-gray-500">
                    {!hasAnyAudio
                      ? "You have no audio files. Please add at least 2 audio files."
                      : !hasEnoughAudio
                      ? `You have ${
                          audioFiles.length
                        } audio files. Please add at least ${
                          2 - audioFiles.length
                        } more.`
                      : hasTooManyAudio
                      ? `You have ${audioFiles.length} audio files, which exceeds the maximum of 10.`
                      : `You have ${audioFiles.length} audio files. Looking good!`}
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setActiveSection("audio")}
                    className="text-sm p-0 h-auto mt-1"
                  >
                    {!hasAnyAudio || !hasEnoughAudio
                      ? "Add more audio files"
                      : hasTooManyAudio
                      ? "Manage audio files"
                      : "View audio files"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Status */}
          <div className="border rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Status</h2>

            <div className="flex items-center">
              <div
                className={`p-2 rounded-full mr-4 ${
                  talent.status === "APPROVED"
                    ? "bg-green-100"
                    : talent.status === "REJECTED"
                    ? "bg-red-100"
                    : "bg-amber-100"
                }`}
              >
                {talent.status === "APPROVED" ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : talent.status === "REJECTED" ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                )}
              </div>

              <div>
                <h3 className="font-medium">
                  {talent.status === "APPROVED"
                    ? "Approved"
                    : talent.status === "REJECTED"
                    ? "Rejected"
                    : "Pending Review"}
                </h3>

                {talent.status === "REJECTED" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setActiveSection("general")}
                  >
                    Update Profile
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Verification */}
          <div className="border rounded-md p-6">
            <h2 className="text-xl font-semibold mb-4">Email Verification</h2>

            <div className="flex items-center">
              <div
                className={`p-2 rounded-full mr-4 ${
                  talent.isEmailVerified ? "bg-green-100" : "bg-amber-100"
                }`}
              >
                {talent.isEmailVerified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                )}
              </div>

              <div>
                <h3 className="font-medium">
                  {talent.isEmailVerified
                    ? "Email Verified"
                    : "Email Not Verified"}
                </h3>
                <p className="text-sm text-gray-500">
                  {talent.isEmailVerified
                    ? "Your email has been verified."
                    : "Please check your email for a verification link."}
                </p>

                {!talent.isEmailVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    // This would typically trigger a resend of the verification email
                    onClick={() => {
                      // Add verification resend logic here
                      alert(
                        "Verification email resent. Please check your inbox."
                      );
                    }}
                  >
                    Resend Verification Email
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Overall Status */}
          <div
            className={`rounded-md p-6 ${
              isProfileComplete && talent.status === "APPROVED"
                ? "bg-green-50 border-green-200 border"
                : "bg-amber-50 border-amber-200 border"
            }`}
          >
            <div className="flex items-center">
              {isProfileComplete && talent.status === "APPROVED" ? (
                <CheckCircle className="h-8 w-8 text-green-600 mr-4" />
              ) : (
                <AlertCircle className="h-8 w-8 text-amber-600 mr-4" />
              )}

              <div>
                <h2 className="text-xl font-semibold">
                  {isProfileComplete && talent.status === "APPROVED"
                    ? "Your profile is complete and live!"
                    : "Your profile needs attention"}
                </h2>
                <p className="text-gray-600 mt-1">
                  {isProfileComplete && talent.status === "APPROVED"
                    ? "Congratulations! Your profile is complete and approved. Customers can now find you."
                    : "Please complete all required sections and wait for admin approval to make your profile live."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
