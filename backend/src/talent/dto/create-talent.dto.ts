import { TalentStatus } from '@prisma/client';

export class CreateTalentDto {
  firstName: string;
  lastName: string;
  generalCategory: string;
  specificCategory: string;
  serviceName: string;
  address: string;
  phoneNumber: string;
  talentProfilePicture?: string; // URL will be stored after upload
  status?: TalentStatus;
  isEmailVerified?: boolean;
  verificationToken?: string;
  languagesSpoken?: string[]; // Made optional
  bio?: string; // Made optional
  services?: string[]; // Made optional
  hourlyRate?: number; // Made optional
  city?: string;
  availability?: Record<string, any>; // Made optional
  isOnline?: boolean;
  isPublic?: boolean; // Added for public/private profile control
  socialLinks?: Record<string, any>;
  mediasToRemove?: string[];
}
