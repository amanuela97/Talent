import { TalentStatus } from '@prisma/client';

export class CreateTalentDto {
  firsName: string;
  lastName: string;
  generalCategory: string;
  specificCategory: string;
  ServiceName: string;
  address: string;
  phoneNumber: string;
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
  socialLinks?: Record<string, any>;
  mediasToRemove?: string[];
}
