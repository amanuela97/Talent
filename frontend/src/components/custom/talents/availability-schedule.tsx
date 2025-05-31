import { Button } from "@/components/ui/button";
import { Calendar, Clock } from "lucide-react";
import { TalentProfileProps } from "./TalentProfile";

interface AvailabilityScheduleProps {
  talent: TalentProfileProps["talent"];
}

export function AvailabilitySchedule({ talent }: AvailabilityScheduleProps) {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Weekly Availability</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(talent.availability || {}).map(([day, times]) => (
          <div key={day} className="flex items-start p-3 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 mr-3 text-orange-500 mt-0.5" />
            <div>
              <div className="font-medium capitalize">{day}</div>
              <div className="text-sm text-gray-600">
                {Array.isArray(times) ? times.join(", ") : times}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Calendar className="h-4 w-4 mr-2" />
          Check Calendar
        </Button>
      </div>
    </div>
  );
}
