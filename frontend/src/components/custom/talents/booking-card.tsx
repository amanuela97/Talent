import { Button } from '@/components/ui/button';
import { Calendar, MessageCircle } from 'lucide-react';
import type { Talent } from '@/types/prismaTypes';

interface BookingCardProps {
  talent: Talent;
}

export function BookingCard({ talent }: BookingCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
      <h3 className="text-xl font-bold mb-4">Book {talent.firstName}</h3>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="font-medium">Hourly Rate</span>
          <span className="text-xl font-bold text-orange-500">
            ${talent.hourlyRate}
          </span>
        </div>
        <div className="h-px bg-gray-200 my-4"></div>
        <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
          <span>Service Fee</span>
          <span>${Math.round((talent.hourlyRate || 0) * 0.1)}</span>
        </div>
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Platform Fee</span>
          <span>${Math.round((talent.hourlyRate || 0) * 0.05)}</span>
        </div>
        <div className="h-px bg-gray-200 my-4"></div>
        <div className="flex justify-between items-center font-medium">
          <span>Total (per hour)</span>
          <span>${Math.round((talent.hourlyRate || 0) * 1.15)}</span>
        </div>
      </div>

      <Button className="w-full mb-3 bg-orange-500 hover:bg-orange-600">
        <Calendar className="h-4 w-4 mr-2" />
        Book Now
      </Button>

      <Button
        variant="outline"
        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Contact
      </Button>
    </div>
  );
}
