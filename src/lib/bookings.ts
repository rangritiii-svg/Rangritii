import "server-only";
import { isSupabaseConfigured } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type {
  Booking,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  SettlementStatus,
} from "./types";
import { BOOKING_STATUSES, PAYMENT_METHODS } from "./types";

export type BookingDetails = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  eventDate: string; // yyyy-mm-dd
  eventType: string;
  notes: string;
};

type BookingRow = {
  id: string;
  booking_number: string;
  artist_id: string;
  artist_name: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  event_date: string;
  event_type: string;
  notes: string;
  status: string;
  amount: number | null;
  commission_amount: number | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_utr: string | null;
  settlement_status: string | null;
  settlement_utr: string | null;
  user_id: string | null;
  created_at: string;
};

function mapBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    bookingNumber: r.booking_number,
    artistId: r.artist_id,
    artistName: r.artist_name,
    customerName: r.customer_name,
    phone: r.phone,
    email: r.email ?? "",
    address: r.address ?? "",
    city: r.city ?? "",
    eventDate: r.event_date,
    eventType: r.event_type,
    notes: r.notes ?? "",
    status: (BOOKING_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as BookingStatus)
      : "pending",
    amount: r.amount === null || r.amount === undefined ? null : Number(r.amount),
    commissionAmount:
      r.commission_amount === null || r.commission_amount === undefined
        ? null
        : Number(r.commission_amount),
    paymentMethod: (PAYMENT_METHODS as readonly string[]).includes(r.payment_method ?? "")
      ? (r.payment_method as PaymentMethod)
      : null,
    paymentStatus: (["unpaid", "claimed", "verified"] as const).includes(
      (r.payment_status ?? "unpaid") as PaymentStatus
    )
      ? ((r.payment_status ?? "unpaid") as PaymentStatus)
      : "unpaid",
    paymentUtr: r.payment_utr ?? "",
    settlementStatus: (["na", "pending", "claimed", "settled"] as const).includes(
      (r.settlement_status ?? "na") as SettlementStatus
    )
      ? ((r.settlement_status ?? "na") as SettlementStatus)
      : "na",
    settlementUtr: r.settlement_utr ?? "",
    userId: r.user_id,
    createdAt: r.created_at,
  };
}

export async function createBooking(
  artistId: string,
  details: BookingDetails,
  userId: string | null
): Promise<{ bookingNumber: string; artistName: string }> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const artist = store.artists.find(
      (a) => a.id === artistId && a.isApproved && a.isActive
    );
    if (!artist) throw new Error("This artist is not available for booking right now.");
    const bookingNumber = `RB-${store.bookingSeq++}`;
    store.bookings.unshift({
      id: `b-${Date.now()}`,
      bookingNumber,
      artistId: artist.id,
      artistName: artist.name,
      ...details,
      status: "pending",
      amount: null,
      commissionAmount: null,
      paymentMethod: null,
      paymentStatus: "unpaid",
      paymentUtr: "",
      settlementStatus: "na",
      settlementUtr: "",
      userId,
      createdAt: new Date().toISOString(),
    });
    return { bookingNumber, artistName: artist.name };
  }

  // Supabase mode: SECURITY DEFINER function validates the artist and inserts.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_booking", {
    p_artist_id: artistId,
    p_details: {
      customer_name: details.customerName,
      phone: details.phone,
      email: details.email,
      address: details.address,
      city: details.city,
      event_date: details.eventDate,
      event_type: details.eventType,
      notes: details.notes,
    },
  });
  if (error) throw new Error(`Could not place booking: ${error.message}`);
  const result = data as {
    booking_number: string;
    artist_name: string;
  };
  return {
    bookingNumber: result.booking_number,
    artistName: result.artist_name,
  };
}

