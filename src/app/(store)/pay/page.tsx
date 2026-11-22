"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState, useTransition } from "react";
import { Banknote, CheckCircle2, Clock, Lock, MessageCircle, Phone, RotateCcw, Smartphone } from "lucide-react";
import { PAY_PHONE_KEY } from "@/components/BookingForm";
import { formatEventDate, formatINR } from "@/lib/format";
import type { PaymentInfo } from "@/lib/bookings";
import { STATUS_LABEL, type CustomerPaymentMethod } from "@/lib/types";
import { lookupBooking, submitPaymentClaim, submitTokenClaim } from "./actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-[16px] outline-none transition focus:border-rani-400";
const primary =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-rani-700 px-6 py-3.5 text-[16px] font-semibold text-white active:bg-rani-800 disabled:opacity-50";

function upiLink(upi: string, amount: number, note: string) {
  const sp = new URLSearchParams({ pa: upi, pn: "Rangritii", am: String(amount), cu: "INR", tn: note });
  return `upi://pay?${sp.toString()}`;
}

/** UPI QR + "open UPI app" + UTR box — used for both the token and the balance. */
function UpiPay({
  info,
  amount,
  note,
  utr,
  setUtr,
  onSubmit,
  pending,
  cta,
}: {
  info: PaymentInfo;
  amount: number;
  note: string;
  utr: string;
  setUtr: (v: string) => void;
  onSubmit: () => void;
  pending: boolean;
  cta: string;
}) {
  if (!info.adminUpi && !info.adminQr) {
    return (
      <p className="rounded-xl border border-marigold-200 bg-marigold-50 px-4 py-3 text-[15px] text-marigold-800">
        Rangritii&apos;s UPI details are not set up yet. Message us on WhatsApp to pay.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-cream-300 bg-white p-4 text-center">
        {info.adminQr && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={info.adminQr} alt="Rangritii UPI QR code" className="mx-auto h-48 w-48 rounded-xl object-contain" />
        )}
        {info.adminUpi && (
          <>
            <p className="mt-2 text-[15px] font-semibold text-ink-900">{info.adminUpi}</p>
            <a
              href={upiLink(info.adminUpi, amount, note)}
              className="mt-3 inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-5 py-2.5 text-[15px] font-semibold text-rani-700 lg:hidden"
            >
              <Smartphone className="h-4 w-4" /> Pay {formatINR(amount)} in a UPI app
            </a>
          </>
        )}
      </div>
      <div>
        <label htmlFor="utr" className="mb-1.5 block text-sm font-medium text-ink-700">
          UTR / UPI reference number
        </label>
        <input
          id="utr"
          value={utr}
          onChange={(e) => setUtr(e.target.value)}
          inputMode="numeric"
          className={field}
          placeholder="12-digit number from your UPI app"
        />
        <p className="mt-1.5 text-sm text-ink-500">
          Find it under the payment details in GPay, PhonePe or Paytm after you pay.
        </p>
      </div>
      <button onClick={onSubmit} disabled={pending || utr.trim().length < 6} className={primary}>
        {pending ? "Sending…" : cta}
      </button>
    </div>
  );
}

