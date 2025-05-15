"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TalentHeader } from "@/components/custom/talents/talent-header";
import { TalentTabs } from "@/components/custom/talents/talent-tabs";
import { SupportCard } from "@/components/custom/talents/support-card";
import { Button } from "@/components/ui/button";
import { Calendar, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axiosInstance from "@/app/utils/axios";
import type { Talent } from "@/types/prismaTypes";

export default function TalentProfilePage({
  params,
}: {
  params: Promise<{ serviceName: string }>;
}) {
  const { serviceName } = use(params);
  const router = useRouter();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking modal states
  const [bookingOpen, setBookingOpen] = useState(false);
  const [eventDate, setEventDate] = useState<Date | undefined>(undefined);
  const [eventType, setEventType] = useState("");
  const [duration, setDuration] = useState("1");
  const [location, setLocation] = useState("");
  const [comments, setComments] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  // Message modal states
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  // Fetch talent data
  useEffect(() => {
    const fetchTalent = async () => {
      try {
        setLoading(true);
        // Convert underscore to spaces to match backend format
        const formattedServiceName = serviceName.replace(/_/g, " ");

        const response = await axiosInstance.get(
          `/talents/service/${formattedServiceName}`
        );

        if (response.data) {
          setTalent(response.data);
        } else {
          setError("Talent not found");
        }
      } catch (error) {
        console.error("Error fetching talent profile:", error);
        setError("Failed to load talent profile. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, [serviceName]);

  // Handle booking submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventDate || !eventType || !location) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!talent) {
      toast.error("Talent information is missing");
      return;
    }

    try {
      setBookingLoading(true);

      // Submit booking request to backend
      await axiosInstance.post("/bookings", {
        talentId: talent.talentId,
        eventDate: eventDate.toISOString(),
        eventType,
        duration: parseInt(duration, 10),
        location,
        comments,
      });

      // Close modal and reset form
      setBookingOpen(false);
      resetBookingForm();

      toast.success("Booking request sent successfully!");
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Handle message submission
  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!talent) {
      toast.error("Talent information is missing");
      return;
    }

    try {
      setMessageSending(true);

      // Submit message to backend
      await axiosInstance.post("/messages", {
        talentId: talent.talentId,
        message,
      });

      // Close modal and reset form
      setMessageOpen(false);
      setMessage("");

      toast.success("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setMessageSending(false);
    }
  };

  // Reset booking form
  const resetBookingForm = () => {
    setEventDate(undefined);
    setEventType("");
    setDuration("1");
    setLocation("");
    setComments("");
  };

  // Show loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header skeleton */}
        <div className="h-64 bg-gradient-to-r from-orange-300 to-orange-400 relative">
          <div className="container mx-auto px-4 h-full flex items-end">
            <div className="absolute -bottom-16 flex items-end">
              <Skeleton className="w-32 h-32 rounded-full border-4 border-white" />
              <div className="ml-4 mb-4">
                <Skeleton className="w-60 h-14 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Main content skeleton */}
        <div className="container mx-auto px-6 pt-24 pb-12">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
              <Skeleton className="h-12 w-full mb-4" />
              <Skeleton className="h-[500px] w-full rounded-lg" />
            </div>
            <div className="lg:w-1/3">
              <Skeleton className="h-[300px] w-full rounded-lg mb-6" />
              <Skeleton className="h-[200px] w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error message
  if (error || !talent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Talent Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            {error ||
              "The talent you are looking for does not exist or has been removed."}
          </p>
          <Button
            onClick={() => router.push("/talents")}
            className="bg-orange-500 hover:bg-orange-600"
          >
            Browse All Talents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with cover image */}
      <TalentHeader talent={talent} />

      {/* Main content */}
      <div className="container mx-auto px-6 pt-24 pb-12">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Profile info */}
          <div className="lg:w-2/3">
            <TalentTabs talent={talent} />
          </div>

          {/* Right column - Booking and contact */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4">
                Book {talent.firstName}
              </h3>
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

              <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full mb-3 bg-orange-500 hover:bg-orange-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleBookingSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        Book {talent.firstName} {talent.lastName}
                      </DialogTitle>
                      <DialogDescription>
                        Fill out the form below to request a booking. You will
                        only be charged if the talent accepts your request.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="event-date">Event Date*</Label>
                        <DatePicker
                          date={eventDate}
                          onSelect={setEventDate}
                          disabled={(date) => date < new Date()}
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="event-type">Event Type*</Label>
                        <Select value={eventType} onValueChange={setEventType}>
                          <SelectTrigger id="event-type">
                            <SelectValue placeholder="Select event type" />
                          </SelectTrigger>
                          <SelectContent>
                            {talent.services.map((service) => (
                              <SelectItem key={service} value={service}>
                                {service}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="duration">Duration (hours)*</Label>
                          <Select value={duration} onValueChange={setDuration}>
                            <SelectTrigger id="duration">
                              <SelectValue placeholder="Select hours" />
                            </SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((hour) => (
                                <SelectItem key={hour} value={hour.toString()}>
                                  {hour} {hour === 1 ? "hour" : "hours"}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="estimated-cost">Estimated Cost</Label>
                          <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm mt-1 flex items-center">
                            $
                            {Math.round(
                              (talent.hourlyRate || 0) *
                                1.15 *
                                parseInt(duration, 10)
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="location">Location*</Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter the event location"
                        />
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Label htmlFor="comments">Additional Details</Label>
                        <Textarea
                          id="comments"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Provide any additional details or special requirements"
                          className="min-h-[100px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBookingOpen(false)}
                        disabled={bookingLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={bookingLoading}
                      >
                        {bookingLoading ? "Submitting..." : "Submit Request"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <form onSubmit={handleMessageSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        Message {talent.firstName} {talent.lastName}
                      </DialogTitle>
                      <DialogDescription>
                        Send a message to ask questions or discuss your event
                        needs.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="min-h-[150px]"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setMessageOpen(false)}
                        disabled={messageSending}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600"
                        disabled={messageSending || !message.trim()}
                      >
                        {messageSending ? "Sending..." : "Send Message"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <SupportCard talent={talent} />
          </div>
        </div>
      </div>
    </div>
  );
}
