"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { updateBookingStatusAction } from "@/app/admin/actions";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";

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
      {BOOKING_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
