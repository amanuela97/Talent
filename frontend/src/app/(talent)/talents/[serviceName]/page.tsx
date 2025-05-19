"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { TalentHeader } from "@/components/custom/talents/talent-header";
import { TalentTabs } from "@/components/custom/talents/talent-tabs";
import { SupportCard } from "@/components/custom/talents/support-card";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  useEffect(() => {
    async function fetchTalent() {
      try {
        setLoading(true);
        // Convert underscore to spaces to match backend format
        const formattedServiceName = serviceName.replace(/_/g, " ");

        console.log(formattedServiceName);
        const response = await axiosInstance.get(
          `/talents/service/${formattedServiceName}`
        );

        if (response.data) {
          setTalent(response.data);
        } else {
          setError("Talent not found");
        }
      } catch (err) {
        setError("Failed to load talent information");
        console.error("Error fetching talent:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTalent();
  }, [serviceName]);

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    if (!talent) {
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
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setMessageSending(false);
    }
  };

  const handleBookRequest = () => {
    const query = new URLSearchParams({
      talentId: talent?.talentId || "",
      serviceName: serviceName,
      services: JSON.stringify(talent?.services) || "",
    }).toString();
    router.push(`/talents/${serviceName}/book?${query}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-32 w-full mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Skeleton className="h-64 w-full" />
          </div>
          <div>
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !talent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            {error || "Talent not found"}
          </h1>
          <p className="text-gray-600">
            We couldn&apos;t find the talent you&apos;re looking for.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <TalentHeader talent={talent} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 px-6 pt-24 pb-12">
        <div className="md:col-span-2">
          <TalentTabs talent={talent} />
        </div>
        <div>
          <SupportCard talent={talent} />
          <div className="mt-4 space-y-4">
            <Button
              onClick={handleBookRequest}
              className="w-full cursor-pointer"
            >
              Book Now
            </Button>

            <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleMessageSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      Message {talent.firstName} {talent.lastName}
                    </DialogTitle>
                    <DialogDescription>
                      Send a message to inquire about availability or ask any
                      questions.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
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
                    <Button type="submit" disabled={messageSending}>
                      {messageSending ? "Sending..." : "Send Message"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </div>
  );
}
