// This file exports types from Prisma schema for frontend use
import { Review, User } from "@prisma/client";

export interface Booking {
  bookingId: string;
  clientId: string;
  talentId: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  location: string;
  status: BookingStatus;
  talent: {
    firstName: string;
    lastName: string;
    serviceName: string;
    talentProfilePicture: string;
  };
  client: {
    name: string;
    email: string;
    profilePicture: string;
  };
  duration: number;
  guestCount: number;
  budgetAmount: number;
}

export enum Role {
  ADMIN = "ADMIN",
  TALENT = "TALENT",
  CUSTOMER = "CUSTOMER",
}

export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
}

export interface ReviewType extends Review {
  user: Partial<User>;
}

// Define MediaType enum manually as it is not exported from @prisma/client
export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  AUDIO = "AUDIO",
}

// Define Category types
export interface Category {
  id: string;
  name: string;
  type: "GENERAL" | "SPECIFIC";
  parentId?: string | null;
  status: "ACTIVE" | "PENDING" | "REJECTED";
}

export interface TalentCategory {
  id: string;
  talentId: string;
  categoryId: string;
  assignedAt: Date;
  category: Category;
}

// Export the Prisma enums

// Define more comprehensive types with relations
export interface Media {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
  publicId?: string;
  description?: string | null;
  talentId?: string;
  createdAt?: Date;
}

export interface Talent {
  talentId: string;
  firstName: string;
  lastName: string;
  email: string;
  talentProfilePicture: string;
  // Deprecated fields - will be removed after full transition to categories
  generalCategory?: string;
  specificCategory?: string;
  // New field for categories - make optional with default empty array
  categories?: TalentCategory[];
  serviceName: string;
  address: string;
  phoneNumber: string;
  bio: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isEmailVerified: boolean;
  verificationToken: string;
  services: string[];
  hourlyRate: number;
  city: string;
  availability: Record<string, string[]>;
  isOnline: boolean;
  isPublic: boolean;
  languagesSpoken: string[];
  rating: number;
  socialLinks: Record<string, string>;
  media: Media[];
  createdAt: string;
  updatedAt: string;
  reviews?: ReviewType[];
}
