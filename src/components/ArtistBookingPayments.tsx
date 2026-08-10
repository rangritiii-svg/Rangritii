"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BadgeCheck, IndianRupee } from "lucide-react";
import {
  artistCommissionUtrAction,
  artistRecordCashAction,
  artistSetAmountAction,
  artistVerifyPaymentAction,
} from "@/app/(store)/account/actions";
import { formatINR } from "@/lib/format";
import type { Booking } from "@/lib/types";

const chip = "rounded-full px-2.5 py-1 text-xs font-bold";

export function ArtistBookingPayments({
  booking,
  adminUpi,
  adminQr,
}: {
  booking: Booking;
  adminUpi: string;
  adminQr: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(booking.amount ? String(booking.amount) : "");
  const [utr, setUtr] = useState("");
  const [showAdminQr, setShowAdminQr] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok && "error" in result) setError(result.error ?? "Failed");
      router.refresh();
    });
  }

  const commissionDue =
    booking.paymentStatus === "verified" &&
    booking.paymentMethod !== "upi_admin" &&
    booking.settlementStatus !== "settled";

  return (
    <div className="mt-3 rounded-2xl border border-marigold-200 bg-marigold-50/40 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-500">
        <IndianRupee className="h-3.5 w-3.5 text-rani-700" /> Payment
      </p>

      {/* Amount */}
      {booking.paymentStatus !== "verified" && booking.status !== "cancelled" && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="1"
            placeholder="Final amount ₹"
            className="w-36 rounded-full border border-cream-300 bg-white px-4 py-2 text-sm outline-none focus:border-rani-400"
            aria-label="Final amount"
          />
          <button
            onClick={() => run(() => artistSetAmountAction(booking.id, Number(amount)))}
            disabled={pending || !amount}
            className="rounded-full bg-rani-700 px-4 py-2 text-xs font-bold text-white hover:bg-rani-800 disabled:opacity-50"
          >
            {booking.amount === null ? "Amount set karo (confirm hoga)" : "Update amount"}
          </button>
        </div>
      )}

      {booking.amount !== null && (
        <p className="mt-2 text-sm text-ink-700">
          Amount: <strong>{formatINR(booking.amount)}</strong>
          {booking.commissionAmount !== null && (
            <span className="ml-2 text-xs text-ink-500">
              (platform commission: {formatINR(booking.commissionAmount)})
            </span>
          )}
        </p>
      )}

      {/* Customer payment state */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {booking.paymentStatus === "unpaid" && booking.amount !== null && (
          <>
            <span className={`${chip} bg-cream-200 text-ink-700`}>Customer ne abhi pay nahi kiya</span>
            <button
              onClick={() => run(() => artistRecordCashAction(booking.id))}
              disabled={pending}
              className="rounded-full border border-cream-300 bg-white px-4 py-2 text-xs font-bold text-ink-700 hover:border-rani-300 disabled:opacity-50"
            >
              Cash mila — record karo
            </button>
          </>
        )}
        {booking.paymentStatus === "claimed" && (
          <>
            <span className={`${chip} bg-blue-100 text-blue-800`}>
              Customer says PAID ({booking.paymentMethod === "upi_admin" ? "admin ko" : "aapko"})
              {booking.paymentUtr && ` · UTR: ${booking.paymentUtr}`}
            </span>
            {booking.paymentMethod === "upi_artist" && (
              <button
                onClick={() => run(() => artistVerifyPaymentAction(booking.id))}
                disabled={pending}
                className="inline-flex items-center gap-1 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
              >
                <BadgeCheck className="h-3.5 w-3.5" /> Payment mili — verify
              </button>
            )}
          </>
        )}
        {booking.paymentStatus === "verified" && (
          <span className={`${chip} bg-green-100 text-green-800`}>Payment verified ✓</span>
        )}
      </div>

      {/* Commission due to admin */}
      {commissionDue && (
        <div className="mt-3 border-t border-marigold-200 pt-3 text-sm">
          <p className="font-semibold text-ink-900">
            Platform commission due:{" "}
            <span className="text-rani-800">
              {booking.commissionAmount !== null ? formatINR(booking.commissionAmount) : "—"}
            </span>
          </p>
          {booking.settlementStatus === "claimed" ? (
            <span className={`${chip} mt-2 inline-block bg-blue-100 text-blue-800`}>
              Aapne UTR bhej diya ({booking.settlementUtr}) — admin verify karega
            </span>
          ) : (
            <div className="mt-2 space-y-3">
              <button
                onClick={() => setShowAdminQr((v) => !v)}
                className="rounded-full border border-cream-300 bg-white px-4 py-2 text-xs font-bold text-ink-700 hover:border-rani-300"
              >
                {showAdminQr ? "Hide" : "Show"} admin UPI/QR
              </button>
              {showAdminQr && (
                <div className="flex items-center gap-4 rounded-xl border border-cream-300 bg-white p-3">
                  {adminQr && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={adminQr} alt="Admin UPI QR" className="h-28 w-28 rounded-lg object-contain" />
                  )}
                  <div>
                    <p className="text-xs text-ink-500">Admin UPI</p>
                    <p className="font-bold text-ink-900">{adminUpi || "Admin ne UPI set nahi kiya"}</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Commission payment ka UTR"
                  className="w-52 rounded-full border border-cream-300 bg-white px-4 py-2 text-xs outline-none focus:border-rani-400"
                />
                <button
                  onClick={() => run(() => artistCommissionUtrAction(booking.id, utr))}
                  disabled={pending || !utr}
                  className="rounded-full bg-rani-700 px-4 py-2 text-xs font-bold text-white hover:bg-rani-800 disabled:opacity-50"
                >
                  Commission pay kar diya
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payout expected from admin */}
      {booking.paymentStatus === "verified" && booking.paymentMethod === "upi_admin" && (
        <p className="mt-2 text-xs text-ink-500">
          {booking.settlementStatus === "settled"
            ? `Admin ne aapka payout bhej diya ✓${booking.settlementUtr ? ` (UTR: ${booking.settlementUtr})` : ""}`
            : `Customer ne admin ko pay kiya — admin aapko ${
                booking.amount !== null && booking.commissionAmount !== null
                  ? formatINR(booking.amount - booking.commissionAmount)
                  : "payout"
              } bhejega.`}
        </p>
      )}

      {error && <p className="mt-2 text-xs font-medium text-rani-700">{error}</p>}
    </div>
  );
}
