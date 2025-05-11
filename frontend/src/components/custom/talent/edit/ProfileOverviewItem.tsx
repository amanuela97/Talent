import { Check, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface ProfileOverviewItemProps {
  title: string;
  icon: string;
  status: 'success' | 'warning' | 'incomplete';
  statusMessage: string;
  description: string;
}

export default function ProfileOverviewItem({
  title,
  icon,
  status,
  statusMessage,
  description,
}: ProfileOverviewItemProps) {
  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex-shrink-0">
            <Image
              src={icon || '/placeholder.svg'}
              alt={title}
              width={64}
              height={64}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800">{title}</h3>

            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm">
              {status === 'success' && (
                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  {statusMessage}
                </div>
              )}

              {status === 'warning' && (
                <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  {statusMessage}
                </div>
              )}
            </div>
          </div>
        </div>

        <Link
          href={`/edit/${title.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-blue-500 hover:text-blue-700"
        >
          Edit
        </Link>
      </div>

      <p className="text-gray-700 ml-20">{description}</p>
    </div>
  );
}
