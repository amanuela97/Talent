import { Button } from "@/components/ui/button";
import { TalentProfileProps } from "./TalentProfile";

interface SupportCardProps {
  talent: TalentProfileProps["talent"];
}

export function SupportCard({ talent }: SupportCardProps) {
  return (
    <div className="bg-orange-50 rounded-lg p-6 border border-orange-100">
      <h3 className="text-lg font-medium mb-3">Need Help?</h3>
      <p className="text-gray-600 text-sm mb-4">
        Have questions about booking {talent.firstName} or need assistance? Our
        support team is here to help.
      </p>
      <Button
        variant="outline"
        className="w-full bg-white border-orange-200 text-orange-600 hover:bg-orange-50"
      >
        Contact Support
      </Button>
    </div>
  );
}
