'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/custom/Loader';
import { Clock } from 'lucide-react';
import axiosInstance from '@/app/utils/axios';
import { AxiosError } from 'axios';

export default function PendingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated and profile is pending
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.userId) {
      const checkTalentStatus = async () => {
        try {
          const response = await axiosInstance.get(
            `/talents/${session.user.userId}`
          );
          const talentData = response.data;

          // If email not verified, redirect to verification page
          if (!talentData.isEmailVerified) {
            router.push('/join/verify');
            return;
          }

          // If talent profile is approved, redirect to dashboard
          if (talentData.status === 'APPROVED') {
            router.push('/dashboard');
            return;
          }

          // If status is not PENDING, redirect to join page
          if (talentData.status !== 'PENDING') {
            router.push('/join');
            return;
          }

          // Otherwise, we're good to show the pending page
          setIsLoading(false);
        } catch (error) {
          const axiosError = error as AxiosError;

          console.error('Error checking talent status:', error);
          // If talent doesn't exist (404), redirect to join page
          if (axiosError.response?.status === 404) {
            router.push('/join');
          } else {
            // For other errors, also redirect to join
            router.push('/join');
          }
        }
      };

      checkTalentStatus();
    } else if (status !== 'loading') {
      router.push('/join');
    }
  }, [status, session, router]);

  if (status === 'loading' || isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <Clock className="w-16 h-16 text-orange-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Application Under Review</h1>
        <p className="text-gray-600 mb-6">
          Thank you! Your profile is under review. We&apos;ll notify you once
          it&apos;s approved.
        </p>
        <div className="p-4 bg-gray-50 rounded-lg">
          <h2 className="font-semibold mb-2">What happens next?</h2>
          <ol className="text-left text-sm text-gray-600 space-y-2">
            <li>1. Our team will review your profile</li>
            <li>
              2. You&apos;ll receive an email when your profile is approved
            </li>
            <li>3. Once approved, you can access your talent dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
