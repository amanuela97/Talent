'use client';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/custom/Loader';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw } from 'lucide-react';
import axiosInstance from '@/app/utils/axios';

export default function VerifyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [talentData, setTalentData] = useState<{
    isEmailVerified: boolean;
    status: string;
    verificationToken: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // Check if user is authenticated and email is not verified
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.userId) {
      const checkTalentStatus = async () => {
        try {
          const response = await axiosInstance.get(
            `/talents/${session.user.userId}`
          );
          const data = response.data;
          setTalentData(data);

          // If talent profile is already verified
          if (data.isEmailVerified) {
            if (data.status === 'PENDING') {
              router.push('/join/pending');
            } else if (data.status === 'APPROVED') {
              router.push('/dashboard');
            } else {
              router.push('/join');
            }
          }
        } catch (error) {
          console.error('Error checking talent status:', error);
          router.push('/join');
        } finally {
          setIsLoading(false);
        }
      };

      checkTalentStatus();
    } else if (status !== 'loading') {
      router.push('/join');
    }
  }, [status, session, router]);

  // Handle resending verification email
  const handleResendEmail = async () => {
    if (!session?.user?.userId || !talentData) return;

    setIsSending(true);
    try {
      await axiosInstance.post('/auth/resend-verification-email', {
        email: session.user.email,
        verificationToken: talentData.verificationToken,
        name: `${talentData.firstName} ${talentData.lastName}`,
      });

      setSuccessMessage('Verification email sent successfully!');
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error resending verification email:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <Mail className="w-16 h-16 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
        <p className="text-gray-600 mb-6">
          We&apos;ve sent a verification email to{' '}
          <strong>{session?.user?.email}</strong>. Please check your inbox and
          click the verification link to continue.
        </p>

        {successMessage && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md mb-4">
            {successMessage}
          </div>
        )}

        <div className="p-4 bg-gray-50 rounded-lg mb-6">
          <h2 className="font-semibold mb-2">Didn&apos;t receive the email?</h2>
          <ul className="text-left text-sm text-gray-600 space-y-2">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure your email address is correct</li>
            <li>• Click the resend button below</li>
          </ul>
        </div>

        <Button
          onClick={handleResendEmail}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          disabled={isSending}
        >
          {isSending ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Resend Verification Email'
          )}
        </Button>
      </div>
    </div>
  );
}
