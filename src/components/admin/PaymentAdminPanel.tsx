"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { BadgeCheck, IndianRupee } from "lucide-react";
import { markSettledAction, setAmountAction, verifyPaymentAction } from "@/app/admin/actions";
import { formatINR } from "@/lib/format";
import type { Booking } from "@/lib/types";

const chip = "rounded-full px-2.5 py-1 text-xs font-bold";

const PAY_LABEL: Record<string, string> = {
  upi_admin: "UPI → Admin",
  upi_artist: "UPI → Artist",
  cash: "Cash → Artist",
};

export function PaymentAdminPanel({
  booking,
  artistUpi,
  artistQr,
}: {
  booking: Booking;
  artistUpi: string;
  artistQr: string;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(booking.amount ? String(booking.amount) : "");
  const [utr, setUtr] = useState("");
  const [error, setError] = useState("");
  const [showPayout, setShowPayout] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError("");
    startTransition(async () => {
      const result = await action();
      if (!result.ok && "error" in result) setError(result.error ?? "Failed");
      router.refresh();
    });
  }

  const paidToAdmin = booking.paymentMethod === "upi_admin";
  const payout =
    booking.amount !== null && booking.commissionAmount !== null
      ? booking.amount - booking.commissionAmount
      : null;

  return (
    <div className="mt-4 rounded-2xl border border-marigold-200 bg-marigold-50/40 p-4">
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink-500">
        <IndianRupee className="h-3.5 w-3.5 text-rani-700" /> Payment
      </p>

      {/* Amount */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {booking.paymentStatus === "verified" ? (
          <span className="text-sm font-bold text-ink-900">
            Amount: {booking.amount !== null ? formatINR(booking.amount) : "—"}
          </span>
        ) : (
          <>
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
              onClick={() => run(() => setAmountAction(booking.id, Number(amount)))}
              disabled={pending || !amount}
              className="rounded-full bg-rani-700 px-4 py-2 text-xs font-bold text-white hover:bg-rani-800 disabled:opacity-50"
            >
              {booking.amount === null ? "Set amount" : "Update amount"}
            </button>
          </>
        )}
        {booking.commissionAmount !== null && (
          <span className={`${chip} bg-cream-200 text-ink-700`}>
            Commission: {formatINR(booking.commissionAmount)}
          </span>
        )}
      </div>

      {/* Customer payment status */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`${chip} ${
            booking.paymentStatus === "verified"
              ? "bg-green-100 text-green-800"
              : booking.paymentStatus === "claimed"
                ? "bg-blue-100 text-blue-800"
                : "bg-cream-200 text-ink-700"
          }`}
        >
          {booking.paymentStatus === "unpaid" && "Customer: not paid yet"}
          {booking.paymentStatus === "claimed" && "Customer says PAID — verify karo"}
          {booking.paymentStatus === "verified" && "Payment verified"}
        </span>
        {booking.paymentMethod && (
          <span className={`${chip} bg-cream-200 text-ink-700`}>
            {PAY_LABEL[booking.paymentMethod]}
          </span>
        )}
        {booking.paymentUtr && (
          <span className="text-xs text-ink-500">UTR: {booking.paymentUtr}</span>
        )}
        {booking.paymentStatus === "claimed" && (
          <button
            onClick={() => run(() => verifyPaymentAction(booking.id))}
            disabled={pending}
            className="inline-flex items-center gap-1 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
          >
            <BadgeCheck className="h-3.5 w-3.5" /> Payment mili — verify
          </button>
        )}
      </div>

      {/* Settlement */}
      {booking.settlementStatus !== "na" && (
        <div className="mt-3 border-t border-marigold-200 pt-3">
          {paidToAdmin ? (
            <div className="text-sm">
              <p className="font-semibold text-ink-900">
                Artist ko payout dena hai:{" "}
                <span className="text-rani-800">{payout !== null ? formatINR(payout) : "—"}</span>{" "}
                <span className="text-xs text-ink-500">(amount − commission)</span>
              </p>
              {booking.settlementStatus !== "settled" ? (
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {(artistUpi || artistQr) && (
                    <button
                      onClick={() => setShowPayout((v) => !v)}
                      className="rounded-full border border-cream-300 bg-white px-4 py-2 text-xs font-bold text-ink-700 hover:border-rani-300"
                    >
                      {showPayout ? "Hide" : "Show"} artist UPI/QR
                    </button>
                  )}
                  <input
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Payout UTR (optional)"
                    className="w-44 rounded-full border border-cream-300 bg-white px-4 py-2 text-xs outline-none focus:border-rani-400"
                  />
                  <button
                    onClick={() => run(() => markSettledAction(booking.id, utr))}
                    disabled={pending}
                    className="rounded-full bg-rani-700 px-4 py-2 text-xs font-bold text-white hover:bg-rani-800 disabled:opacity-50"
                  >
                    Payout done — settle
                  </button>
                </div>
              ) : (
                <span className={`${chip} mt-2 inline-block bg-green-100 text-green-800`}>
                  Settled ✓ {booking.settlementUtr && `· UTR: ${booking.settlementUtr}`}
                </span>
              )}
              {showPayout && (
                <div className="mt-3 flex items-center gap-4 rounded-xl border border-cream-300 bg-white p-3">
                  {artistQr && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={artistQr} alt="Artist UPI QR" className="h-28 w-28 rounded-lg object-contain" />
                  )}
                  <div className="text-sm">
                    <p className="text-xs text-ink-500">Artist UPI</p>
                    <p className="font-bold text-ink-900">{artistUpi || "UPI ID nahi diya"}</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm">
              <p className="font-semibold text-ink-900">
                Artist se commission lena hai:{" "}
                <span className="text-rani-800">
                  {booking.commissionAmount !== null ? formatINR(booking.commissionAmount) : "—"}
                </span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {booking.settlementStatus === "pending" && (
                  <span className={`${chip} bg-marigold-100 text-marigold-800`}>
                    Artist ne abhi pay nahi kiya
                  </span>
                )}
                {booking.settlementStatus === "claimed" && (
                  <>
                    <span className={`${chip} bg-blue-100 text-blue-800`}>
                      Artist says PAID · UTR: {booking.settlementUtr || "—"}
                    </span>
                    <button
                      onClick={() => run(() => markSettledAction(booking.id, ""))}
                      disabled={pending}
                      className="inline-flex items-center gap-1 rounded-full bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      <BadgeCheck className="h-3.5 w-3.5" /> Commission mila — settle
                    </button>
                  </>
                )}
                {booking.settlementStatus === "settled" && (
                  <span className={`${chip} bg-green-100 text-green-800`}>
                    Commission received ✓ {booking.settlementUtr && `· UTR: ${booking.settlementUtr}`}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-2 text-xs font-medium text-rani-700">{error}</p>}
    </div>
  );
}
