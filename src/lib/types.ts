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
  packages: ArtistPackage[];
  isApproved: boolean;
  isActive: boolean;
  createdAt: string;
};

/** A priced service an artist offers — the customer picks packages + quantity
 *  at booking time, which gives the booking's total before any payment. */
export type ArtistPackage = {
  id: string;
  name: string; // e.g. "Bridal full hands", "Guest — both palms"
  price: number; // ₹ per unit
  unit: "per_person" | "per_event";
};

/** One chosen line on a booking (a snapshot — later price edits don't change it). */
export type BookingItem = {
  packageId: string;
  name: string;
  price: number;
  qty: number;
};

export function itemsTotal(items: BookingItem[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

export type PlatformSettings = {
  upiId: string;
  upiQr: string; // QR code image URL
  commissionPercent: number;
  /** Fixed advance (token) the customer pays before the request reaches the artist. */
  tokenAmount: number;
  /** Hours an artist has to accept/decline before the request auto-expires. */
  responseHours: number;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
  contactHours: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  message: string;
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

/** Booking lifecycle:
 *  awaiting_token → (token verified) → pending → confirmed → completed
 *  The artist only ever sees a booking once it reaches `pending`.
 *  pending → declined (artist said no, or didn't answer in time) → token refunded
 *  any open state → cancelled */
export const BOOKING_STATUSES = [
  "awaiting_token",
  "pending",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABEL: Record<BookingStatus, string> = {
  awaiting_token: "Awaiting token",
  pending: "Waiting for artist",
  confirmed: "Confirmed",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** Token (advance) lifecycle: unpaid → claimed (UTR sent) → verified.
 *  If the booking is declined/expired after a verified token: refund_due → refunded. */
export const TOKEN_STATUSES = ["unpaid", "claimed", "verified", "refund_due", "refunded"] as const;
export type TokenStatus = (typeof TOKEN_STATUSES)[number];

/** Who the customer paid.
 *  `upi_artist` is legacy only — the artist's UPI/QR is never shown to
 *  customers any more (it exists solely so the admin can pay the artist out).
 *  New payments are either `upi_admin` (Rangritii's QR) or `cash` to the artist. */
export const PAYMENT_METHODS = ["upi_admin", "upi_artist", "cash"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** The only options a customer can pick on /pay. */
export const CUSTOMER_PAYMENT_METHODS = ["upi_admin", "cash"] as const;
export type CustomerPaymentMethod = (typeof CUSTOMER_PAYMENT_METHODS)[number];

/** Contact between customer and artist unlocks only once the artist confirms. */
export function contactUnlocked(status: BookingStatus): boolean {
  return status === "confirmed" || status === "completed";
}

/** What is left to pay after the token. */
export function balanceDue(b: Pick<Booking, "amount" | "tokenAmount" | "tokenStatus">): number | null {
  if (b.amount === null) return null;
  const tokenPaid = b.tokenStatus === "verified" ? b.tokenAmount : 0;
  return Math.max(0, b.amount - tokenPaid);
}

/** Net money between admin and artist once the balance is paid.
 *  The admin holds the token (+ the balance if it was paid to Rangritii's UPI);
 *  the artist should end up with amount − commission.
 *  > 0 → admin pays the artist this much; < 0 → artist owes the admin. */
export function netToArtist(b: Booking): number | null {
  if (b.amount === null || b.commissionAmount === null) return null;
  const balance = balanceDue(b) ?? 0;
  const artistGotDirect = b.paymentMethod === "cash" || b.paymentMethod === "upi_artist" ? balance : 0;
  return b.amount - b.commissionAmount - artistGotDirect;
}

/** Customer-side (balance) payment: unpaid → claimed (UTR submitted) → verified. */
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
  items: BookingItem[];
  status: BookingStatus;
  amount: number | null; // total price (from packages; artist may revise)
  tokenAmount: number;
  tokenStatus: TokenStatus;
  tokenUtr: string;
  refundUtr: string;
  sentToArtistAt: string | null; // when the token was verified
  respondedAt: string | null;
  declineReason: string;
  commissionAmount: number | null; // snapshot when amount is set
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  paymentUtr: string;
  settlementStatus: SettlementStatus;
  settlementUtr: string;
  userId: string | null;
  createdAt: string;
};
