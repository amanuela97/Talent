"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingStatus } from "../../../../types/prismaTypes";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import axiosInstance from "@/app/utils/axios";
import { isAxiosError } from "axios";

interface Booking {
  bookingId: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  location: string;
  status: BookingStatus;
  talent: {
    firstName: string;
    lastName: string;
    serviceName: string;
    talentProfilePicture: string;
  };
  duration: number;
  guestCount: number;
  budgetAmount: number;
}

export default function CustomerBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BookingStatus | "ALL">("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axiosInstance.get(
          `/bookings/customer/${session?.user?.userId}${
            activeTab !== "ALL" ? `?status=${activeTab}` : ""
          }`
        );

        if (response.data) {
          setBookings(response.data?.bookings);
        }
      } catch (error) {
        if (isAxiosError(error)) {
          toast.error(
            error.response?.data?.message || "Failed to load bookings"
          );
        } else {
          toast.error("Failed to load bookings");
        }
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.userId) {
      fetchBookings();
    }
  }, [session?.user?.userId, activeTab]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await axiosInstance.patch(`/bookings/${bookingId}/status`, {
        status: "CANCELLED",
      });

      // Update local state
      setBookings((prevBookings) =>
        prevBookings.map((booking) =>
          booking.bookingId === bookingId
            ? { ...booking, status: BookingStatus.CANCELLED }
            : booking
        )
      );

      toast.success("Booking cancelled successfully");
    } catch (error) {
      if (isAxiosError(error)) {
        toast.error(
          error.response?.data?.message || "Failed to cancel booking"
        );
      } else {
        toast.error("Failed to cancel booking");
      }
      console.error("Error cancelling booking:", error);
    }
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-500";
      case "ACCEPTED":
        return "bg-green-500";
      case "REJECTED":
        return "bg-red-500";
      case "CANCELLED":
        return "bg-gray-500";
      case "COMPLETED":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

      <Tabs
        defaultValue="ALL"
        onValueChange={(value) => setActiveTab(value as BookingStatus | "ALL")}
      >
        <TabsList className="mb-4">
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="ACCEPTED">Accepted</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="grid gap-4">
            {!bookings?.length || bookings?.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No bookings found</p>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.bookingId}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center space-x-4">
                      <div className="relative h-12 w-12 rounded-full overflow-hidden">
                        <Image
                          src={booking.talent.talentProfilePicture}
                          alt={`${booking.talent.firstName} ${booking.talent.lastName}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">
                          {booking.eventType}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {booking.talent.firstName} {booking.talent.lastName} -{" "}
                          {booking.talent.serviceName}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Date:</span>
                        <span>
                          {format(new Date(booking.eventDate), "PPP")} at{" "}
                          {booking.eventTime}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Location:</span>
                        <span>{booking.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Duration:</span>
                        <span>{booking.duration} hours</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Guest Count:</span>
                        <span>{booking.guestCount}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold">Budget:</span>
                        <span>${booking.budgetAmount}</span>
                      </div>
                    </div>

                    {booking.status === "PENDING" && (
                      <div className="flex space-x-2 mt-4">
                        <Button
                          onClick={() => handleCancelBooking(booking.bookingId)}
                          variant="destructive"
                        >
                          Cancel Booking
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
