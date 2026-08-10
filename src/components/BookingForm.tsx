"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarCheck } from "lucide-react";
import { placeBooking } from "@/app/(store)/book/actions";
import { EVENT_TYPES } from "@/lib/types";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";
const label = "mb-1.5 block text-xs font-semibold text-ink-700";

export function BookingForm({
  artistId,
  artistCity,
}: {
  artistId: string;
  artistCity: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  function submit(formData: FormData) {
    setError("");
    const details = {
      customerName: String(formData.get("customerName") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      email: String(formData.get("email") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      eventDate: String(formData.get("eventDate") ?? ""),
      eventType: String(formData.get("eventType") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    };
    startTransition(async () => {
      const result = await placeBooking(artistId, details);
      if (result.ok) {
        const sp = new URLSearchParams({
          number: result.bookingNumber,
          artist: result.artistName,
        });
        if (result.artistWhatsapp) sp.set("wa", result.artistWhatsapp);
        router.push(`/booking-confirmed?${sp.toString()}`);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="customerName">Your name *</label>
          <input id="customerName" name="customerName" required className={field} placeholder="Pooja Sharma" />
        </div>
        <div>
          <label className={label} htmlFor="phone">Mobile number *</label>
          <input id="phone" name="phone" type="tel" required className={field} placeholder="98765 43210" />
        </div>
      </div>
      <div>
        <label className={label} htmlFor="email">Email (optional)</label>
        <input id="email" name="email" type="email" className={field} placeholder="you@example.com" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="eventDate">Event date *</label>
          <input id="eventDate" name="eventDate" type="date" required min={minDate} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="eventType">Occasion *</label>
          <select id="eventType" name="eventType" required className={field} defaultValue={EVENT_TYPES[0]}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className={label} htmlFor="address">Address (jahan mehandi lagni hai) *</label>
        <textarea id="address" name="address" required rows={3} className={field} placeholder="Flat 12, Rose Villa, MG Road, near City Mall" />
      </div>
      <div>
        <label className={label} htmlFor="city">City *</label>
        <input id="city" name="city" required defaultValue={artistCity} className={field} />
      </div>
      <div>
        <label className={label} htmlFor="notes">
          Notes (kitne logon ke liye, konsa design, timing…)
        </label>
        <textarea id="notes" name="notes" rows={3} className={field} placeholder="e.g. Dulhan + 4 family members, evening 5 baje ke baad" />
      </div>

      {error && (
        <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rani-700 py-4 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
      >
        <CalendarCheck className="h-4 w-4" />
        {pending ? "Sending request…" : "Send Booking Request (FREE)"}
      </button>
      <p className="text-center text-xs text-ink-500">
        Koi advance payment nahi — artist confirm karegi, payment service ke baad seedha
        artist ko.
      </p>
    </form>
  );
}
