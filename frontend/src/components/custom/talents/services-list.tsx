import { Badge } from '@/components/ui/badge';
import type { Talent } from '@/types/prismaTypes';

interface ServicesListProps {
  talent: Talent;
}

export function ServicesList({ talent }: ServicesListProps) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Services Offered</h3>
      <div className="flex flex-col">
        {talent.services.map((service, index) => (
          <div
            key={index}
            className="flex items-center p-0 bg-orange-50 rounded-lg"
          >
            <div className="h-2 w-2 rounded-full bg-orange-500 mr-3"></div>
            <span>{service}</span>
          </div>
        ))}
      </div>
      {talent.languagesSpoken && talent.languagesSpoken.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Languages</h4>
          <div className="flex gap-2">
            {talent.languagesSpoken.map((language, index) => (
              <Badge
                key={index}
                variant="outline"
                className="border-orange-200"
              >
                {language}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
