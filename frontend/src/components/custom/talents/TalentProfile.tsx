"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { TalentHeader } from "./talent-header";
import { TalentTabs } from "./talent-tabs";
import { SupportCard } from "./support-card";
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
import { Category, Media, Reply, Review, Talent } from "@prisma/client";
import { sendMessage } from "@/lib/api/messages";
import { useQuery } from "@tanstack/react-query";
import { getTalentByServiceName } from "@/lib/api/talents";

export interface TalentProfileProps {
  talent: Talent & {
    media: Media[];
    reviews: (Review & {
      replies: Reply[];
    })[];
    categories: Category[];
  };
}

export function TalentProfile({ talent: initialTalent }: TalentProfileProps) {
  const params = useParams();
  const serviceName = params.serviceName as string;

  // Use React Query to keep talent data in sync
  const { data: talent } = useQuery({
    queryKey: ["talent", serviceName],
    queryFn: () => getTalentByServiceName(serviceName),
    initialData: initialTalent,
    staleTime: 1000 * 60 * 5, // Consider data stale after 5 minutes
  });

  const { data } = useSession();
  const router = useRouter();
  const [messageOpen, setMessageOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messageSending, setMessageSending] = useState(false);

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      setMessageSending(true);
      await sendMessage(talent.talentId, message);
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
      talentId: talent.talentId,
      serviceName: talent.serviceName,
      services: JSON.stringify(talent.services),
    }).toString();
    router.push(`/talents/${talent.serviceName}/book?${query}`);
  };

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
            {talent.talentId !== data?.user.userId && (
              <Button
                onClick={handleBookRequest}
                className="w-full cursor-pointer"
              >
                Book Now
              </Button>
            )}

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
