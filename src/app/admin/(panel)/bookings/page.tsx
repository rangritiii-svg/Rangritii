import { CalendarDays, MapPin, Phone, User } from "lucide-react";
import { BookingStatusSelect } from "@/components/admin/BookingStatusSelect";
import { PaymentAdminPanel } from "@/components/admin/PaymentAdminPanel";
import { formatDate, formatEventDate } from "@/lib/format";
import { getBookings } from "@/lib/bookings";
import { getArtists } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const [bookings, artists] = await Promise.all([
    getBookings(),
    getArtists({ includeUnapproved: true }),
  ]);
  const artistById = new Map(artists.map((a) => [a.id, a]));

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Bookings <span className="text-lg text-ink-500">({bookings.length})</span>
      </h1>

      {bookings.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-cream-300 bg-white py-16 text-center text-ink-500">
          No bookings yet. Customer requests will appear here.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {bookings.map((b) => (
            <li key={b.id} className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-ink-900">{b.bookingNumber}</p>
                  <p className="text-xs text-ink-500">Requested {formatDate(b.createdAt)}</p>
                </div>
                <BookingStatusSelect bookingId={b.id} status={b.status} />
              </div>

              <div className="mt-4 grid gap-5 border-t border-cream-200 pt-4 md:grid-cols-2">
                <div className="space-y-2 text-sm text-ink-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Event
                  </p>
                  <p className="flex items-center gap-2">
                    <User className="h-4 w-4 text-rani-700" />
                    Artist: <strong>{b.artistName}</strong>
                  </p>
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-rani-700" />
                    {formatEventDate(b.eventDate)} · {b.eventType}
                  </p>
                  {b.notes && <p className="text-ink-500">📝 {b.notes}</p>}
                </div>
                <div className="space-y-2 text-sm text-ink-700">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Customer
                  </p>
                  <p className="font-semibold text-ink-900">{b.customerName}</p>
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-rani-700" />
                    <a href={`tel:${b.phone}`} className="hover:text-rani-700">{b.phone}</a>
                    {b.email && (
                      <>
                        <span className="text-ink-300">·</span>
                        <a href={`mailto:${b.email}`} className="hover:text-rani-700">
                          {b.email}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-rani-700" />
                    {b.address}, {b.city}
                  </p>
                </div>
              </div>

              <PaymentAdminPanel
                booking={b}
                artistUpi={artistById.get(b.artistId)?.upiId ?? ""}
                artistQr={artistById.get(b.artistId)?.upiQr ?? ""}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