function Breakdown({ info }: { info: PaymentInfo }) {
  const tokenPaid = info.tokenStatus === "verified";
  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-4">
      {info.items.length > 0 && (
        <ul className="space-y-1.5 text-[15px] text-ink-700">
          {info.items.map((l) => (
            <li key={l.packageId + l.name} className="flex justify-between gap-3">
              <span>{l.name} × {l.qty}</span>
              <span>{formatINR(l.price * l.qty)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className={`space-y-1.5 text-[15px] ${info.items.length ? "mt-3 border-t border-cream-200 pt-3" : ""}`}>
        {info.amount !== null && (
          <div className="flex justify-between font-semibold text-ink-900"><dt>Total</dt><dd>{formatINR(info.amount)}</dd></div>
        )}
        {info.tokenAmount > 0 && (
          <div className="flex justify-between text-stain-700">
            <dt>Token {tokenPaid ? "paid" : info.tokenStatus === "refunded" ? "refunded" : ""}</dt>
            <dd>{tokenPaid ? "− " : ""}{formatINR(info.tokenAmount)}</dd>
          </div>
        )}
        {info.balance !== null && contactOpen(info) && (
          <div className="flex justify-between text-ink-700">
            <dt>Balance after the mehandi</dt>
            <dd>{info.paymentStatus === "verified" ? "Paid" : formatINR(info.balance)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

const contactOpen = (i: PaymentInfo) => i.status === "confirmed" || i.status === "completed";

function Notice({ tone, icon: Icon, title, children }: {
  tone: "wait" | "good" | "bad";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children?: React.ReactNode;
}) {
  const tones = {
    wait: "border-marigold-200 bg-marigold-50 text-marigold-900",
    good: "border-leaf-100 bg-leaf-50 text-leaf-800",
    bad: "border-rani-200 bg-rani-50 text-rani-900",
  };
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${tones[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="text-[16px] font-semibold">{title}</p>
        {children && <div className="mt-1 text-[15px] opacity-90">{children}</div>}
      </div>
    </div>
  );
}

function PayInner() {
  const searchParams = useSearchParams();
  const [number, setNumber] = useState(searchParams.get("number") ?? "");
  const [phone, setPhone] = useState("");
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [method, setMethod] = useState<CustomerPaymentMethod>("upi_admin");
  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const lookup = useCallback(
    (num = number, ph = phone) => {
      setError("");
      startTransition(async () => {
        const result = await lookupBooking(num, ph);
        if (result.ok) setInfo(result.info);
        else setError(result.error);
      });
    },
    [number, phone]
  );

  // Coming straight from the booking form: phone is remembered for this tab.
  useEffect(() => {
    let saved = "";
    try {
      saved = sessionStorage.getItem(PAY_PHONE_KEY) ?? "";
    } catch {
      /* ignore */
    }
    const num = searchParams.get("number") ?? "";
    if (saved) {
      setPhone(saved);
      if (num) lookup(num, saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function sendToken() {
    if (!info) return;
    setError("");
    startTransition(async () => {
      const r = await submitTokenClaim(info.bookingNumber, phone, utr);
      if (!r.ok) return setError(r.error);
      setUtr("");
      const again = await lookupBooking(info.bookingNumber, phone);
      if (again.ok) setInfo(again.info);
    });
  }

  function sendBalance() {
    if (!info) return;
    setError("");
    startTransition(async () => {
      const r = await submitPaymentClaim(info.bookingNumber, phone, method, method === "cash" ? "" : utr);
      if (!r.ok) return setError(r.error);
      setUtr("");
      const again = await lookupBooking(info.bookingNumber, phone);
      if (again.ok) setInfo(again.info);
    });
  }

  if (!info) {
    return (
      <div className="mx-auto max-w-md px-4 pb-12 pt-6">
        <h1 className="font-display text-[30px] text-ink-900">Your booking</h1>
        <p className="mt-1 text-[15px] text-ink-500">
          Enter the booking number and the mobile number you booked with.
        </p>
        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            lookup();
          }}
        >
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700" htmlFor="pay-number">Booking number</label>
            <input id="pay-number" value={number} onChange={(e) => setNumber(e.target.value)} className={field} placeholder="RB-XXXXXXXX" autoCapitalize="characters" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700" htmlFor="pay-phone">Mobile number</label>
            <input id="pay-phone" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="numeric" className={field} placeholder="98765 43210" />
          </div>
          <button type="submit" disabled={pending} className={primary}>
            {pending ? "Finding…" : "Find my booking"}
          </button>
        </form>
        {error && <p role="alert" className="mt-4 rounded-xl bg-rani-50 px-4 py-3 text-[15px] text-rani-800">{error}</p>}
      </div>
    );
  }

  const awaitingToken = info.status === "awaiting_token";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-12 pt-6">
      <div>
        <p className="text-sm text-ink-500">Booking {info.bookingNumber}</p>
        <h1 className="font-display text-[28px] leading-tight text-ink-900">{info.artistName}</h1>
        <p className="text-[15px] text-ink-700">
          {info.eventDate ? formatEventDate(info.eventDate) : ""}
          <span className="ml-2 rounded-full bg-cream-200 px-2.5 py-0.5 text-sm font-medium text-ink-700">
            {STATUS_LABEL[info.status]}
          </span>
        </p>
      </div>

      <Breakdown info={info} />

      {/* ── Step: token ── */}
      {awaitingToken && info.tokenStatus === "unpaid" && (
        <section className="space-y-3">
          <h2 className="text-[20px] font-semibold text-ink-900">Pay the {formatINR(info.tokenAmount)} token</h2>
          <p className="text-[15px] text-ink-500">
            Your request goes to {info.artistName.split(" ")[0]} as soon as we receive it. It&apos;s adjusted in your total,
            and refunded in full if she can&apos;t take the booking.
          </p>
          <UpiPay
            info={info}
            amount={info.tokenAmount}
            note={`Token ${info.bookingNumber}`}
            utr={utr}
            setUtr={setUtr}
            onSubmit={sendToken}
            pending={pending}
            cta={`I've paid ${formatINR(info.tokenAmount)}`}
          />
        </section>
      )}
      {awaitingToken && info.tokenStatus === "claimed" && (
        <Notice tone="wait" icon={Clock} title="We're checking your token payment">
          This usually takes a few hours. Then your request goes to {info.artistName.split(" ")[0]} and you&apos;ll see her answer here.
          Please don&apos;t pay again.
        </Notice>
      )}

      {info.status === "pending" && (
        <Notice tone="wait" icon={Clock} title={`Token received — waiting for ${info.artistName.split(" ")[0]}`}>
          She&apos;ll accept or decline soon. If she can&apos;t make it, your token is refunded in full.
        </Notice>
      )}

      {(info.status === "declined" || info.status === "cancelled") && (
        <Notice tone="bad" icon={RotateCcw} title={info.status === "declined" ? "The artist couldn't take this booking" : "This booking was cancelled"}>
          {info.declineReason && <p>{info.declineReason}.</p>}
          {info.tokenStatus === "refund_due" && <p>Your {formatINR(info.tokenAmount)} token will be refunded to the same UPI account.</p>}
          {info.tokenStatus === "refunded" && <p>Your {formatINR(info.tokenAmount)} token has been refunded.</p>}
          <a href="/artists" className="mt-2 inline-block font-semibold underline">Find another artist</a>
        </Notice>
      )}

      {/* ── Confirmed: contact + balance ── */}
      {contactOpen(info) && (
        <>
          <Notice tone="good" icon={CheckCircle2} title={`${info.artistName.split(" ")[0]} confirmed your booking`}>
            {info.artistWhatsapp ? (
              <span className="mt-2 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${info.artistWhatsapp}?text=${encodeURIComponent(`Hi ${info.artistName}! This is about my Rangritii booking ${info.bookingNumber}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[#25d366] px-4 py-2 text-[15px] font-semibold text-white"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <a href={`tel:+${info.artistWhatsapp}`} className="inline-flex items-center gap-2 rounded-full border border-leaf-600 px-4 py-2 text-[15px] font-semibold">
                  <Phone className="h-4 w-4" /> Call
                </a>
              </span>
            ) : (
              "She'll call you to plan the details."
            )}
          </Notice>

          {info.paymentStatus === "unpaid" && info.balance !== null && info.balance > 0 && (
            <section className="space-y-3">
              <h2 className="text-[20px] font-semibold text-ink-900">Pay the balance — {formatINR(info.balance)}</h2>
              <p className="text-[15px] text-ink-500">After the mehandi is done.</p>
              <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="How are you paying?">
                {(
                  [
                    { v: "upi_admin", t: "UPI", s: "To Rangritii", icon: Smartphone },
                    { v: "cash", t: "Cash", s: "To the artist", icon: Banknote },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.v}
                    type="button"
                    role="radio"
                    aria-checked={method === m.v}
                    onClick={() => setMethod(m.v)}
                    className={`flex items-center gap-3 rounded-2xl border-2 p-3 text-left ${
                      method === m.v ? "border-rani-700 bg-rani-50" : "border-cream-300 bg-white"
                    }`}
                  >
                    <m.icon className="h-6 w-6 text-rani-700" />
                    <span>
                      <span className="block text-[16px] font-semibold text-ink-900">{m.t}</span>
                      <span className="block text-sm text-ink-500">{m.s}</span>
                    </span>
                  </button>
                ))}
              </div>
              {method === "upi_admin" ? (
                <UpiPay
                  info={info}
                  amount={info.balance}
                  note={`Balance ${info.bookingNumber}`}
                  utr={utr}
                  setUtr={setUtr}
                  onSubmit={sendBalance}
                  pending={pending}
                  cta={`I've paid ${formatINR(info.balance)}`}
                />
              ) : (
                <button onClick={sendBalance} disabled={pending} className={primary}>
                  {pending ? "Saving…" : `I paid ${formatINR(info.balance)} in cash`}
                </button>
              )}
            </section>
          )}
          {info.paymentStatus === "unpaid" && info.balance === 0 && (
            <Notice tone="good" icon={CheckCircle2} title="Nothing left to pay — the token covered it" />
          )}
          {info.paymentStatus === "claimed" && (
            <Notice tone="wait" icon={Clock} title="Balance payment noted">
              {info.paymentMethod === "cash"
                ? "The artist will confirm the cash from her side."
                : "We'll verify it shortly. Please don't pay again."}
            </Notice>
          )}
          {info.paymentStatus === "verified" && (
            <Notice tone="good" icon={CheckCircle2} title="Fully paid — thank you!" />
          )}
        </>
      )}

      {!contactOpen(info) && (
        <p className="flex items-start gap-2 text-sm text-ink-500">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          The artist&apos;s phone and WhatsApp appear here once she accepts.
        </p>
      )}

      {error && <p role="alert" className="rounded-xl bg-rani-50 px-4 py-3 text-[15px] text-rani-800">{error}</p>}

      <button onClick={() => lookup(info.bookingNumber, phone)} disabled={pending} className="w-full py-2 text-[15px] font-medium text-rani-700">
        {pending ? "Refreshing…" : "Refresh status"}
      </button>
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
