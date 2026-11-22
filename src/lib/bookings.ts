import "server-only";
import { isSupabaseConfigured } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type {
  Booking,
  BookingItem,
  BookingStatus,
  CustomerPaymentMethod,
  PaymentMethod,
  PaymentStatus,
  SettlementStatus,
  TokenStatus,
} from "./types";
import {
  BOOKING_STATUSES,
  CUSTOMER_PAYMENT_METHODS,
  PAYMENT_METHODS,
  TOKEN_STATUSES,
  balanceDue,
  contactUnlocked,
  itemsTotal,
  netToArtist,
} from "./types";

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

/** What the customer picked on the booking form (prices are looked up server-side). */
export type ItemChoice = { packageId: string; qty: number };

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
  items: unknown;
  status: string;
  amount: number | null;
  commission_amount: number | null;
  token_amount: number | null;
  token_status: string | null;
  token_utr: string | null;
  refund_utr: string | null;
  sent_to_artist_at: string | null;
  responded_at: string | null;
  decline_reason: string | null;
  payment_method: string | null;
  payment_status: string | null;
  payment_utr: string | null;
  settlement_status: string | null;
  settlement_utr: string | null;
  user_id: string | null;
  created_at: string;
};

function oneOf<T extends string>(list: readonly T[], value: unknown, fallback: T): T {
  return (list as readonly string[]).includes(String(value)) ? (value as T) : fallback;
}

function num(v: unknown): number | null {
  return v === null || v === undefined ? null : Number(v);
}

export function parseItems(raw: unknown): BookingItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r) => {
    const o = (r ?? {}) as Record<string, unknown>;
    return {
      packageId: String(o.package_id ?? o.packageId ?? ""),
      name: String(o.name ?? ""),
      price: Number(o.price ?? 0),
      qty: Number(o.qty ?? 0),
    };
  });
}

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
    items: parseItems(r.items),
    status: oneOf(BOOKING_STATUSES, r.status, "pending"),
    amount: num(r.amount),
    commissionAmount: num(r.commission_amount),
    tokenAmount: Number(r.token_amount ?? 0),
    tokenStatus: oneOf(TOKEN_STATUSES, r.token_status ?? "verified", "verified"),
    tokenUtr: r.token_utr ?? "",
    refundUtr: r.refund_utr ?? "",
    sentToArtistAt: r.sent_to_artist_at,
    respondedAt: r.responded_at,
    declineReason: r.decline_reason ?? "",
    paymentMethod: (PAYMENT_METHODS as readonly string[]).includes(r.payment_method ?? "")
      ? (r.payment_method as PaymentMethod)
      : null,
    paymentStatus: oneOf(["unpaid", "claimed", "verified"] as const, r.payment_status ?? "unpaid", "unpaid"),
    paymentUtr: r.payment_utr ?? "",
    settlementStatus: oneOf(
      ["na", "pending", "claimed", "settled"] as const,
      r.settlement_status ?? "na",
      "na"
    ),
    settlementUtr: r.settlement_utr ?? "",
    userId: r.user_id,
    createdAt: r.created_at,
  };
}

const clean = (s: string, n = 40) => s.trim().slice(0, n);

/** Demo mode: same rule as utr_in_use() in SQL — one UTR, one payment. */
function demoUtrInUse(utr: string, exceptId: string): boolean {
  const u = utr.trim().toUpperCase();
  return demoStore().bookings.some(
    (b) =>
      b.id !== exceptId &&
      ((b.tokenUtr.toUpperCase() === u && b.tokenStatus !== "unpaid") ||
        (b.paymentUtr.toUpperCase() === u && b.paymentStatus !== "unpaid"))
  );
}
const UTR_TAKEN = "This UTR is already recorded against another booking — please check it.";
const phone10 = (p: string) => p.replace(/\D/g, "").slice(-10);

/* ── Auto-expiry: requests the artist never answered ─────────────────── */

