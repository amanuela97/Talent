'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Loader from '@/components/custom/Loader';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle } from 'lucide-react';
import axiosInstance from '@/app/utils/axios';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [verificationStatus, setVerificationStatus] = useState<
    'loading' | 'success' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setVerificationStatus('error');
      setErrorMessage('No verification token provided');
      return;
    }

    const verifyEmail = async () => {
      try {
        await axiosInstance.post('/talents/verify-email', { token });
        setVerificationStatus('success');
      } catch (error) {
        setVerificationStatus('error');
        setErrorMessage(
          (
            (error as import('axios').AxiosError)?.response?.data as {
              message?: string;
            }
          )?.message || 'Failed to verify email'
        );
        console.error('Email verification error:', error);
      }
    };

    verifyEmail();
  }, [token]);

  if (verificationStatus === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader />
        <p className="mt-4 text-gray-600">Verifying your email...</p>
      </div>
    );
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Verification Failed</h1>
          <p className="text-gray-600 mb-6">
            {errorMessage ||
              'There was a problem verifying your email. Please try again.'}
          </p>
          <Button
            onClick={() => router.push('/join')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            Return to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">Email Verified!</h1>
        <p className="text-gray-600 mb-6">
          Your email has been successfully verified. Your profile is now pending
          approval.
        </p>
        <Button
          onClick={() => router.push('/join/pending')}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          Continue to Dashboard
        </Button>
      </div>
    </div>
  );
}
