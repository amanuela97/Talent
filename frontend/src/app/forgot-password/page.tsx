'use client';

import { useState } from 'react';
import axios from '@/app/utils/axios';
import { isAxiosError } from 'axios';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await axios.post('/auth/forgot-password', {
        email,
      });

      setMessage(res.data || 'Password reset email has been sent.');
    } catch (err: unknown) {
      const errorMsg = isAxiosError(err)
        ? err?.response?.data?.message
        : 'Something went wrong. Try again.';
      setError(errorMsg);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
        >
          Send Reset Link
        </button>
      </form>

      {message && (
        <p className="text-green-600 mt-4">
          {typeof message === 'string' ? message : 'unkown'}
        </p>
      )}
      {error && <p className="text-red-600 mt-4">{error}</p>}
      {error && (
        <p className="text-red-500">
          {typeof error === 'string' ? error : 'An error occurred.'}
        </p>
      )}
    </div>
  );
}