/** Requests still `pending` after the response window are declined and the token
 *  is marked for refund. Idempotent — called before bookings are read. */
export async function expireStaleBookings(): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const hours = store.settings.responseHours ?? 24;
    const cutoff = Date.now() - hours * 3600 * 1000;
    for (const b of store.bookings) {
      if (b.status === "pending" && b.sentToArtistAt && new Date(b.sentToArtistAt).getTime() < cutoff) {
        b.status = "declined";
        b.declineReason = `The artist did not respond within ${hours} hours`;
        b.respondedAt = new Date().toISOString();
        if (b.tokenStatus === "verified" && b.tokenAmount > 0) b.tokenStatus = "refund_due";
      }
    }
    return;
  }
  const supabase = await createClient();
  await supabase.rpc("expire_stale_bookings");
}

/* ── Create ──────────────────────────────────────────────────────────── */

export async function createBooking(
  artistId: string,
  details: BookingDetails,
  choices: ItemChoice[],
  userId: string | null
): Promise<{ bookingNumber: string; artistName: string; total: number; token: number }> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const artist = store.artists.find((a) => a.id === artistId && a.isApproved && a.isActive);
    if (!artist) throw new Error("This artist is not available for booking right now.");

    const items: BookingItem[] = [];
    for (const c of choices) {
      const qty = Math.max(0, Math.min(50, Math.floor(c.qty)));
      if (!qty) continue;
      const pkg = artist.packages.find((p) => p.id === c.packageId);
      if (!pkg) throw new Error("One of the chosen packages is no longer offered — please refresh.");
      items.push({ packageId: pkg.id, name: pkg.name, price: pkg.price, qty });
    }
    if (artist.packages.length > 0 && items.length === 0) {
      throw new Error("Please choose at least one package.");
    }
    const total = itemsTotal(items);
    const token = total > 0 ? Math.min(store.settings.tokenAmount, total) : store.settings.tokenAmount;
    const bookingNumber = `RB-${store.bookingSeq++}`;
    store.bookings.unshift({
      id: `b-${Date.now()}`,
      bookingNumber,
      artistId: artist.id,
      artistName: artist.name,
      ...details,
      items,
      status: token > 0 ? "awaiting_token" : "pending",
      amount: total || null,
      commissionAmount: total ? Math.round((total * store.settings.commissionPercent) / 100) : null,
      tokenAmount: token,
      tokenStatus: token > 0 ? "unpaid" : "verified",
      tokenUtr: "",
      refundUtr: "",
      sentToArtistAt: token > 0 ? null : new Date().toISOString(),
      respondedAt: null,
      declineReason: "",
      paymentMethod: null,
      paymentStatus: "unpaid",
      paymentUtr: "",
      settlementStatus: "na",
      settlementUtr: "",
      userId,
      createdAt: new Date().toISOString(),
    });
    return { bookingNumber, artistName: artist.name, total, token };
  }

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
    p_items: choices.map((c) => ({ package_id: c.packageId, qty: c.qty })),
  });
  if (error) throw new Error(`Could not place booking: ${error.message}`);
  const r = data as { booking_number: string; artist_name: string; total: number; token: number };
  return {
    bookingNumber: r.booking_number,
    artistName: r.artist_name,
    total: Number(r.total ?? 0),
    token: Number(r.token ?? 0),
  };
}

/* ── Read ────────────────────────────────────────────────────────────── */

