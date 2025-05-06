import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/app/utils/axios';
import { isAxiosError } from 'axios';
import { useAppStore } from '@/app/store/store';

type TalentStatus =
  | 'loading'
  | 'no-profile'
  | 'unverified'
  | 'pending'
  | 'approved'
  | 'rejected';

export function useTalentStatus() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [status, setStatus] = useState<TalentStatus>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const setTalentData = useAppStore((state) => state.addTalent);
  const talentData = useAppStore((state) => state.talents);

  // Fetch talent status
  useEffect(() => {
    // Only run this effect when we have an authenticated session
    if (authStatus !== 'authenticated' || !session?.user?.userId) {
      if (authStatus === 'unauthenticated') {
        setStatus('no-profile');
      }
      return;
    }

    let isMounted = true;
    const checkTalentStatus = async () => {
      try {
        const response = await axiosInstance.get(
          `/talents/user/${session.user.userId}`
        );

        // Only update state if component is still mounted
        if (!isMounted) return;

        const data = response.data;
        setTalentData(data);

        if (!data.isEmailVerified) {
          setStatus('unverified');
        } else if (data.status === 'PENDING') {
          setStatus('pending');
        } else if (data.status === 'APPROVED') {
          setStatus('approved');
        } else if (data.status === 'REJECTED') {
          setStatus('rejected');
        }
      } catch (error) {
        if (!isMounted) return;

        if (isAxiosError(error) && error.response?.status === 404) {
          setStatus('no-profile');
        } else {
          setError(error as Error);
          setStatus('no-profile'); // Default to no profile on error
        }
      }
    };

    checkTalentStatus();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [authStatus, session, setTalentData]);

  // Effect for handling redirection
  useEffect(() => {
    if (redirectPath) {
      router.push(redirectPath);
      // Reset after navigation
      setRedirectPath(null);
    }
  }, [redirectPath, router]);

  // Instead of immediate navigation, calculate the redirect path
  const getRedirectPath = (currentPath: string) => {
    if (status === 'loading') {
      return null;
    }

    if (status === 'unverified' && !currentPath.includes('/join/verify')) {
      return '/join/verify';
    }

    if (status === 'pending' && !currentPath.includes('/join/pending')) {
      return '/join/pending';
    }

    if (status === 'no-profile' && !currentPath.includes('/join')) {
      return '/join';
    }

    if (
      status === 'approved' &&
      (currentPath.includes('/join') ||
        currentPath.includes('/join/verify') ||
        currentPath.includes('/join/pending'))
    ) {
      return '/dashboard';
    }

    return null;
  };

  // Function to trigger a redirect check
  const checkRedirect = (currentPath: string) => {
    const path = getRedirectPath(currentPath);
    if (path) {
      setRedirectPath(path);
      return true;
    }
    return false;
  };

  return {
    status,
    talentData,
    error,
    isLoading: status === 'loading',
    isApproved: status === 'approved',
    isPending: status === 'pending',
    isUnverified: status === 'unverified',
    hasNoProfile: status === 'no-profile',
    checkRedirect,
  };
}
