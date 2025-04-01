export type Role = 'TALENT' | 'CUSTOMER' | 'ADMIN';

export type User = {
  userId: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  talent?: Talent;
  customer?: Customer;
  admin?: Admin;
  reviews: Review[];
  bookings: EventBooking[];
};

export type Talent = {
  talentId: string;
  user: User;
  bio: string;
  services: string[];
  hourlyRate: number;
  location: string;
  availability: { date: string; timeSlots: string[] }[];
  reviews: Review[];
  rating: number;
  socialLinks?: { platform: string; url: string }[];
  createdAt: Date;
  updatedAt: Date;
  favoriteByCustomers: Customer[];
};

export type Customer = {
  customerId: string;
  user: User;
  phoneNumber?: string;
  eventHistory: EventBooking[];
  createdAt: Date;
  updatedAt: Date;
  favoriteTalents: Talent[];
};

export type Admin = {
  adminId: string;
  user: User;
  permissions: { manageUsers: boolean; manageBookings: boolean };
  createdAt: Date;
  updatedAt: Date;
};

export type Review = {
  reviewId: string;
  userRevieweId: string;
  talentReviewId: string;
  rating: number;
  comment: string;
  createdAt: Date;
  replies: Reply[];
  user: User;
  talent: Talent;
};

export type Reply = {
  replyId: string;
  comment: string;
  createdAt: Date;
  review: Review;
  reviewReplyId: string;
};

export type EventBooking = {
  bookingId: string;
  userBookingId: string;
  customerBookingId: string;
  date: Date;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
  user: User;
  customer: Customer;
};
