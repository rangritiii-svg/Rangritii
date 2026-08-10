import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "Booking Requested" };

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; artist?: string; wa?: string }>;
}) {
  const params = await searchParams;
  const bookingNumber = params.number ?? "";
  const artistName = params.artist ?? "";
  const whatsapp = (params.wa ?? "").replace(/\D/g, "");

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-6 font-display text-4xl font-semibold text-ink-900">
        Booking request bhej di! 🎉
      </h1>
      <p className="mt-3 text-ink-500">
        {artistName ? `${artistName} ko aapki request mil gayi hai.` : "Artist ko aapki request mil gayi hai."}{" "}
        Confirmation ke liye artist aapko call/WhatsApp karegi.
      </p>

      <div className="mt-8 rounded-3xl border border-cream-300 bg-white p-6">
        <dl className="space-y-3 text-sm">
          {bookingNumber && (
            <div className="flex justify-between">
              <dt className="text-ink-500">Booking number</dt>
              <dd className="font-bold text-ink-900">{bookingNumber}</dd>
            </div>
          )}
          {artistName && (
            <div className="flex justify-between">
              <dt className="text-ink-500">Artist</dt>
              <dd className="font-semibold text-ink-900">{artistName}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-500">Payment</dt>
            <dd className="font-semibold text-ink-900">Service ke baad, seedha artist ko</dd>
          </div>
        </dl>
        <p className="mt-5 rounded-xl bg-cream-100 px-4 py-3 text-xs leading-relaxed text-ink-500">
          Booking number save kar lo. Koi dikkat ho toh humein WhatsApp karo: {SITE.phone}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {bookingNumber && (
          <Link
            href={`/pay?number=${encodeURIComponent(bookingNumber)}`}
            className="inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-7 py-3.5 text-sm font-bold text-rani-700 hover:bg-rani-50"
          >
            💳 Payment Karo
          </Link>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(
              `Hi${artistName ? ` ${artistName}` : ""}! Maine Rangritii par booking request bheji hai (${bookingNumber}). Please confirm kar dijiye.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp Artist
          </a>
        )}
        <Link
          href="/artists"
          className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
        >
          Browse More Artists <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
