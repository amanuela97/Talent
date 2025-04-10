'use client';
import { getSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useAppStore } from '@/app/store/store';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();
  const user = useAppStore((state) => state.user);
  const setUser = useAppStore((state) => state.setUser);

  useEffect(() => {
    getSession().then((session) => {
      if (session) {
        console.log(session);
        setUser({ ...session.user });
      } else {
        router.push('/login');
      }
    });
  }, [router, setUser]);

  if (!user) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.name}!</h1>
      <h1 className="text-xl font-bold mb-4">Role: {user.role}!</h1>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="bg-red-500 text-white p-2 rounded"
      >
        Sign Out
      </button>
    </div>
  );
}
