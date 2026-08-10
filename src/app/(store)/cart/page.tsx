"use client";

import Link from "next/link";
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { SITE } from "@/lib/config";
import { formatINR } from "@/lib/format";

export default function CartPage() {
  const { items, ready, subtotal, setQuantity, removeItem } = useCart();
  const shipping = subtotal >= SITE.freeShippingAbove || subtotal === 0 ? 0 : SITE.shippingFee;
  const total = subtotal + shipping;
  const remaining = SITE.freeShippingAbove - subtotal;

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-ink-500">
        Loading your bag…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-ink-300" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">
          Aapka bag khaali hai
        </h1>
        <p className="mt-2 text-ink-500">Let&apos;s fix that — the good stuff is waiting.</p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
        >
          Start Shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
        Shopping Bag
      </h1>

      {remaining > 0 && (
        <div className="mt-5 rounded-2xl border border-marigold-200 bg-marigold-50 px-5 py-3.5 text-sm text-marigold-800">
          Add {formatINR(remaining)} more for <strong>free shipping</strong> 🚚
        </div>
      )}

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-4">
          {items.map((item) => (
            <li
              key={`${item.productId}-${item.size}`}
              className="flex gap-4 rounded-2xl border border-cream-300 bg-white p-4"
            >
              <Link href={`/product/${item.slug}`} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image || "/products/p-01.svg"}
                  alt={item.name}
                  className="h-28 w-21 rounded-xl object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/product/${item.slug}`}
                      className="font-medium text-ink-900 hover:text-rani-700"
                    >
                      {item.name}
                    </Link>
                    {item.size && (
                      <p className="mt-0.5 text-xs text-ink-500">Size: {item.size}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.productId, item.size)}
                    className="rounded-lg p-1.5 text-ink-300 transition hover:bg-rani-50 hover:text-rani-700"
                    aria-label={`Remove ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="inline-flex items-center rounded-lg border border-cream-300">
                    <button
                      onClick={() => setQuantity(item.productId, item.size, item.quantity - 1)}
                      className="p-2 text-ink-700 hover:text-rani-700"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.productId, item.size, item.quantity + 1)}
                      className="p-2 text-ink-700 hover:text-rani-700"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="font-bold text-rani-800">
                    {formatINR(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl border border-cream-300 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-ink-900">Order Summary</h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="font-semibold">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Shipping</dt>
              <dd className="font-semibold">
                {shipping === 0 ? (
                  <span className="text-green-700">FREE</span>
                ) : (
                  formatINR(shipping)
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-cream-300 pt-3 text-base">
              <dt className="font-bold text-ink-900">Total</dt>
              <dd className="font-bold text-rani-800">{formatINR(total)}</dd>
            </div>
          </dl>
          <Link
            href="/checkout"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-rani-700 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800"
          >
            Proceed to Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-3 text-center text-xs text-ink-500">
            Cash on Delivery · Easy 7-day returns
          </p>
        </aside>
      </div>
    </div>
  );
}
