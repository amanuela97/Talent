import { Metadata } from "next";
import { notFound } from "next/navigation";
import { TalentProfile } from "@/components/custom/talents/TalentProfile";
import { getTalentByServiceName } from "@/lib/api/talents";

interface TalentProfilePageProps {
  params: Promise<{ serviceName: string }>;
}

// Generate metadata for SEO
export async function generateMetadata(
  props: TalentProfilePageProps
): Promise<Metadata> {
  const { serviceName } = await props.params;

  try {
    const talent = await getTalentByServiceName(serviceName);

    if (!talent) {
      return {
        title: "Talent Not Found",
        description: "The requested talent profile could not be found.",
      };
    }

    return {
      title: `${talent.firstName} ${talent.lastName} - ${talent.serviceName}`,
      description: talent.bio || "talent bio",
      openGraph: {
        title: `${talent.firstName} ${talent.lastName} - ${talent.serviceName}`,
        description: talent.bio || "talent bio",
        images: [talent.talentProfilePicture],
      },
    };
  } catch (error) {
    console.error("Error fetching talent for metadata:", error);
    return {
      title: "Talent Not Found",
      description: "The requested talent profile could not be found.",
    };
  }
}

// Enable ISR with 2 minutes revalidation
export const revalidate = 120;

export default async function TalentProfilePage(props: TalentProfilePageProps) {
  const { serviceName } = await props.params;

  try {
    const talent = await getTalentByServiceName(serviceName);

    if (!talent) {
      notFound();
    }

    return <TalentProfile talent={talent} />;
  } catch (error) {
    console.error("Error fetching talent:", error);
    notFound();
  }
}
