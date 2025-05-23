"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Loader from "@/components/custom/Loader";
import TalentRegistrationForm from "@/components/custom/talent/TalentRegistrationForm";
import axiosInstance from "@/app/utils/axios";
import { AxiosError } from "axios";
import { BackButton } from "@/components/custom/BackButton";

export default function JoinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRejected, setIsRejected] = useState(false);
  const [existingTalentId, setExistingTalentId] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // This function handles the talent status check
    const checkTalentStatus = async (userId: string) => {
      try {
        const response = await axiosInstance.get(`/talents/user/${userId}`);

        if (response.data) {
          const talentData = response.data;

          // Handle different talent statuses
          if (!talentData.isEmailVerified) {
            router.push("/join/verify");
          } else if (talentData.status === "PENDING") {
            router.push("/join/pending");
          } else if (talentData.status === "APPROVED") {
            router.push("/dashboard/talent");
          } else if (talentData.status === "REJECTED") {
            setIsRejected(true);
            setExistingTalentId(talentData.talentId);
            setIsLoading(false);
          }
        }
      } catch (error: unknown) {
        const axiosError = error as AxiosError;

        // 404 means talent doesn't exist (which is expected for new users)
        if (axiosError.response?.status === 404) {
          // New user, show registration form
          setIsLoading(false);
        } else {
          console.error("Error checking talent status:", error);
          setIsLoading(false);
        }
      }
    };

    // This will only run on initial load or when the page is first rendered
    if (isInitialLoad) {
      setIsInitialLoad(false);

      // Check auth status and redirect/load accordingly
      if (status === "unauthenticated") {
        router.push(`/login?redirect=${encodeURIComponent("/join")}`);
        return;
      }

      if (status === "authenticated" && session?.user?.userId) {
        checkTalentStatus(session.user.userId);
      } else if (status !== "loading") {
        setIsLoading(false);
      }
    }
  }, [isInitialLoad]); // Only depends on isInitialLoad which changes once

  if (status === "loading" || isLoading) {
    return <Loader />;
  }

  // For authenticated users with no talent profile or rejected talents
  return (
    <div className="container mx-auto py-8">
      <BackButton route="/" page="home" />
      <h1 className="text-2xl font-bold mb-6 text-center">Become a Talent</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <TalentRegistrationForm
          userId={session?.user?.userId as string}
          isRejected={isRejected}
          existingTalentId={existingTalentId}
        />
      </div>
    </div>
  );
}
