"use client";

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { Role } from "@/types/prismaTypes";

export default function BookingConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const getDashboardPath = () => {
    const role = session?.user?.role as Role;
    switch (role) {
      case Role.ADMIN:
        return "/dashboard/admin/bookings";
      case Role.TALENT:
        return "/dashboard/talent/bookings";
      case Role.CUSTOMER:
        return "/dashboard/customer/bookings";
      default:
        return "/dashboard/customer/bookings";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold mb-4">
            Booking Request Submitted!
          </h1>

          <p className="text-gray-600 mb-8">
            Thank you for your booking request. The talent will review your
            request and get back to you soon.
          </p>

          <div className="space-y-4">
            <Button
              onClick={() => router.push(`/talents/${params.serviceName}`)}
              className="w-full"
            >
              Return to Talent Profile
            </Button>

            <Button
              onClick={() => router.push(getDashboardPath())}
              variant="outline"
              className="w-full"
            >
              Go to {session?.user?.role?.toLowerCase() || "Your"} Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
