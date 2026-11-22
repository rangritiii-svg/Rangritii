import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  Database,
  Lock,
  LogOut,
  MessageCircle,
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
import { getBookingsForArtist, getBookingsForUser, getMyBookingContacts } from "@/lib/bookings";
import {
  STATUS_LABEL,
  balanceDue,
  contactUnlocked,
  type Booking,
  type PlatformSettings,
} from "@/lib/types";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  awaiting_token: "bg-stain-50 text-stain-700",
  pending: "bg-marigold-100 text-marigold-800",
  confirmed: "bg-leaf-50 text-leaf-700",
  completed: "bg-leaf-100 text-leaf-800",
  declined: "bg-rani-50 text-rani-800",
  cancelled: "bg-cream-200 text-ink-700",
};

/** The one thing the customer should do next on this booking, if anything. */
function NextStep({ b }: { b: Booking }) {
  const href = `/pay?number=${encodeURIComponent(b.bookingNumber)}`;
  const cta = "rounded-full bg-rani-700 px-4 py-2 text-sm font-semibold text-white";
  if (b.status === "awaiting_token" && b.tokenStatus === "unpaid")
    return <Link href={href} className={cta}>Pay {formatINR(b.tokenAmount)} token</Link>;
  if (b.status === "awaiting_token" && b.tokenStatus === "claimed")
    return <span className="text-sm text-ink-500">Checking your token payment</span>;
  if (b.tokenStatus === "refund_due") return <span className="text-sm text-ink-500">Token refund on its way</span>;
  if (b.tokenStatus === "refunded") return <span className="text-sm text-ink-500">Token refunded</span>;
  const bal = balanceDue(b);
  if (contactUnlocked(b.status) && b.paymentStatus === "unpaid" && bal)
    return <Link href={href} className={cta}>Pay balance {formatINR(bal)}</Link>;
  if (b.paymentStatus === "claimed") return <span className="text-sm text-ink-500">Balance being verified</span>;
  if (b.paymentStatus === "verified") return <span className="text-sm font-medium text-leaf-700">Fully paid</span>;
  return null;
}

/** Customer-side artist contact — locked until the artist confirms the booking. */
function ArtistContact({ b, whatsapp }: { b: Booking; whatsapp: string }) {
  if (!contactUnlocked(b.status)) {
    return (
      <p className="flex items-start gap-2 text-xs text-ink-500 sm:col-span-2">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        {b.artistName}&apos;s phone and WhatsApp appear here once she accepts.
      </p>
    );
  }
  if (!whatsapp) {
    return (
      <p className="text-xs text-ink-500 sm:col-span-2">
        Booking confirmed — the artist will call you to plan the details.
      </p>
    );
  }
  const digits = whatsapp.replace(/\D/g, "");
  return (
    <p className="flex flex-wrap items-center gap-3 sm:col-span-2">
      <a
        href={`https://wa.me/${digits}?text=${encodeURIComponent(
          `Hi ${b.artistName}! This is about my confirmed Rangritii booking ${b.bookingNumber}.`
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full border-2 border-[#25d366] px-4 py-2 text-xs font-bold text-[#1da851] transition hover:bg-[#25d366]/10"
      >
        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp {b.artistName}
      </a>
      <a
        href={`tel:+${digits}`}
        className="inline-flex items-center gap-2 rounded-full border border-cream-300 px-4 py-2 text-xs font-bold text-ink-700 transition hover:border-rani-300"
      >
        <Phone className="h-3.5 w-3.5" /> Call
      </a>
    </p>
  );
}

function BookingList({
  bookings,
  forArtist,
  settings,
  artistContacts,
}: {
  bookings: Booking[];
  forArtist?: boolean;
  settings?: PlatformSettings;
  artistContacts?: Map<string, string>;
}) {
  if (forArtist) bookings = bookings.filter((b) => b.status !== "awaiting_token");
  if (bookings.length === 0) {
    return (
      <div className="mt-4 rounded-3xl border border-dashed border-cream-300 bg-white py-12 text-center">
        <p className="text-ink-500">
          {forArtist
            ? "No booking requests have come in yet."
            : "No bookings yet — book your first mehandi!"}
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
        <li key={b.id} className="rounded-[22px] border border-cream-300 bg-white p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold text-ink-900">
                {forArtist ? b.customerName : b.artistName}
              </p>
              <p className="text-sm text-ink-500">
                {formatEventDate(b.eventDate)} — {b.eventType}
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-medium ${STATUS_STYLES[b.status] ?? "bg-cream-200 text-ink-700"}`}>
              {STATUS_LABEL[b.status]}
            </span>
          </div>

          {b.items.length > 0 && (
            <p className="mt-2 text-[15px] text-ink-700">
              {b.items.map((i) => `${i.name} × ${i.qty}`).join(", ")}
            </p>
          )}

          <div className="mt-2 space-y-1.5 text-[15px] text-ink-700">
            {forArtist && contactUnlocked(b.status) ? (
              <>
                <p className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-rani-700" />
                  <a href={`tel:${b.phone}`} className="font-medium text-rani-700">{b.phone}</a>
                  <a
                    href={`https://wa.me/91${b.phone.replace(/\D/g, "").slice(-10)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-sm font-medium text-leaf-700"
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </p>
                <p className="text-ink-500">{b.address}, {b.city}</p>
              </>
            ) : forArtist ? (
              <p className="flex items-start gap-2 text-sm text-ink-500">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" /> {b.city} — the customer&apos;s phone and address unlock when you accept.
              </p>
            ) : (
              <ArtistContact b={b} whatsapp={artistContacts?.get(b.artistId) ?? ""} />
            )}
            {b.notes && <p className="text-ink-500">Note: {b.notes}</p>}
            {b.declineReason && (b.status === "declined" || b.status === "cancelled") && (
              <p className="text-ink-500">{b.declineReason}</p>
            )}
          </div>

          {!forArtist && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-cream-200 pt-3">
              <span className="text-sm text-ink-500">{b.bookingNumber}</span>
              <NextStep b={b} />
            </div>
          )}

          {forArtist && (
            <ArtistBookingPayments
              booking={b}
              adminUpi={settings?.upiId ?? ""}
              adminQr={settings?.upiQr ?? ""}
              responseHours={settings?.responseHours ?? 24}
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
          You&apos;re in demo mode
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Accounts (customer & artist login) unlock once Supabase is connected.
          Browsing and booking are still fully working!
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
          Log in to manage bookings — or your profile if you&apos;re an artist.
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

  // Contacts only come back for bookings the artist has already accepted.
  const artistContacts = await getMyBookingContacts(user.id);

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
              Profile is under review — you&apos;ll be approved within 24–48 hours.
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
      <section className="mt-10 scroll-mt-20" id="bookings">
        <h2 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink-900">
          <CalendarDays className="h-5 w-5 text-rani-700" /> My Bookings
        </h2>
        <BookingList bookings={myBookings} artistContacts={artistContacts} />
      </section>

      {!artist && (
        <div className="mt-10 rounded-3xl border border-cream-300 bg-white p-6 text-center">
          <p className="font-display text-xl font-semibold text-ink-900">
            Are you a mehandi artist?
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Create a free profile and get bookings from your city.
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