async function selectBookings(filter?: { col: string; val: string }): Promise<Booking[]> {
  const supabase = await createClient();
  let req = supabase.from("bookings").select("*");
  if (filter) req = req.eq(filter.col, filter.val);
  const { data, error } = await req.order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

/** Admin: all bookings (RLS restricts to admins in Supabase mode). */
export async function getBookings(): Promise<Booking[]> {
  await expireStaleBookings();
  if (!isSupabaseConfigured()) return demoStore().bookings.map((b) => ({ ...b }));
  return selectBookings();
}

/** Logged-in customer: own bookings. */
export async function getBookingsForUser(userId: string): Promise<Booking[]> {
  await expireStaleBookings();
  if (!isSupabaseConfigured()) {
    return demoStore()
      .bookings.filter((b) => b.userId === userId)
      .map((b) => ({ ...b }));
  }
  return selectBookings({ col: "user_id", val: userId });
}

/** Requests an artist can see: only ones actually sent to her (token verified),
 *  with the customer's phone/email/address hidden until she accepts. */
export async function getBookingsForArtist(artistId: string): Promise<Booking[]> {
  await expireStaleBookings();
  if (!isSupabaseConfigured()) {
    return demoStore()
      .bookings.filter((b) => b.artistId === artistId && b.sentToArtistAt)
      .map((b) =>
        contactUnlocked(b.status) ? { ...b } : { ...b, phone: "", email: "", address: "" }
      );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("artist_bookings");
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return ((data ?? []) as BookingRow[]).map(mapBooking).filter((b) => b.artistId === artistId);
}

/** Statuses an admin may move a booking to by hand. Re-opening a closed booking
 *  isn't allowed (it would re-run expiry / refunds); make a new booking instead. */
export const ADMIN_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  awaiting_token: ["cancelled"],
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  declined: [],
  cancelled: [],
};

export async function getBookingById(id: string): Promise<Booking | null> {
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((b) => b.id === id);
    return b ? { ...b } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapBooking(data as BookingRow) : null;
}

/** Artist WhatsApp numbers for the logged-in customer's confirmed bookings. */
export async function getMyBookingContacts(userId: string): Promise<Map<string, string>> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const ids = new Set(
      store.bookings.filter((b) => b.userId === userId && contactUnlocked(b.status)).map((b) => b.artistId)
    );
    return new Map(store.artists.filter((a) => ids.has(a.id)).map((a) => [a.id, a.whatsapp]));
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_booking_contacts");
  if (error || !Array.isArray(data)) return new Map();
  return new Map((data as { artist_id: string; whatsapp: string }[]).map((r) => [r.artist_id, r.whatsapp]));
}

/* ── Admin-side mutations (RLS: admin only) ──────────────────────────── */

