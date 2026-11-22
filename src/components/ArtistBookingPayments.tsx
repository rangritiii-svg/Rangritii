"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BadgeCheck, Check, Clock, X } from "lucide-react";
import {
  artistCommissionUtrAction,
  artistRecordCashAction,
  artistRespondAction,
  artistSetAmountAction,
} from "@/app/(store)/account/actions";
import { formatINR } from "@/lib/format";
import { balanceDue, netToArtist, type Booking } from "@/lib/types";

const btn = "rounded-full px-4 py-2.5 text-[15px] font-semibold disabled:opacity-50";

function timeLeft(sentAt: string | null, hours: number): string {
  if (!sentAt) return "";
  const ms = new Date(sentAt).getTime() + hours * 3600 * 1000 - Date.now();
  if (ms <= 0) return "Time is up";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} h ${m} min left to answer` : `${m} min left to answer`;
}

/** Everything an artist does on one booking: answer it, adjust the total, record cash, settle. */
export function ArtistBookingPayments({
  booking: b,
  adminUpi,
  adminQr,
  responseHours,
}: {
  booking: Booking;
  adminUpi: string;
  adminQr: string;
  responseHours: number;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(b.amount ? String(b.amount) : "");
  const [editAmount, setEditAmount] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [reason, setReason] = useState("");
  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok) setError(result.error ?? "Failed");
      router.refresh();
    });
  }

  const balance = balanceDue(b);
  const net = netToArtist(b);
  const open = b.status === "confirmed" || b.status === "completed";

  return (
    <div className="mt-4 space-y-3 border-t border-cream-200 pt-4">
      {/* money summary */}
      <dl className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-xl bg-cream-100 p-2">
          <dt className="text-ink-500">Total</dt>
          <dd className="text-[16px] font-semibold text-ink-900">{b.amount !== null ? formatINR(b.amount) : "—"}</dd>
        </div>
        <div className="rounded-xl bg-stain-50 p-2">
          <dt className="text-ink-500">Token paid</dt>
          <dd className="text-[16px] font-semibold text-stain-700">{formatINR(b.tokenStatus === "verified" ? b.tokenAmount : 0)}</dd>
        </div>
        <div className="rounded-xl bg-cream-100 p-2">
          <dt className="text-ink-500">Balance</dt>
          <dd className="text-[16px] font-semibold text-ink-900">{balance !== null ? formatINR(balance) : "—"}</dd>
        </div>
      </dl>

      {/* answer the request */}
      {b.status === "pending" && (
        <div className="rounded-2xl border border-marigold-200 bg-marigold-50 p-4">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-marigold-900">
            <Clock className="h-4 w-4" /> New request — {timeLeft(b.sentToArtistAt, responseHours)}
          </p>
          <p className="mt-1 text-sm text-marigold-900/80">
            The customer has paid the token. Accept to unlock each other&apos;s contact details.
          </p>
          {!declining ? (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => run(() => artistRespondAction(b.id, true, ""))}
                disabled={pending}
                className={`${btn} inline-flex flex-1 items-center justify-center gap-1.5 bg-leaf-700 text-white`}
              >
                <Check className="h-4 w-4" /> Accept
              </button>
              <button onClick={() => setDeclining(true)} disabled={pending} className={`${btn} flex-1 border border-cream-300 bg-white text-ink-700`}>
                Decline
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (e.g. already booked that day)"
                className="w-full rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-[15px] outline-none focus:border-rani-400"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => run(() => artistRespondAction(b.id, false, reason))}
                  disabled={pending}
                  className={`${btn} inline-flex flex-1 items-center justify-center gap-1.5 bg-rani-700 text-white`}
                >
                  <X className="h-4 w-4" /> Decline request
                </button>
                <button onClick={() => setDeclining(false)} className={`${btn} border border-cream-300 bg-white text-ink-700`}>
                  Back
                </button>
              </div>
              <p className="text-sm text-ink-500">The customer&apos;s token is refunded by Rangritii.</p>
            </div>
          )}
        </div>
      )}

      {/* revise total */}
      {(b.status === "pending" || open) && b.paymentStatus === "unpaid" && (
        <div>
          {!editAmount ? (
            <button onClick={() => setEditAmount(true)} className="text-sm font-medium text-rani-700 underline">
              Change the total (e.g. more guests on the day)
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                inputMode="numeric"
                min={b.tokenAmount}
                className="w-36 rounded-full border border-cream-300 bg-white px-4 py-2 text-[15px] outline-none focus:border-rani-400"
                aria-label="New total"
              />
              <button
                onClick={() => run(async () => { const r = await artistSetAmountAction(b.id, Number(amount)); if (r.ok) setEditAmount(false); return r; })}
                disabled={pending || !amount}
                className={`${btn} bg-rani-700 text-white`}
              >
                Save total
              </button>
            </div>
          )}
        </div>
      )}

      {/* balance payment */}
      {open && b.paymentStatus === "unpaid" && b.amount !== null && (
        <button
          onClick={() => run(() => artistRecordCashAction(b.id))}
          disabled={pending}
          className={`${btn} w-full border border-cream-300 bg-white text-ink-700`}
        >
          I received {balance !== null ? formatINR(balance) : "the balance"} in cash
        </button>
      )}
      {b.paymentStatus === "claimed" && b.paymentMethod === "cash" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[15px] text-ink-700">Customer says she paid the balance in cash.</span>
          <button
            onClick={() => run(() => artistRecordCashAction(b.id))}
            disabled={pending}
            className={`${btn} inline-flex items-center gap-1.5 bg-leaf-700 text-white`}
          >
            <BadgeCheck className="h-4 w-4" /> Yes, cash received
          </button>
        </div>
      )}
      {b.paymentStatus === "claimed" && b.paymentMethod === "upi_admin" && (
        <p className="text-[15px] text-ink-700">Customer paid the balance to Rangritii — the admin is verifying it.</p>
      )}

      {/* settlement */}
      {b.paymentStatus === "verified" && net !== null && (
        <div className="rounded-2xl border border-cream-300 bg-cream-100 p-4 text-[15px]">
          {b.settlementStatus === "settled" ? (
            <p className="font-medium text-leaf-700">All settled{b.settlementUtr ? ` (UTR ${b.settlementUtr})` : ""}.</p>
          ) : net > 0 ? (
            <p>Rangritii will send you <strong>{formatINR(net)}</strong> (your earnings after commission).</p>
          ) : (
            <div className="space-y-2">
              <p>
                You collected the balance, so you owe Rangritii <strong>{formatINR(-net)}</strong> (commission minus the token we hold).
              </p>
              {b.settlementStatus === "claimed" ? (
                <p className="text-ink-500">You sent UTR {b.settlementUtr} — the admin will confirm it.</p>
              ) : (
                <>
                  {(adminQr || adminUpi) && (
                    <div className="flex items-center gap-3 rounded-xl bg-white p-3">
                      {adminQr && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={adminQr} alt="Rangritii UPI QR" className="h-24 w-24 rounded-lg object-contain" />
                      )}
                      <p className="font-semibold">{adminUpi}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <input
                      value={utr}
                      onChange={(e) => setUtr(e.target.value)}
                      placeholder="UTR of your payment"
                      inputMode="numeric"
                      className="w-52 rounded-full border border-cream-300 bg-white px-4 py-2 text-[15px] outline-none focus:border-rani-400"
                    />
                    <button
                      onClick={() => run(() => artistCommissionUtrAction(b.id, utr))}
                      disabled={pending || utr.trim().length < 6}
                      className={`${btn} bg-rani-700 text-white`}
                    >
                      I&apos;ve paid
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {error && <p role="alert" className="text-sm font-medium text-rani-700">{error}</p>}
    </div>
  );
}
