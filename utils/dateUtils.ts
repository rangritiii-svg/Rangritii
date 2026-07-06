/**
 * dateUtils.ts
 * Robust date/time parsing for bookings.
 *
 * Booking dates are stored as ISO "YYYY-MM-DD" and times as "9:00 AM" / "10:30 PM".
 * Passing that concatenated string straight to `new Date("2026-07-10 9:00 AM")`
 * returns `Invalid Date` on Hermes / iOS, which silently breaks cancellation-tier
 * refund math. This parser builds the Date from explicit components instead.
 */

/** Parse a booking date ("YYYY-MM-DD") + time ("9:00 AM") into a Date, or null if invalid. */
export function parseBookingDateTime(dateStr?: string, timeStr?: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split("-").map((n) => parseInt(n, 10));
  const [year, month, day] = parts;
  if (!year || !month || !day) return null;

  let hours = 0;
  let minutes = 0;
  if (timeStr) {
    const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (match) {
      hours = parseInt(match[1], 10);
      minutes = parseInt(match[2], 10);
      const meridiem = match[3]?.toUpperCase();
      if (meridiem === "PM" && hours < 12) hours += 12;
      if (meridiem === "AM" && hours === 12) hours = 0;
    }
  }
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

/** Hours from now until the given booking date/time. Returns NaN if unparseable. */
export function hoursUntilBooking(dateStr?: string, timeStr?: string): number {
  const d = parseBookingDateTime(dateStr, timeStr);
  if (!d) return NaN;
  return (d.getTime() - Date.now()) / (1000 * 60 * 60);
}
