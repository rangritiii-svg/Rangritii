"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  IndianRupee,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { formatEventDate, formatINR } from "@/lib/format";
import type { PaymentInfo } from "@/lib/bookings";
import { lookupBooking, submitPaymentClaim } from "./actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

function QrCard({
  title,
  subtitle,
  upi,
  qr,
  selected,
  onSelect,
}: {
  title: string;
  subtitle: string;
  upi: string;
  qr: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex-1 rounded-2xl border-2 p-5 text-left transition ${
        selected ? "border-rani-700 bg-rani-50" : "border-cream-300 bg-white hover:border-rani-300"
      }`}
    >
      <p className="text-sm font-bold text-ink-900">{title}</p>
      <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>
      {qr && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={qr} alt={`${title} QR code`} className="mx-auto mt-3 h-40 w-40 rounded-xl object-contain" />
      )}
      <p className="mt-3 rounded-lg bg-cream-100 px-3 py-2 text-center text-sm font-bold text-ink-900">
        {upi || "UPI ID not available"}
      </p>
    </button>
  );
}

function PayInner() {
  const searchParams = useSearchParams();
  const [number, setNumber] = useState(searchParams.get("number") ?? "");
  const [phone, setPhone] = useState("");
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [method, setMethod] = useState<"upi_admin" | "upi_artist" | null>(null);
  const [utr, setUtr] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function lookup() {
    setError("");
    startTransition(async () => {
      const result = await lookupBooking(number, phone);
      if (result.ok) {
        setInfo(result.info);
        // sensible default: pay the artist if their UPI exists, else admin
        setMethod(result.info.artistUpi || result.info.artistQr ? "upi_artist" : "upi_admin");
      } else {
        setError(result.error);
      }
    });
  }

  function claim() {
    if (!info || !method) return;
    setError("");
    startTransition(async () => {
      const result = await submitPaymentClaim(info.bookingNumber, phone, method, utr);
      if (result.ok) setClaimed(true);
      else setError(result.error);
    });
  }

  if (claimed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink-900">
          Payment noted! ✅
        </h1>
        <p className="mt-3 text-ink-500">
          Your UTR has been recorded. The {method === "upi_admin" ? "team" : "artist"} will
          verify it as soon as the payment arrives — then your booking is locked in.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="flex items-center gap-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
        <IndianRupee className="h-8 w-8 text-rani-700" /> Booking Payment
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Enter your booking number and the same mobile number you used while booking.
      </p>

      <div className="mt-6 rounded-3xl border border-cream-300 bg-white p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="pay-number">
              Booking number
            </label>
            <input
              id="pay-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className={field}
              placeholder="RB-XXXXXXXX"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="pay-phone">
              Mobile number
            </label>
            <input
              id="pay-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className={field}
              placeholder="98765 43210"
            />
          </div>
        </div>
        <button
          onClick={lookup}
          disabled={pending}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          <Search className="h-4 w-4" /> {pending && !info ? "Searching…" : "Find My Booking"}
        </button>
      </div>

      {info && (
        <div className="mt-6 space-y-5">
          <div className="rounded-3xl border border-cream-300 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-ink-900">{info.bookingNumber}</p>
                <p className="text-xs text-ink-500">
                  {info.artistName} · {info.eventDate ? formatEventDate(info.eventDate) : ""}
                </p>
              </div>
              {info.paymentStatus === "verified" ? (
                <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-bold text-green-800">
                  Payment verified ✓
                </span>
              ) : info.amount !== null ? (
                <span className="font-display text-2xl font-bold text-rani-800">
                  {formatINR(info.amount)}
                </span>
              ) : (
                <span className="rounded-full bg-marigold-100 px-3 py-1.5 text-xs font-bold text-marigold-800">
                  Amount not confirmed yet
                </span>
              )}
            </div>
          </div>

          {info.artistWhatsapp && (
            <a
              href={`https://wa.me/${info.artistWhatsapp}?text=${encodeURIComponent(
                `Hi ${info.artistName}! This is regarding my confirmed booking ${info.bookingNumber} on Rangritii.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#25d366] bg-white px-6 py-3.5 text-sm font-bold text-[#1da851] transition hover:bg-[#25d366]/10"
            >
              <MessageCircle className="h-4 w-4" /> Contact {info.artistName} on WhatsApp
            </a>
          )}

          {info.paymentStatus !== "verified" && info.amount !== null && (
            <>
              <div>
                <p className="text-sm font-bold text-ink-900">
                  Where would you like to pay? (both work)
                </p>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                  {(info.artistUpi || info.artistQr) && (
                    <QrCard
                      title={`Pay ${info.artistName}`}
                      subtitle="Straight to the artist's UPI"
                      upi={info.artistUpi}
                      qr={info.artistQr}
                      selected={method === "upi_artist"}
                      onSelect={() => setMethod("upi_artist")}
                    />
                  )}
                  {(info.adminUpi || info.adminQr) && (
                    <QrCard
                      title="Pay Rangritii"
                      subtitle="To the platform's UPI (the artist gets paid out)"
                      upi={info.adminUpi}
                      qr={info.adminQr}
                      selected={method === "upi_admin"}
                      onSelect={() => setMethod("upi_admin")}
                    />
                  )}
                </div>
                {!info.artistUpi && !info.artistQr && !info.adminUpi && !info.adminQr && (
                  <p className="mt-3 rounded-xl border border-marigold-200 bg-marigold-50 px-4 py-3 text-sm text-marigold-800">
                    Payment details aren&apos;t set up yet — please try again in a bit or
                    reach us on WhatsApp.
                  </p>
                )}
              </div>

              {method && (
                <div className="rounded-3xl border border-cream-300 bg-white p-6">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
                    <ShieldCheck className="h-4 w-4 text-rani-700" />
                    After paying, enter your UTR/transaction ID here
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    You&apos;ll find the 12-digit UTR number in your UPI app&apos;s payment details.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      className="w-64 rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none focus:border-rani-400"
                      placeholder="UTR / reference number"
                    />
                    <button
                      onClick={claim}
                      disabled={pending || utr.trim().length < 4}
                      className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800 disabled:opacity-50"
                    >
                      <BadgeCheck className="h-4 w-4" /> I&apos;ve paid
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {info.paymentStatus === "claimed" && (
            <p className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Your payment claim is recorded — verification is pending. Please don&apos;t
              pay again by mistake!
            </p>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-ink-500">Loading…</div>}>
      <PayInner />
    </Suspense>
  );
}
