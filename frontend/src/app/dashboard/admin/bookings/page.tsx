"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookingStatus, Role } from "../../../../types/prismaTypes";
import { format } from "date-fns";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBookings } from "@/hooks/useBookings";

export default function AdminBookingsPage() {
  const { data: session } = useSession();
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus | "ALL">(
    "ALL"
  );
  const { bookings, isLoading, updateStatus } = useBookings(
    session?.user?.userId || "",
    (session?.user?.role as Role) || "",
    selectedStatus
  );

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 min-h-screen px-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">All Bookings</h1>
        <Select
          value={selectedStatus}
          onValueChange={(value) =>
            setSelectedStatus(value as BookingStatus | "ALL")
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="ACCEPTED">Accepted</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                  <div className="flex -space-x-2">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white">
                      <Image
                        src={booking.talent.talentProfilePicture}
                        alt={`${booking.talent.firstName} ${booking.talent.lastName}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-white">
                      <Image
                        src={booking.client.profilePicture}
                        alt={booking.client.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">
                      {booking.eventType}
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      {booking.talent.firstName} {booking.talent.lastName} -{" "}
                      {booking.talent.serviceName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Client: {booking.client.name}
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

                <div className="flex space-x-2 mt-4">
                  <Select
                    value={booking.status}
                    onValueChange={(value) =>
                      updateStatus({
                        bookingId: booking.bookingId,
                        newStatus: value as BookingStatus,
                      })
                    }
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACCEPTED">Accepted</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
