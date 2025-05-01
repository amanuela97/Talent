'use client';

import { useRouter } from 'next/navigation';
import { useState, use } from 'react';
import axios from '@/app/utils/axios';
import { isAxiosError } from 'axios';

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
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
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-2 rounded"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          className="w-full border p-2 rounded"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white p-2 rounded hover:bg-green-700"
        >
          Reset Password
        </button>
      </form>

      {message && <p className="text-green-600 mt-4">{message}</p>}
      {error && <p className="text-red-600 mt-4">{error}</p>}
    </div>
  );
}
