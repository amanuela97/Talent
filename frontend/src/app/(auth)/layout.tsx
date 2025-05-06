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
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      setIsRedirecting(true);
      const destination =
        typeof redirect === 'string' ? redirect : '/dashboard';
      router.push(destination);
    }
  }, [status, router, redirect]);

  if (status === 'loading' || isRedirecting) {
    return <Loader />;
  }

  return <div className="min-h-screen">{children}</div>;
}
