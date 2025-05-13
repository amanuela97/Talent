// This file exports types from Prisma schema for frontend use
import type { Talent as PrismaTalent } from '@prisma/client';
// Define MediaType enum manually as it is not exported from @prisma/client
export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
}

// Export the Prisma enums

// Define more comprehensive types with relations
export interface Media {
  id: string;
  type: MediaType;
  url: string;
  publicId: string;
  description?: string | null;
  talentId: string;
  createdAt: Date;
}

// Define Talent with included media relation
export interface Talent
  extends Omit<PrismaTalent, 'availability' | 'socialLinks'> {
  // Include media relation
  media: Media[];

  // Convert JSON fields to proper TypeScript types
  availability: Record<string, string[]>;
  socialLinks: Record<string, string>;
}
