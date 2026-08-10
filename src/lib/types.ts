export type Style = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
};

export type Artist = {
  id: string;
  userId: string | null;
  name: string;
  slug: string;
  bio: string;
  city: string;
  area: string;
  whatsapp: string;
  experienceYears: number;
  priceMin: number;
  priceMax: number;
  styles: string[]; // style slugs
  profileImage: string;
  portfolioImages: string[];
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
};

export type ArtistInput = Omit<Artist, "id" | "createdAt">;

export const EVENT_TYPES = [
  "Bridal / Dulhan",
  "Engagement / Sagai",
  "Karva Chauth",
  "Teej / Festival",
  "Party / Guest",
  "Baby Shower / Godh Bharai",
  "Other",
] as const;

export const BOOKING_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type Booking = {
  id: string;
  bookingNumber: string;
  artistId: string;
  artistName: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  eventDate: string; // yyyy-mm-dd
  eventType: string;
  notes: string;
  status: BookingStatus;
  userId: string | null;
  createdAt: string;
};
