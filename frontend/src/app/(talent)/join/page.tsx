'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Loader from '@/components/custom/Loader';
import { Button } from '@/components/ui/button';
import TalentRegistrationForm from '@/components/custom/talent/TalentRegistrationForm';
import axiosInstance from '@/app/utils/axios';
import { AxiosError } from 'axios';

export default function JoinPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isTalentExist, setIsTalentExist] = useState(false);

  // Check if user already has a talent profile
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.userId) {
      const checkTalentStatus = async () => {
        try {
          // In this case, the talent's ID is the same as the user's ID
          // since we defined the relation in schema.prisma with:
          // talent  Talent?  @relation(fields: [talentId], references: [userId])
          const response = await axiosInstance.get(
            `/talents/${session.user.userId}`
          );

          // If talent exists, check its status
          if (response.data) {
            const talentData = response.data;
            setIsTalentExist(true);

            if (talentData.isEmailVerified && talentData.status === 'PENDING') {
              router.push('/join/pending');
            } else if (talentData.status === 'APPROVED') {
              router.push('/dashboard');
            } else if (!talentData.isEmailVerified) {
              // Email not verified, show verification message
              router.push('/join/verify');
            }
          }
        } catch (error: unknown) {
          const axiosError = error as AxiosError;
          // 404 means talent doesn't exist (which is expected for new users)
          if (axiosError.response?.status !== 404) {
            console.error('Error checking talent status:', error);
          }
        } finally {
          setIsLoading(false);
        }
      };

      checkTalentStatus();
    } else if (status !== 'loading') {
      setIsLoading(false);
    }
  }, [status, session, router]);

  if (status === 'loading' || isLoading) {
    return <Loader />;
  }

  // If user is not authenticated, show login message
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Become a Talent</h1>
          <p className="text-gray-600 mb-6">
            You need to have an account before becoming a talent.
          </p>
          <Button
            onClick={() =>
              router.push(`/login?redirect=${encodeURIComponent('/join')}`)
            }
            className="bg-orange-500 hover:bg-orange-600 text-white cursor-pointer"
          >
            Log in or Sign up
          </Button>
        </div>
      </div>
    );
  }

  // If user already has a talent profile, show appropriate message
  if (isTalentExist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Talent Profile Exists</h1>
          <p className="text-gray-600 mb-6">
            You already have a talent profile. We&apos;re redirecting you to the
            appropriate page.
          </p>
          <Loader />
        </div>
      </div>
    );
  }

  // Show the talent registration form for authenticated users
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Become a Talent</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <TalentRegistrationForm userId={session?.user?.userId as string} />
      </div>
    </div>
  );
}
