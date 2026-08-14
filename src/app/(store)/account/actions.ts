"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";
import { parseArtistSelfFields } from "@/lib/artist-form";
import { getArtistByUserId, getPlatformSettings, updateArtist } from "@/lib/data";
import {
  getBookingById,
  markPaymentVerified,
  recordCashPayment,
  setBookingAmount,
  submitSettlementUtr,
} from "@/lib/bookings";

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts require the database to be connected." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Incorrect email or password." };
  revalidatePath("/account");
  return { ok: true };
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts require the database to be connected." };
  }
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName) return { ok: false, error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/account");
  if (data.session) return { ok: true };
  return {
    ok: true,
    message: "Account created! Check your email to confirm, then log in.",
  };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/account");
}

export type UpdateProfileResult = { ok: true } | { ok: false; error: string };

/** Guard: the logged-in user must be the artist who owns this booking. */
async function requireOwnBooking(bookingId: string) {
  if (!isSupabaseConfigured()) {
    // Demo mode has no artist login — these actions are admin/demo-tested only.
    throw new Error("Artist actions require the database to be connected.");
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please log in again.");
  const artist = await getArtistByUserId(user.id);
  if (!artist) throw new Error("Artist profile not found.");
  const booking = await getBookingById(bookingId);
  if (!booking || booking.artistId !== artist.id) {
    throw new Error("This booking doesn't belong to you.");
  }
  return booking;
}

type SimpleResult = { ok: true } | { ok: false; error: string };

function fail(e: unknown): SimpleResult {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

/** Artist sets/updates the final agreed amount for their booking. */
export async function artistSetAmountAction(
  bookingId: string,
  amount: number
): Promise<SimpleResult> {
  try {
    await requireOwnBooking(bookingId);
    const settings = await getPlatformSettings();
    await setBookingAmount(bookingId, amount, settings.commissionPercent);
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Artist confirms a customer's claimed UPI payment landed in their account. */
export async function artistVerifyPaymentAction(bookingId: string): Promise<SimpleResult> {
  try {
    const booking = await requireOwnBooking(bookingId);
    if (booking.paymentMethod !== "upi_artist") {
      throw new Error("You can only verify UPI payments made directly to you — the admin handles the rest.");
    }
    await markPaymentVerified(bookingId);
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Artist records that the customer paid cash at the service. */
export async function artistRecordCashAction(bookingId: string): Promise<SimpleResult> {
  try {
    await requireOwnBooking(bookingId);
    await recordCashPayment(bookingId);
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Artist submits the UTR of the commission they paid to admin. */
export async function artistCommissionUtrAction(
  bookingId: string,
  utr: string
): Promise<SimpleResult> {
  try {
    const booking = await requireOwnBooking(bookingId);
    if (booking.paymentMethod === "upi_admin") {
      throw new Error("No commission is due on this booking — the admin will pay you out.");
    }
    await submitSettlementUtr(bookingId, utr);
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** An artist updating their own profile (never approval/slug/identity fields). */
export async function updateOwnArtistProfile(
  formData: FormData
): Promise<UpdateProfileResult> {
  try {
    if (!isSupabaseConfigured()) {
      return { ok: false, error: "Database not connected." };
    }
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please log in again." };

    const artist = await getArtistByUserId(user.id);
    if (!artist) return { ok: false, error: "Artist profile not found." };

    const fields = parseArtistSelfFields(formData);
    await updateArtist(artist.id, fields);
    revalidatePath("/account");
    revalidatePath(`/artist/${artist.slug}`);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong.",
    };
  }
}
