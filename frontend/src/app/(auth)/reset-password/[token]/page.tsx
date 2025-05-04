'use client';

import type React from 'react';
import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import Image from 'next/image';
import axios from '@/app/utils/axios';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, Lock } from 'lucide-react';
import { BackButton } from '@/components/custom/BackButton';

type Props = {
  params: Promise<{ token: string }>;
};

export default function ResetPasswordPage({ params }: Props) {
  const { token } = use(params);
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);

    if (newPassword !== confirmPassword) {
      setIsSubmitting(false);
      return setError('Passwords do not match');
    }

    try {
      await axios.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setMessage('Password reset successful! You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: unknown) {
      const errorMsg = isAxiosError(err)
        ? err.response?.data?.message
        : 'Something went wrong';
      setError(errorMsg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BackButton route="/login" page="login" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4">
            <Image
              src="/assets/talent-logo.png"
              alt="Talent Logo"
              width={100}
              height={50}
              priority
            />
            <div className="rounded-full bg-orange-100 p-3">
              <Lock className="h-6 w-6 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Reset your password
            </h1>
            <p className="text-sm text-gray-500 text-center">
              Please enter a new password for your account
            </p>
          </div>

          <div className="space-y-6">
            {message && (
              <Alert className="bg-green-50 border-green-200 text-green-800">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert className="bg-red-50 border-red-200 text-red-800">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <p className="text-xs text-gray-500">
                  Must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="min-w-[80px] max-w-[120px] w-[200px] bg-orange-500 hover:bg-orange-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