async function adminPatch(id: string, patch: Record<string, unknown>, guard: (b: Booking) => string | null) {
  const current = await getBookingById(id);
  if (!current) throw new Error("Booking not found.");
  const problem = guard(current);
  if (problem) throw new Error(problem);
  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find((x) => x.id === id)!;
    Object.assign(b, patch);
    return;
  }
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(patch)) row[k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = v;
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

/** Admin confirms the token landed → the request is now sent to the artist. */
export async function verifyToken(id: string): Promise<void> {
  await adminPatch(
    id,
    { tokenStatus: "verified", status: "pending", sentToArtistAt: new Date().toISOString() },
    (b) =>
      b.status !== "awaiting_token"
        ? "This booking is not waiting for a token."
        : b.tokenStatus !== "claimed"
          ? "The customer hasn't submitted a token UTR yet."
          : null
  );
}

/** Admin: the UTR didn't match any payment — ask the customer to pay again. */
export async function rejectTokenClaim(id: string): Promise<void> {
  await adminPatch(id, { tokenStatus: "unpaid", tokenUtr: "" }, (b) =>
    b.tokenStatus !== "claimed" ? "There is no token claim to reject." : null
  );
}

/** Admin: the token has been refunded to the customer. */
export async function markRefunded(id: string, utr: string): Promise<void> {
  await adminPatch(id, { tokenStatus: "refunded", refundUtr: clean(utr) }, (b) =>
    b.tokenStatus !== "refund_due" ? "No refund is due on this booking." : null
  );
}

/** Admin: set/revise the total; commission is snapshotted. */
export async function setBookingAmount(id: string, amount: number, commissionPercent: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount.");
  await adminPatch(
    id,
    { amount, commissionAmount: Math.round((amount * commissionPercent) / 100) },
    (b) =>
      b.status === "cancelled" || b.status === "declined"
        ? "This booking is closed."
        : b.paymentStatus !== "unpaid"
          ? "The total is locked once the customer has paid the balance."
          : amount < b.tokenAmount
            ? "The total cannot be less than the token."
            : null
  );
}

/** Admin confirms the customer's BALANCE payment was received. */
export async function markPaymentVerified(id: string): Promise<void> {
  const b = await getBookingById(id);
  if (!b) throw new Error("Booking not found.");
  if (b.paymentStatus !== "claimed") throw new Error("The customer needs to record the payment first.");
  if (b.paymentMethod === "cash") throw new Error("Cash is confirmed by the artist, who received it.");
  if (!contactUnlocked(b.status)) throw new Error("This booking is not active.");
  const after: Booking = { ...b, paymentStatus: "verified" };
  const net = netToArtist(after);
  await adminPatch(
    id,
    { paymentStatus: "verified", status: "completed", settlementStatus: net === 0 ? "settled" : "pending" },
    () => null
  );
}

/** Admin marks the admin↔artist settlement done. */
export async function markSettled(id: string, utr?: string): Promise<void> {
  const patch: Record<string, unknown> = { settlementStatus: "settled" };
  if (utr) patch.settlementUtr = clean(utr);
  await adminPatch(id, patch, (b) =>
    b.settlementStatus === "na" ? "Settlement is only possible after the balance is verified." : null
  );
}

/** Admin changes the status by hand. Cancelling after a verified token flags a refund. */
export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) throw new Error("Invalid status.");
  const b = await getBookingById(id);
  if (!b) throw new Error("Booking not found.");
  if (status === b.status) return;
  if (!ADMIN_TRANSITIONS[b.status].includes(status)) {
    throw new Error(
      b.status === "awaiting_token"
        ? "Verify the token first (or cancel the booking)."
        : "A booking can't move to that status from here."
    );
  }
  if (status === "cancelled" && b.tokenStatus === "claimed") {
    throw new Error("Check the token UTR first — verify it (then cancel to refund) or reject it.");
  }
  const patch: Record<string, unknown> = { status };
  if ((status === "cancelled" || status === "declined") && b.tokenStatus === "verified" && b.tokenAmount > 0) {
    patch.tokenStatus = "refund_due";
  }
  await adminPatch(id, patch, () => null);
}

/* ── Artist-side mutations (Supabase: checked RPCs; the caller verified ownership) ── */

function demoBooking(id: string) {
  const b = demoStore().bookings.find((x) => x.id === id);
  if (!b || !b.sentToArtistAt) throw new Error("Booking not found.");
  return b;
}

