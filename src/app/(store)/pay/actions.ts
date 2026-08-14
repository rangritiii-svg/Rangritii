"use server";

import {
  claimPayment,
  getPaymentInfo,
  type PaymentInfo,
} from "@/lib/bookings";

export type LookupResult =
  | { ok: true; info: PaymentInfo }
  | { ok: false; error: string };

export async function lookupBooking(
  bookingNumber: string,
  phone: string
): Promise<LookupResult> {
  try {
    if (!bookingNumber.trim()) return { ok: false, error: "Please enter your booking number." };
    const info = await getPaymentInfo(bookingNumber, phone);
    if (!info) {
      return {
        ok: false,
        error: "Booking not found — check the number and use the same phone number you gave while booking.",
      };
    }
    return { ok: true, info };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
    };
  }
}

export type ClaimResult = { ok: true } | { ok: false; error: string };

export async function submitPaymentClaim(
  bookingNumber: string,
  phone: string,
  method: "upi_admin" | "upi_artist",
  utr: string
): Promise<ClaimResult> {
  try {
    await claimPayment(bookingNumber, phone, method, utr);
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
    };
  }
}
