'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react';
import { useSession } from 'next-auth/react';
import { LogoutButton } from '../LogoutButton';

const HomeHeader = () => {
  const { status } = useSession();

  if (status === 'loading') {
    return null;
  }

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          {/* Direct image reference with explicit width and height */}
          <Image
            src="/assets/talent-logo.png"
            alt="Talent Logo"
            width={120}
            height={48}
            priority
          />
        </Link>
        <nav className="hidden md:flex gap-6">
          <Link
            href="/talents"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Find Talent
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            How It Works
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Pricing
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            About Us
          </Link>
        </nav>
        {status === 'authenticated' ? (
          <LogoutButton />
        ) : (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium hover:underline underline-offset-4 hidden md:inline-flex"
            >
              Log In
            </Link>
            <Link href="/register">
              <Button className="cursor-pointer">Sign Up</Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default HomeHeader;
