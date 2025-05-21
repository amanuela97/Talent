"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookingStatus, Role } from "../../../../types/prismaTypes";
import { format } from "date-fns";
import { useBookings } from "@/hooks/useBookings";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/app/utils/axios";

export default function TalentBookingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<BookingStatus | "ALL">("ALL");
  const router = useRouter();

  const { bookings, isLoading, updateStatus } = useBookings(
    session?.user?.userId || "",
    (session?.user?.role as Role) || "",
    activeTab
  );

  // Fetch conversations for accepted bookings
  const { data: conversations } = useQuery({
    queryKey: ["conversations", session?.user?.userId],
    queryFn: async () => {
      const response = await axiosInstance.get(
        `/conversations?userId=${session?.user?.userId}`
      );
      return response.data;
    },
    enabled: !!session?.user?.userId,
  });

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

  const handleStartConversation = async (clientId: string) => {
    try {
      const response = await axiosInstance.post("/conversations", {
        participantIds: [clientId],
        isGroup: false,
      });
      router.push(`/dashboard/inbox/${response.data.id}`);
    } catch (error) {
      console.error("Failed to start conversation:", error);
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
    <div className="container mx-auto py-8 h-screen px-10">
      <h1 className="text-3xl font-bold mb-8">Booking Inquiries</h1>

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

        <TabsContent value={activeTab} className="">
          <div className="grid gap-4">
            {!bookings?.length || bookings?.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No bookings found</p>
                </CardContent>
              </Card>
            ) : (
              bookings.map((booking) => {
                // Find if there's an existing conversation for this booking
                const existingConversation = conversations?.find(
                  (conv: { bookingId: string }) =>
                    conv.bookingId === booking.bookingId
                );

                return (
                  <Card key={booking.bookingId}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xl font-bold">
                        {booking.eventType}
                      </CardTitle>
                      <Badge className={getStatusColor(booking.status)}>
                        {booking.status}
                      </Badge>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">Client:</span>
                          <span>{booking.client.name}</span>
                        </div>
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
                            onClick={() =>
                              updateStatus({
                                bookingId: booking.bookingId,
                                newStatus: BookingStatus.ACCEPTED,
                              })
                            }
                            className="bg-green-500 hover:bg-green-600"
                          >
                            Accept
                          </Button>
                          <Button
                            onClick={() =>
                              updateStatus({
                                bookingId: booking.bookingId,
                                newStatus: BookingStatus.REJECTED,
                              })
                            }
                            variant="destructive"
                          >
                            Reject
                          </Button>
                        </div>
                      )}

                      {booking.status === "ACCEPTED" && (
                        <div className="flex space-x-2 mt-4">
                          <Button
                            onClick={() =>
                              updateStatus({
                                bookingId: booking.bookingId,
                                newStatus: BookingStatus.COMPLETED,
                              })
                            }
                            className="bg-blue-500 hover:bg-blue-600"
                          >
                            Mark as Completed
                          </Button>
                          {existingConversation ? (
                            <Button
                              onClick={() =>
                                router.push(
                                  `/dashboard/inbox/${existingConversation.id}`
                                )
                              }
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              Continue Conversation
                            </Button>
                          ) : (
                            <Button
                              onClick={() =>
                                handleStartConversation(booking.clientId)
                              }
                              className="bg-purple-500 hover:bg-purple-600"
                            >
                              Start Conversation
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
