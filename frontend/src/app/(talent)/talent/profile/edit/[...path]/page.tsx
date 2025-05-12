'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Loader from '@/components/custom/Loader';

export default function CatchAllProfileEditPage() {
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Get the path segments from params
    const pathSegments = params.path;
    const path = Array.isArray(pathSegments) ? pathSegments[0] : '';

    // Check if the path is one of the valid sections
    const validSections = [
      'overview',
      'general',
      'photos',
      'videos',
      'audio',
      'details',
      'calendar',
    ];

    // No matter what path is provided, redirect to the main edit page
    // If it's a valid section, we'll pass it in the URL to allow the main page to set the active section
    if (path && validSections.includes(path)) {
      router.push(`/talent/profile/edit?section=${path}`);
    } else {
      // If not a valid section, just redirect to the main edit page
      router.push('/talent/profile/edit');
    }
  }, [params, router]);

  // Show a loader while redirecting
  return <Loader />;
}