/** Admin: all bookings (RLS restricts to admins in Supabase mode). */
export async function getBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoStore().bookings.map((b) => ({ ...b }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

/** Logged-in customer: own bookings. */
export async function getBookingsForUser(userId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoStore()
      .bookings.filter((b) => b.userId === userId)
      .map((b) => ({ ...b }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

/** Bookings received by an artist (for their dashboard in /account). */
export async function getBookingsForArtist(artistId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoStore()
      .bookings.filter((b) => b.artistId === artistId)
      .map((b) => ({ ...b }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    return b ? { ...b } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapBooking(data as BookingRow) : null;
}

/* ── Payments ──────────────────────────────────────────────────────── */

/** Set the final agreed price; snapshots commission and confirms the booking. */
export async function setBookingAmount(
  id: string,
  amount: number,
  commissionPercent: number
): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount.");
  const commission = Math.round((amount * commissionPercent) / 100);

  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    if (!b) throw new Error("Booking not found.");
    if (b.status === "cancelled") throw new Error("You cannot set an amount on a cancelled booking.");
    if (b.paymentStatus === "verified")
      throw new Error("The amount cannot be changed after the payment has been verified.");
    b.amount = amount;
    b.commissionAmount = commission;
    if (b.status === "pending") b.status = "confirmed";
    return;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ amount, commission_amount: commission })
    .eq("id", id)
    .neq("status", "cancelled")
    .neq("payment_status", "verified")
    .select("id, status")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Amount not set — the booking is cancelled or the payment is already verified.");
  if (data.status === "pending") {
    await supabase.from("bookings").update({ status: "confirmed" }).eq("id", id);
  }
}

/** Admin/artist confirms the customer's payment was actually received. */
export async function markPaymentVerified(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    if (!b) throw new Error("Booking not found.");
    if (b.paymentStatus !== "claimed")
      throw new Error("The customer needs to claim the payment before it can be verified.");
    b.paymentStatus = "verified";
    b.settlementStatus = "pending";
    return;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ payment_status: "verified", settlement_status: "pending" })
    .eq("id", id)
    .eq("payment_status", "claimed")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not verify — the payment is not in the claimed state.");
}

/** Artist records that the customer paid in cash at the service. */
export async function recordCashPayment(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    if (!b) throw new Error("Booking not found.");
    if (b.paymentStatus === "verified") throw new Error("Payment already verified.");
    if (b.amount === null) throw new Error("Set the amount first.");
    b.paymentMethod = "cash";
    b.paymentStatus = "verified";
    b.settlementStatus = "pending";
    return;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({
      payment_method: "cash",
      payment_status: "verified",
      settlement_status: "pending",
    })
    .eq("id", id)
    .neq("payment_status", "verified")
    .not("amount", "is", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not record — is the amount set, and is the payment not already verified?");
}

/** Artist submits the UTR of their commission payment to admin. */
export async function submitSettlementUtr(id: string, utr: string): Promise<void> {
  const cleanUtr = utr.trim().slice(0, 40);
  if (cleanUtr.length < 4) throw new Error("Please enter a valid UTR/reference number.");
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    if (!b) throw new Error("Booking not found.");
    if (b.settlementStatus !== "pending" && b.settlementStatus !== "claimed")
      throw new Error("No settlement is due on this booking yet.");
    b.settlementStatus = "claimed";
    b.settlementUtr = cleanUtr;
    return;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .update({ settlement_status: "claimed", settlement_utr: cleanUtr })
    .eq("id", id)
    .in("settlement_status", ["pending", "claimed"])
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not submit — no settlement is due.");
}

/** Admin marks the second leg (commission/payout) as fully settled. */
export async function markSettled(id: string, utr?: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    if (!b) throw new Error("Booking not found.");
    if (b.settlementStatus === "na") throw new Error("Settlement is only possible after the payment is verified.");
    b.settlementStatus = "settled";
    if (utr) b.settlementUtr = utr.trim().slice(0, 40);
    return;
  }
  const supabase = await createClient();
  const patch: Record<string, string> = { settlement_status: "settled" };
  if (utr) patch.settlement_utr = utr.trim().slice(0, 40);
  const { data, error } = await supabase
    .from("bookings")
    .update(patch)
    .eq("id", id)
    .neq("settlement_status", "na")
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Could not settle — verify the payment first.");
}

/* ── Public payment page (no login; booking number + phone required) ── */

export type PaymentInfo = {
  bookingNumber: string;
  artistName: string;
  eventDate: string;
  status: BookingStatus;
  amount: number | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  artistUpi: string;
  artistQr: string;
  adminUpi: string;
  adminQr: string;
  /** Only populated once the booking is confirmed/completed — hidden before that. */
  artistWhatsapp: string;
};

const CONTACT_VISIBLE_STATUSES: readonly BookingStatus[] = ["confirmed", "completed"];

export async function getPaymentInfo(
  bookingNumber: string,
  phone: string
): Promise<PaymentInfo | null> {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  if (cleanPhone.length !== 10) return null;

  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const b = store.bookings.find(
      (b) =>
        b.bookingNumber.toUpperCase() === bookingNumber.trim().toUpperCase() &&
        b.phone.replace(/\D/g, "").slice(-10) === cleanPhone
    );
    if (!b) return null;
    const artist = store.artists.find((a) => a.id === b.artistId);
    return {
      bookingNumber: b.bookingNumber,
      artistName: b.artistName,
      eventDate: b.eventDate,
      status: b.status,
      amount: b.amount,
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      artistUpi: artist?.upiId ?? "",
      artistQr: artist?.upiQr ?? "",
      adminUpi: store.settings.upiId,
      adminQr: store.settings.upiQr,
      artistWhatsapp: CONTACT_VISIBLE_STATUSES.includes(b.status) ? artist?.whatsapp ?? "" : "",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_payment_info", {
    p_booking_number: bookingNumber.trim(),
    p_phone: cleanPhone,
  });
  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as Record<string, unknown>;
  return {
    bookingNumber: String(r.booking_number ?? ""),
    artistName: String(r.artist_name ?? ""),
    eventDate: String(r.event_date ?? ""),
    status: (r.status ?? "pending") as BookingStatus,
    amount: r.amount === null || r.amount === undefined ? null : Number(r.amount),
    paymentMethod: (PAYMENT_METHODS as readonly string[]).includes(String(r.payment_method))
      ? (String(r.payment_method) as PaymentMethod)
      : null,
    paymentStatus: (r.payment_status ?? "unpaid") as PaymentStatus,
    artistUpi: String(r.artist_upi ?? ""),
    artistQr: String(r.artist_qr ?? ""),
    adminUpi: String(r.admin_upi ?? ""),
    adminQr: String(r.admin_qr ?? ""),
    artistWhatsapp: String(r.artist_whatsapp ?? ""),
  };
}

/** Customer: "I have paid" — records method + UTR, admin/artist verifies. */
export async function claimPayment(
  bookingNumber: string,
  phone: string,
  method: "upi_admin" | "upi_artist",
  utr: string
): Promise<void> {
  const cleanPhone = phone.replace(/\D/g, "").slice(-10);
  const cleanUtr = utr.trim().slice(0, 40);
  if (cleanPhone.length !== 10) throw new Error("Please enter a valid phone number.");
  if (cleanUtr.length < 4) throw new Error("Please enter the UTR/transaction reference number.");
  if (method !== "upi_admin" && method !== "upi_artist") throw new Error("Invalid method.");

  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const b = store.bookings.find(
      (b) =>
        b.bookingNumber.toUpperCase() === bookingNumber.trim().toUpperCase() &&
        b.phone.replace(/\D/g, "").slice(-10) === cleanPhone
    );
    if (!b) throw new Error("Booking not found — check the booking number and phone.");
    if (b.paymentStatus === "verified") throw new Error("This payment is already verified.");
    const utrReused = store.bookings.some(
      (other) =>
        other.id !== b.id &&
        other.paymentUtr.trim().toUpperCase() === cleanUtr.toUpperCase() &&
        (other.paymentStatus === "claimed" || other.paymentStatus === "verified")
    );
    if (utrReused) {
      throw new Error(
        "This UTR/reference number is already recorded against another booking. Please check it and try again."
      );
    }
    b.paymentMethod = method;
    b.paymentStatus = "claimed";
    b.paymentUtr = cleanUtr;
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_payment", {
    p_booking_number: bookingNumber.trim(),
    p_phone: cleanPhone,
    p_method: method,
    p_utr: cleanUtr,
  });
  if (error) throw new Error(error.message);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid status.");
  }
  if (!isSupabaseConfigured()) {
    const booking = demoStore().bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found.");
    booking.status = status;
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
