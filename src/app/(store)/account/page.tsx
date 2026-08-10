import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Database,
  LogOut,
  Palette,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { ArtistBookingPayments } from "@/components/ArtistBookingPayments";
import { ArtistSelfEditor } from "@/components/ArtistSelfEditor";
import { AuthTabs } from "@/components/AuthTabs";
import { isSupabaseConfigured } from "@/lib/config";
import { getArtistByUserId, getPlatformSettings, getStyles } from "@/lib/data";
import { formatDate, formatEventDate, formatINR } from "@/lib/format";
import { getBookingsForArtist, getBookingsForUser } from "@/lib/bookings";
import type { Booking, PlatformSettings } from "@/lib/types";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-marigold-100 text-marigold-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-rani-100 text-rani-800",
};

function PaymentChip({ b }: { b: Booking }) {
  if (b.paymentStatus === "verified")
    return <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-bold text-green-800">Paid ✓</span>;
  if (b.paymentStatus === "claimed")
    return <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">Payment verify ho rahi hai</span>;
  if (b.amount !== null)
    return (
      <Link
        href={`/pay?number=${encodeURIComponent(b.bookingNumber)}`}
        className="rounded-full bg-rani-700 px-3.5 py-1 text-xs font-bold text-white hover:bg-rani-800"
      >
        Pay {formatINR(b.amount)}
      </Link>
    );
  return null;
}

function BookingList({
  bookings,
  forArtist,
  settings,
}: {
  bookings: Booking[];
  forArtist?: boolean;
  settings?: PlatformSettings;
}) {
  if (bookings.length === 0) {
    return (
      <div className="mt-4 rounded-3xl border border-dashed border-cream-300 bg-white py-12 text-center">
        <p className="text-ink-500">
          {forArtist
            ? "Abhi koi booking request nahi aayi."
            : "No bookings yet — apni pehli mehandi book karo!"}
        </p>
        {!forArtist && (
          <Link
            href="/artists"
            className="mt-4 inline-block rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800"
          >
            Find Artists
          </Link>
        )}
      </div>
    );
  }
  return (
    <ul className="mt-4 space-y-4">
      {bookings.map((b) => (
        <li key={b.id} className="rounded-3xl border border-cream-300 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-bold text-ink-900">{b.bookingNumber}</p>
              <p className="text-xs text-ink-500">Requested {formatDate(b.createdAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              {!forArtist && <PaymentChip b={b} />}
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  STATUS_STYLES[b.status] ?? "bg-cream-200 text-ink-700"
                }`}
              >
                {b.status}
              </span>
            </div>
          </div>
          <div className="mt-3 grid gap-2 border-t border-cream-200 pt-3 text-sm text-ink-700 sm:grid-cols-2">
            <p className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-rani-700" />
              {forArtist ? b.customerName : b.artistName}
            </p>
            <p className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-rani-700" />
              {formatEventDate(b.eventDate)} · {b.eventType}
            </p>
            {forArtist && (
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-rani-700" />
                <a href={`tel:${b.phone}`} className="hover:text-rani-700">{b.phone}</a>
              </p>
            )}
            <p className="text-ink-500 sm:col-span-2">
              📍 {b.address}, {b.city}
            </p>
            {b.notes && <p className="text-ink-500 sm:col-span-2">📝 {b.notes}</p>}
          </div>
          {forArtist && (
            <ArtistBookingPayments
              booking={b}
              adminUpi={settings?.upiId ?? ""}
              adminQr={settings?.upiQr ?? ""}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Database className="mx-auto h-14 w-14 text-ink-300" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">
          Demo mode chal raha hai
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Accounts (customer & artist login) Supabase connect hone par unlock hote hain.
          Browsing aur booking abhi bhi fully working hai!
        </p>
        <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-cream-300 bg-white p-6 text-left">
          <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <ShieldCheck className="h-4 w-4 text-rani-700" /> Admin panel demo
          </p>
          <Link
            href="/admin/login"
            className="mt-4 block rounded-full bg-rani-700 py-3 text-center text-sm font-bold text-white hover:bg-rani-800"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-center font-display text-4xl font-semibold text-ink-900">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-ink-500">
          Log in to manage bookings — ya artist ho toh apni profile.
        </p>
        <div className="mt-8">
          <AuthTabs next="/account" />
        </div>
      </div>
    );
  }

  const [myBookings, artist, styles, profileRes, settings] = await Promise.all([
    getBookingsForUser(user.id),
    getArtistByUserId(user.id),
    getStyles(),
    supabase.from("profiles").select("full_name, role").eq("id", user.id).maybeSingle(),
    getPlatformSettings(),
  ]);
  const profile = profileRes.data;
  const artistBookings = artist ? await getBookingsForArtist(artist.id) : [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Namaste, {artist?.name || profile?.full_name || user.email} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-full border-2 border-rani-700 px-5 py-2.5 text-sm font-bold text-rani-700 hover:bg-rani-50"
            >
              Admin Panel
            </Link>
          )}
          <form action={signOut}>
            <button className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 hover:border-rani-300">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </div>

      {/* ── Artist section ── */}
      {artist && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink-900">
            <Palette className="h-5 w-5 text-rani-700" /> My Artist Profile
          </h2>
          {artist.isApproved ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5 text-sm font-medium text-green-800">
              <BadgeCheck className="h-4.5 w-4.5" />
              Profile approved & live!{" "}
              <Link href={`/artist/${artist.slug}`} className="font-bold underline">
                View public profile
              </Link>
            </p>
          ) : (
            <p className="mt-3 flex items-center gap-2 rounded-2xl border border-marigold-200 bg-marigold-50 px-5 py-3.5 text-sm font-medium text-marigold-800">
              <Clock className="h-4.5 w-4.5" />
              Profile review mein hai — approval 24–48 hours mein ho jayega.
            </p>
          )}
          <div className="mt-4">
            <ArtistSelfEditor artist={artist} styles={styles} />
          </div>

          <h3 className="mt-8 font-display text-xl font-semibold text-ink-900">
            Booking Requests Received ({artistBookings.length})
          </h3>
          <BookingList bookings={artistBookings} forArtist settings={settings} />
        </section>
      )}

      {/* ── Customer bookings ── */}
      <section className="mt-10">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink-900">
          <CalendarDays className="h-5 w-5 text-rani-700" /> My Bookings
        </h2>
        <BookingList bookings={myBookings} />
      </section>

      {!artist && (
        <div className="mt-10 rounded-3xl border border-cream-300 bg-white p-6 text-center">
          <p className="font-display text-xl font-semibold text-ink-900">
            Mehandi artist ho?
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Free profile banao aur apne sheher se bookings pao.
          </p>
          <Link
            href="/join"
            className="mt-4 inline-block rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800"
          >
            Join as Artist
          </Link>
        </div>
      )}
    </div>
  );
}
