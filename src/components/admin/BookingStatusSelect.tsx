"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateBookingStatusAction } from "@/app/admin/actions";
import { STATUS_LABEL, type BookingStatus } from "@/lib/types";

/* Mirrors ADMIN_TRANSITIONS in lib/bookings (server re-checks). */
const NEXT: Record<BookingStatus, BookingStatus[]> = {
  awaiting_token: ["cancelled"],
  pending: ["confirmed", "declined", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  declined: [],
  cancelled: [],
};

export function BookingStatusSelect({
  bookingId,
  status,
}: {
  bookingId: string;
  status: BookingStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<BookingStatus>(status);
  const [pending, startTransition] = useTransition();

  // stay in sync when the server changes the status (e.g. amount set → confirmed)
  useEffect(() => setCurrent(status), [status]);

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as BookingStatus;
        const previous = current;
        setCurrent(next);
        startTransition(async () => {
          const result = await updateBookingStatusAction(bookingId, next);
          if (!result.ok) setCurrent(previous);
          router.refresh();
        });
      }}
      className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-xs font-bold capitalize text-ink-900 outline-none focus:border-rani-400 disabled:opacity-60"
      aria-label="Booking status"
    >
      {[status, ...NEXT[status]].map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}
