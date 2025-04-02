import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  User,
  Talent,
  Customer,
  Admin,
  Review,
  Reply,
  EventBooking,
} from '../../../../types'; // Adjust path to where your types are stored

type SafeUser = Omit<User, 'passwordHash'>;

// Define Zustand Store Type
type AppState = {
  user: SafeUser | null;
  talents: Talent[];
  customers: Customer[];
  admins: Admin[];
  reviews: Review[];
  replies: Reply[];
  bookings: EventBooking[];

  // Actions
  setUser: (user: SafeUser) => void;
  clearUser: () => void;
  addTalent: (talent: Talent) => void;
  updateTalent: (talent: Talent) => void;
  addCustomer: (customer: Customer) => void;
  updateCustomer: (customer: Customer) => void;
  addAdmin: (admin: Admin) => void;
  addReview: (review: Review) => void;
  addReply: (reply: Reply) => void;
  addBooking: (booking: EventBooking) => void;
  updateBookingStatus: (
    bookingId: string,
    status: 'pending' | 'confirmed' | 'cancelled'
  ) => void;
};

// Zustand Store
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      talents: [],
      customers: [],
      admins: [],
      reviews: [],
      replies: [],
      bookings: [],

      // User actions
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      // Talent actions
      addTalent: (talent) =>
        set((state) => ({ talents: [...state.talents, talent] })),
      updateTalent: (talent) =>
        set((state) => ({
          talents: state.talents.map((t) =>
            t.talentId === talent.talentId ? talent : t
          ),
        })),

      // Customer actions
      addCustomer: (customer) =>
        set((state) => ({ customers: [...state.customers, customer] })),
      updateCustomer: (customer) =>
        set((state) => ({
          customers: state.customers.map((c) =>
            c.customerId === customer.customerId ? customer : c
          ),
        })),

      // Admin actions
      addAdmin: (admin) =>
        set((state) => ({ admins: [...state.admins, admin] })),

      // Review actions
      addReview: (review) =>
        set((state) => ({ reviews: [...state.reviews, review] })),

      // Reply actions
      addReply: (reply) =>
        set((state) => ({ replies: [...state.replies, reply] })),

      // Booking actions
      addBooking: (booking) =>
        set((state) => ({ bookings: [...state.bookings, booking] })),
      updateBookingStatus: (bookingId, status) =>
        set((state) => ({
          bookings: state.bookings.map((b) =>
            b.bookingId === bookingId ? { ...b, status } : b
          ),
        })),
    }),
    {
      name: 'app-storage', // Key for localStorage
    }
  )
);
