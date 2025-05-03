import { signOut } from 'next-auth/react';
import axiosInstance from './axios';

export const handleSignOut = async () => {
  // Call your backend to clear the HTTP-only cookie
  await axiosInstance.post('/auth/logout');

  // Then sign out in NextAuth
  await signOut({ callbackUrl: '/login' });
};
