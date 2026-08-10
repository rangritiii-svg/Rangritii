import Link from "next/link";
import { ArrowRight, CalendarDays, Clock, UserCheck, Users } from "lucide-react";
import { getArtists } from "@/lib/data";
import { formatDate, formatEventDate } from "@/lib/format";
import { getBookings } from "@/lib/bookings";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-marigold-100 text-marigold-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-rani-100 text-rani-800",
};

export default async function AdminDashboard() {
  const [artists, bookings] = await Promise.all([
    getArtists({ includeUnapproved: true }),
    getBookings(),
  ]);

  const pendingApprovals = artists.filter((a) => !a.isApproved);
  const pendingBookings = bookings.filter((b) => b.status === "pending");

  const stats = [
    { label: "Total artists", value: String(artists.length), icon: Users },
    {
      label: "Pending approvals",
      value: String(pendingApprovals.length),
      icon: UserCheck,
      href: "/admin/artists",
      highlight: pendingApprovals.length > 0,
    },
    { label: "Total bookings", value: String(bookings.length), icon: CalendarDays },
    {
      label: "Pending bookings",
      value: String(pendingBookings.length),
      icon: Clock,
      href: "/admin/bookings",
      highlight: pendingBookings.length > 0,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href, highlight }) => {
          const card = (
            <div
              className={`rounded-3xl border bg-white p-5 ${
                highlight ? "border-marigold-300 ring-2 ring-marigold-200" : "border-cream-300"
              }`}
            >
              <span className="inline-flex rounded-xl bg-rani-50 p-2.5 text-rani-700">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                {label}
              </p>
            </div>
          );
          return href ? (
            <Link key={label} href={href}>{card}</Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink-900">Recent bookings</h2>
        <Link
          href="/admin/bookings"
          className="inline-flex items-center gap-1 text-sm font-semibold text-rani-700 hover:underline"
        >
          All bookings <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-3xl border border-cream-300 bg-white">
        <table className="w-full min-w-160 text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3.5">Booking</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Artist</th>
              <th className="px-5 py-3.5">Event date</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.slice(0, 6).map((b) => (
              <tr key={b.id} className="border-b border-cream-100 last:border-0">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-ink-900">{b.bookingNumber}</p>
                  <p className="text-xs text-ink-500">{formatDate(b.createdAt)}</p>
                </td>
                <td className="px-5 py-3.5 text-ink-700">{b.customerName}</td>
                <td className="px-5 py-3.5 text-ink-700">{b.artistName}</td>
                <td className="px-5 py-3.5 text-ink-500">{formatEventDate(b.eventDate)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                      STATUS_STYLES[b.status] ?? "bg-cream-200 text-ink-700"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                  No bookings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
