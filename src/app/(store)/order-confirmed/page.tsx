import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SITE } from "@/lib/config";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = { title: "Order Confirmed" };

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ number?: string; total?: string }>;
}) {
  const params = await searchParams;
  const orderNumber = params.number ?? "";
  const total = Number(params.total ?? 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
      <h1 className="mt-6 font-display text-4xl font-semibold text-ink-900">
        Shukriya! Order placed 🎉
      </h1>
      <p className="mt-3 text-ink-500">
        Your order has been received. We will confirm it on WhatsApp/call shortly and ship it
        with love.
      </p>

      <div className="mt-8 rounded-3xl border border-cream-300 bg-white p-6">
        <dl className="space-y-3 text-sm">
          {orderNumber && (
            <div className="flex justify-between">
              <dt className="text-ink-500">Order number</dt>
              <dd className="font-bold text-ink-900">{orderNumber}</dd>
            </div>
          )}
          {total > 0 && (
            <div className="flex justify-between">
              <dt className="text-ink-500">Amount payable (COD)</dt>
              <dd className="font-bold text-rani-800">{formatINR(total)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-ink-500">Payment method</dt>
            <dd className="font-semibold text-ink-900">Cash on Delivery</dd>
          </div>
        </dl>
        <p className="mt-5 rounded-xl bg-cream-100 px-4 py-3 text-xs leading-relaxed text-ink-500">
          Save your order number for tracking. Questions? WhatsApp us at {SITE.phone} —
          we reply fast.
        </p>
      </div>

      <Link
        href="/shop"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
      >
        Continue Shopping <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
