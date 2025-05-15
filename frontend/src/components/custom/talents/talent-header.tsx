import Image from 'next/image';
import type { Talent } from '@/types/prismaTypes';

interface TalentHeaderProps {
  talent: Talent;
}

export function TalentHeader({ talent }: TalentHeaderProps) {
  return (
    <div className="h-64 bg-gradient-to-r from-orange-500 to-orange-600 relative">
      <div className="container mx-auto px-6 h-full flex items-end">
        <div className="absolute -bottom-16 flex items-end">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
            <Image
              src={talent.talentProfilePicture || '/placeholder.svg'}
              alt={`${talent.firstName} ${talent.lastName}`}
              fill
              className="object-cover"
            />
          </div>
          <div className="ml-4 mb-4">
            <div className="bg-white px-4 py-2 rounded-lg shadow-md">
              <h1 className="text-3xl font-bold text-gray-900">
                {talent.firstName} {talent.lastName}
              </h1>
              <p className="text-orange-600">{talent.serviceName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
