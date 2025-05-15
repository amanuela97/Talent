'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/components/custom/Loader';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsRedirecting(true);
      const role = session?.user?.role;
      const roleBasedRoute =
        role === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
      const destination = redirect || roleBasedRoute;
      router.push(destination);
    }
  }, [status, router, redirect, session]);

  if (status === 'loading' || isRedirecting) {
    return <Loader />;
  }

  return <div className="min-h-screen">{children}</div>;
}
