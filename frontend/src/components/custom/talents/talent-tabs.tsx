import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MediaGallery } from './media-gallery';
import { ServicesList } from './services-list';
import { AvailabilitySchedule } from './availability-schedule';
import { AboutTalent } from './about-talent';
import type { Talent } from '@/types/prismaTypes';

interface TalentTabsProps {
  talent: Talent;
}

export function TalentTabs({ talent }: TalentTabsProps) {
  return (
    <Tabs defaultValue="about" className="mb-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="about">About</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="availability">Availability</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
      </TabsList>

      <TabsContent value="media" className="bg-white rounded-lg shadow-md p-6">
        <MediaGallery media={talent.media || []} />
      </TabsContent>

      <TabsContent
        value="services"
        className="bg-white rounded-lg shadow-md p-6"
      >
        <ServicesList talent={talent} />
      </TabsContent>

      <TabsContent
        value="availability"
        className="bg-white rounded-lg shadow-md p-6"
      >
        <AvailabilitySchedule talent={talent} />
      </TabsContent>

      <TabsContent value="about" className="bg-white rounded-lg shadow-md p-6">
        <AboutTalent talent={talent} />
      </TabsContent>
    </Tabs>
  );
}
