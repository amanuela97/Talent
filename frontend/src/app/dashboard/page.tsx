'use client';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/app/store/store';
import { handleSignOut } from '@/app/utils/helper';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);
  const clearUser = useAppStore((state) => state.clearUser);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setUser({ ...session.user });
    }
  }, [session, status, setUser]);

  // Show loading while checking authentication
  if (status === 'loading' || !user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
      <h1 className="text-xl font-bold mb-4">Role: {user.role}!</h1>
      <button
        onClick={() => {
          // Clear your app store user data
          clearUser();
          // Use the logout helper
          handleSignOut();
        }}
        className="bg-red-500 text-white p-2 rounded"
      >
        Sign Out
      </button>
    </div>
  );
}
