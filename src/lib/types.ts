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
  upiId: string;
  upiQr: string; // QR code image URL
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
};

export type PlatformSettings = {
  upiId: string;
  upiQr: string; // QR code image URL
  commissionPercent: number;
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

/** Who the customer paid. */
export const PAYMENT_METHODS = ["upi_admin", "upi_artist", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Customer-side payment: unpaid → claimed (UTR submitted) → verified. */
export type PaymentStatus = "unpaid" | "claimed" | "verified";

/** Second leg (commission to admin, or payout to artist):
 *  na → pending → claimed (UTR submitted) → settled. */
export type SettlementStatus = "na" | "pending" | "claimed" | "settled";

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
  amount: number | null; // final agreed price
  commissionAmount: number | null; // snapshot when amount is set
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentUtr: string;
  settlementStatus: SettlementStatus;
  settlementUtr: string;
  userId: string | null;
  createdAt: string;
};
