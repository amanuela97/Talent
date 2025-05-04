'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
export default function Footer() {
  const [year, setYear] = useState('2025');

  useEffect(() => {
    setYear(new Date().getFullYear().toString());
  }, []);

  return (
    <footer className="py-6 border-t px-7">
      <div className="container flex flex-col sm:flex-row justify-between items-center">
        <p className="text-xs text-gray-500">
          &copy; {year} Talent Booking Platform. All rights reserved.
        </p>
        <div className="flex gap-4 mt-4 sm:mt-0">
          <Link href="#" className="text-xs text-gray-500 hover:underline">
            Terms
          </Link>
          <Link href="#" className="text-xs text-gray-500 hover:underline">
            Privacy
          </Link>
          <Link href="#" className="text-xs text-gray-500 hover:underline">
            Help
          </Link>
        </div>
      </div>
    </footer>
  );
}
