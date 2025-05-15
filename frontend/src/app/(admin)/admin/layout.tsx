'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Loader from '@/components/custom/Loader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if user is authenticated and is an admin
    console.log(status, session?.user?.role);
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        // Not an admin, redirect to home
        router.push('/');
      }
    } else if (status === 'unauthenticated') {
      // Not authenticated, redirect to login
      router.push('/login?callbackUrl=' + encodeURIComponent(pathname));
    }
  }, [status, session, router, pathname]);

  // Show loading state while checking authentication
  if (
    status === 'loading' ||
    (status === 'authenticated' && !session?.user?.role)
  ) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If not admin but still authenticated, the useEffect will handle the redirect
  if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
    return <Loader />;
  }

  return <>{children}</>;
}
