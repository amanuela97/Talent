import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

type Props = {
  route: string;
  page: string;
};

export const BackButton = ({ route, page }: Props) => {
  return (
    <div className="container flex justify-start py-7 pl-7 overflow-x-hidden">
      <Link
        href={route}
        className="inline-flex items-center font-bold text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-2 h-4 w-4 font-bold" />
        Back to {page}
      </Link>
    </div>
  );
};
