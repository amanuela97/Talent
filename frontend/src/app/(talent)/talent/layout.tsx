'use client';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import Loader from '@/components/custom/Loader';
import { useTalentProfile } from '@/hooks/useTalentProfile';

export default function TalentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { talent, loading: talentLoading } = useTalentProfile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const authCheckCompleted = useRef(false);

  useEffect(() => {
    // Skip rechecking if we've already done an initial auth check
    if (authCheckCompleted.current) return;

    if (status === 'unauthenticated') {
      setIsRedirecting(true);
      router.push('/login');
      return;
    }

    // Wait until both session and talent data are loaded
    if (status === 'authenticated' && !talentLoading) {
      const userRole = session?.user?.role;
      const talentStatus = talent?.status;
      authCheckCompleted.current = true;

      // Only allow APPROVED talents to access talent routes
      if (userRole === 'TALENT') {
        if (talentStatus === 'APPROVED') {
          // Allow access to talent routes
          return;
        } else if (talentStatus === 'PENDING') {
          setIsRedirecting(true);
          router.push('/join/pending');
          return;
        } else if (talentStatus === 'REJECTED') {
          setIsRedirecting(true);
          router.push('/join');
          return;
        } else {
          setIsRedirecting(true);
          router.push('/');
          return;
        }
      } else {
        // Redirect other roles to their appropriate dashboards
        setIsRedirecting(true);
        const roleBasedRoute =
          userRole === 'ADMIN' ? '/admin/dashboard' : '/dashboard';
        const destination = redirect ?? roleBasedRoute;
        router.push(destination);
      }
    }
  }, [status, router, redirect, session, talent, talentLoading]);

  // Show the loader only during initial load or when actually redirecting
  if ((status === 'loading' || talentLoading) && !authCheckCompleted.current) {
    return <Loader />;
  }

  if (isRedirecting) {
    return <Loader />;
  }

  // Only render children if user is authenticated and is an APPROVED talent
  return <div className="min-h-screen">{children}</div>;
}
