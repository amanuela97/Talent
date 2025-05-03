'use client';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  useEffect(() => {
    if (status === 'authenticated') {
      console.log('authlaout');
      redirect('/dashboard');
    }
  }, [status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return <div>{children}</div>;
}
