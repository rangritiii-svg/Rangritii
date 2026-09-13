"use server";

import { isSupabaseConfigured } from "@/lib/config";
import { createBooking, type BookingDetails } from "@/lib/bookings";
import { EVENT_TYPES } from "@/lib/types";

export type BookResult =
    | { ok: true; bookingNumber: string; artistName: string }
  | { ok: false; error: string };

function validate(d: BookingDetails): string | null {
    if (!d.customerName.trim()) return "Please enter your name.";
    if (!/^[6-9]\d{9}$/.test(d.phone.replace(/\D/g, "")))
          return "Please enter a valid 10-digit mobile number.";
    if (d.email && !/^\S+@\S+\.\S+$/.test(d.email.trim()))
          return "Please enter a valid email (or leave it blank).";
    if (d.address.trim().length < 8) return "Please enter your complete address.";
    if (!d.city.trim()) return "Please enter your city.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.eventDate)) return "Please pick your event date.";
    const [y, m, day] = d.eventDate.split("-").map(Number);
    const event = new Date(y, m - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (event.getTime() < today.getTime()) return "Event date cannot be in the past.";
    if (!(EVENT_TYPES as readonly string[]).includes(d.eventType))
          return "Please choose the occasion.";
    return null;
}

export async function placeBooking(
    artistId: string,
    details: BookingDetails
  ): Promise<BookResult> {
    try {
          const error = validate(details);
          if (error) return { ok: false, error };

      let userId: string | null = null;
          if (isSupabaseConfigured()) {
                  const { createClient } = await import("@/lib/supabase/server");
                  const supabase = await createClient();
                  const {
                            data: { user },
                  } = await supabase.auth.getUser();
                  userId = user?.id ?? null;
          }

      const clean: BookingDetails = {
              customerName: details.customerName.trim().slice(0, 120),
              phone: details.phone.replace(/\D/g, "").slice(0, 10),
              email: details.email.trim().slice(0, 200),
              address: details.address.trim().slice(0, 500),
              city: details.city.trim().slice(0, 100),
              eventDate: details.eventDate,
              eventType: details.eventType,
              notes: details.notes.trim().slice(0, 1000),
      };

      const result = await createBooking(artistId, clean, userId);
          return { ok: true, ...result };
    } catch (e) {
          return {
                  ok: false,
                  error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
          };
    }
}