export async function artistRespond(id: string, accept: boolean, reason: string): Promise<void> {
  await expireStaleBookings();
  if (!isSupabaseConfigured()) {
    const b = demoBooking(id);
    if (b.status !== "pending") throw new Error("This request has already been answered or has expired.");
    b.respondedAt = new Date().toISOString();
    if (accept) {
      b.status = "confirmed";
      if (b.amount !== null && b.tokenStatus === "verified" && b.amount <= b.tokenAmount) {
        b.paymentStatus = "verified"; // the token covered everything
        b.settlementStatus = netToArtist(b) === 0 ? "settled" : "pending";
      }
    } else {
      b.status = "declined";
      b.declineReason = clean(reason, 300) || "The artist is not available on this date";
      if (b.tokenStatus === "verified" && b.tokenAmount > 0) b.tokenStatus = "refund_due";
    }
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("artist_respond", {
    p_booking_id: id,
    p_accept: accept,
    p_reason: clean(reason, 300),
  });
  if (error) throw new Error(error.message);
}

export async function artistSetAmount(id: string, amount: number, commissionPercent: number): Promise<void> {
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter a valid amount.");
  if (!isSupabaseConfigured()) {
    const b = demoBooking(id);
    if (!["pending", "confirmed", "completed"].includes(b.status)) throw new Error("The amount can only be changed on an open booking.");
    if (b.paymentStatus !== "unpaid") throw new Error("The total is locked once the customer has paid the balance.");
    if (amount < b.tokenAmount) throw new Error("The total cannot be less than the token already paid.");
    b.amount = amount;
    b.commissionAmount = Math.round((amount * commissionPercent) / 100);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("artist_set_amount", { p_booking_id: id, p_amount: amount });
  if (error) throw new Error(error.message);
}

/** Artist records the balance received in cash. She is the one receiving it, so
 *  her record is final: the payment is verified and the booking completed. */
export async function artistRecordCash(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const b = demoBooking(id);
    if (!contactUnlocked(b.status)) throw new Error("Confirm the booking first.");
    if (b.paymentStatus === "verified") throw new Error("Payment already verified.");
    if (b.amount === null) throw new Error("Set the amount first.");
    b.paymentMethod = "cash";
    b.paymentStatus = "verified";
    b.status = "completed";
    b.settlementStatus = netToArtist(b) === 0 ? "settled" : "pending";
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("artist_record_cash", { p_booking_id: id });
  if (error) throw new Error(error.message);
}

/** Artist submits the UTR of the commission they owe the admin. */
export async function artistSettlementUtr(id: string, utr: string): Promise<void> {
  if (clean(utr).length < 6) throw new Error("Please enter a valid UTR/reference number.");
  if (!isSupabaseConfigured()) {
    const b = demoBooking(id);
    if (b.settlementStatus !== "pending" && b.settlementStatus !== "claimed")
      throw new Error("No settlement is due on this booking.");
    if ((netToArtist(b) ?? 0) >= 0) throw new Error("Rangritii owes you on this booking — there is nothing for you to pay.");
    b.settlementStatus = "claimed";
    b.settlementUtr = clean(utr);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("artist_settlement_utr", { p_booking_id: id, p_utr: clean(utr) });
  if (error) throw new Error(error.message);
}

/* ── Public payment page (no login; booking number + phone required) ── */

export type PaymentInfo = {
  bookingNumber: string;
  artistName: string;
  eventDate: string;
  status: BookingStatus;
  items: BookingItem[];
  amount: number | null;
  tokenAmount: number;
  tokenStatus: TokenStatus;
  declineReason: string;
  balance: number | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  /** Only filled once the artist has confirmed the booking — "" before that. */
  artistWhatsapp: string;
  adminUpi: string;
  adminQr: string;
};

export async function getPaymentInfo(bookingNumber: string, phone: string): Promise<PaymentInfo | null> {
  const cleanPhone = phone10(phone);
  if (cleanPhone.length !== 10) return null;

  if (!isSupabaseConfigured()) {
    await expireStaleBookings();
    const store = demoStore();
    const b = store.bookings.find(
      (b) =>
        b.bookingNumber.toUpperCase() === bookingNumber.trim().toUpperCase() &&
        phone10(b.phone) === cleanPhone
    );
    if (!b) return null;
    const artist = store.artists.find((a) => a.id === b.artistId);
    return {
      bookingNumber: b.bookingNumber,
      artistName: b.artistName,
      eventDate: b.eventDate,
      status: b.status,
      items: b.items,
      amount: b.amount,
      tokenAmount: b.tokenAmount,
      tokenStatus: b.tokenStatus,
      declineReason: b.declineReason,
      balance: balanceDue(b),
      paymentMethod: b.paymentMethod,
      paymentStatus: b.paymentStatus,
      artistWhatsapp: contactUnlocked(b.status) ? (artist?.whatsapp ?? "") : "",
      adminUpi: store.settings.upiId,
      adminQr: store.settings.upiQr,
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
  const info = {
    amount: num(r.amount),
    tokenAmount: Number(r.token_amount ?? 0),
    tokenStatus: oneOf(TOKEN_STATUSES, r.token_status, "verified"),
  };
  return {
    bookingNumber: String(r.booking_number ?? ""),
    artistName: String(r.artist_name ?? ""),
    eventDate: String(r.event_date ?? ""),
    status: oneOf(BOOKING_STATUSES, r.status, "pending"),
    items: parseItems(r.items),
    ...info,
    declineReason: String(r.decline_reason ?? ""),
    balance: balanceDue(info),
    paymentMethod: (PAYMENT_METHODS as readonly string[]).includes(String(r.payment_method))
      ? (String(r.payment_method) as PaymentMethod)
      : null,
    paymentStatus: oneOf(["unpaid", "claimed", "verified"] as const, r.payment_status, "unpaid"),
    artistWhatsapp: String(r.artist_whatsapp ?? ""),
    adminUpi: String(r.admin_upi ?? ""),
    adminQr: String(r.admin_qr ?? ""),
  };
}

/** Customer submits the UTR of the token payment. */
export async function claimToken(bookingNumber: string, phone: string, utr: string): Promise<void> {
  const cleanPhone = phone10(phone);
  const cleanUtr = clean(utr);
  if (cleanPhone.length !== 10) throw new Error("Please enter a valid phone number.");
  if (cleanUtr.length < 6) throw new Error("Please enter the 12-digit UTR / transaction reference.");

  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find(
      (b) =>
        b.bookingNumber.toUpperCase() === bookingNumber.trim().toUpperCase() &&
        phone10(b.phone) === cleanPhone
    );
    if (!b) throw new Error("Booking not found — check the booking number and phone.");
    if (b.status !== "awaiting_token" || (b.tokenStatus !== "unpaid" && b.tokenStatus !== "claimed")) {
      throw new Error("This booking is not waiting for a token payment.");
    }
    if (demoUtrInUse(cleanUtr, b.id)) throw new Error(UTR_TAKEN);
    b.tokenStatus = "claimed";
    b.tokenUtr = cleanUtr;
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("claim_token", {
    p_booking_number: bookingNumber.trim(),
    p_phone: cleanPhone,
    p_utr: cleanUtr,
  });
  if (error) throw new Error(error.message);
}

/** Customer: "I have paid the balance" — to Rangritii UPI, or in cash to the artist. */
export async function claimPayment(
  bookingNumber: string,
  phone: string,
  method: CustomerPaymentMethod,
  utr: string
): Promise<void> {
  const cleanPhone = phone10(phone);
  const cleanUtr = clean(utr);
  if (cleanPhone.length !== 10) throw new Error("Please enter a valid phone number.");
  if (!(CUSTOMER_PAYMENT_METHODS as readonly string[]).includes(method)) throw new Error("Invalid method.");
  if (method === "upi_admin" && cleanUtr.length < 6) {
    throw new Error("Please enter the UTR/transaction reference number.");
  }

  if (!isSupabaseConfigured()) {
    const b = demoStore().bookings.find(
      (b) =>
        b.bookingNumber.toUpperCase() === bookingNumber.trim().toUpperCase() &&
        phone10(b.phone) === cleanPhone
    );
    if (!b) throw new Error("Booking not found — check the booking number and phone.");
    if (!contactUnlocked(b.status) || b.amount === null)
      throw new Error("The balance can be paid once the artist has confirmed the booking.");
    if (b.paymentStatus === "verified") throw new Error("This payment is already verified.");
    if (method === "upi_admin" && demoUtrInUse(cleanUtr, b.id)) throw new Error(UTR_TAKEN);
    b.paymentMethod = method;
    b.paymentStatus = "claimed";
    b.paymentUtr = method === "cash" ? "" : cleanUtr;
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

export type { SettlementStatus };
