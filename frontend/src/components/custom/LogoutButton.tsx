import React from 'react';
import Link from 'next/link';
import { handleSignOut } from '@/app/utils/helper';
import { LogOut } from 'lucide-react';
import { useAppStore } from '@/app/store/store';

export const LogoutButton = () => {
  const clearUser = useAppStore((state) => state.clearUser);

  const signOut = async () => {
    handleSignOut();
    clearUser();
  };
  return (
    <Link
      href="#"
      onClick={() => signOut()}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-white bg-black hover:text-gray-400"
    >
      <LogOut className="h-5 w-5" />
      <span className="text-sm font-medium">Logout</span>
    </Link>
  );
};
