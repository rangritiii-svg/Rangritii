"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowRight, Banknote, Lock, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/CartProvider";
import { SITE } from "@/lib/config";
import { formatINR } from "@/lib/format";
import { placeOrder } from "./actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, subtotal, clear } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const shipping = subtotal >= SITE.freeShippingAbove || subtotal === 0 ? 0 : SITE.shippingFee;
  const total = subtotal + shipping;

  function submit(formData: FormData) {
    setError(null);
    const details = {
      customerName: String(formData.get("customerName") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      pincode: String(formData.get("pincode") ?? ""),
    };
    const checkoutItems = items.map((i) => ({
      productId: i.productId,
      size: i.size,
      quantity: i.quantity,
    }));

    startTransition(async () => {
      const result = await placeOrder(details, checkoutItems);
      if (result.ok) {
        clear();
        router.push(
          `/order-confirmed?number=${encodeURIComponent(result.orderNumber)}&total=${result.total}`
        );
      } else {
        setError(result.error);
      }
    });
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-ink-500">
        Loading checkout…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-14 w-14 text-ink-300" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">
          Nothing to checkout
        </h1>
        <p className="mt-2 text-ink-500">Your bag is empty. Add something you love first.</p>
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
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">Checkout</h1>
      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
        <Lock className="h-3.5 w-3.5" /> Your details are used only to deliver this order.
      </p>

      <form action={submit} className="mt-7 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-cream-300 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              Delivery Details
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="customerName">
                  Full name *
                </label>
                <input id="customerName" name="customerName" required className={field} placeholder="Priya Sharma" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="email">
                  Email *
                </label>
                <input id="email" name="email" type="email" required className={field} placeholder="you@example.com" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="phone">
                  Mobile number *
                </label>
                <input id="phone" name="phone" type="tel" required className={field} placeholder="98765 43210" />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="address">
                  Address (house no, street, landmark) *
                </label>
                <textarea id="address" name="address" required rows={3} className={field} placeholder="Flat 12, Rose Villa, MG Road, near City Mall" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="city">
                  City *
                </label>
                <input id="city" name="city" required className={field} placeholder="Jaipur" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="state">
                    State *
                  </label>
                  <input id="state" name="state" required className={field} placeholder="Rajasthan" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="pincode">
                    Pincode *
                  </label>
                  <input id="pincode" name="pincode" required inputMode="numeric" className={field} placeholder="302001" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-cream-300 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-ink-900">Payment</h2>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-rani-700 bg-rani-50 px-5 py-4">
              <Banknote className="h-6 w-6 text-rani-700" />
              <div>
                <p className="text-sm font-bold text-ink-900">Cash on Delivery</p>
                <p className="text-xs text-ink-500">
                  Pay when your order reaches your doorstep. Online payments coming soon.
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-cream-300 bg-white p-6">
          <h2 className="font-display text-xl font-semibold text-ink-900">Your Order</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={`${item.productId}-${item.size}`} className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image || "/products/p-01.svg"}
                  alt=""
                  className="h-14 w-11 rounded-lg object-cover"
                />
                <div className="flex-1 text-sm">
                  <p className="line-clamp-1 font-medium text-ink-900">{item.name}</p>
                  <p className="text-xs text-ink-500">
                    {item.size && `${item.size} · `}Qty {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold">{formatINR(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2.5 border-t border-cream-300 pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="font-semibold">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-500">Shipping</dt>
              <dd className="font-semibold">
                {shipping === 0 ? <span className="text-green-700">FREE</span> : formatINR(shipping)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-cream-300 pt-3 text-base">
              <dt className="font-bold">Total</dt>
              <dd className="font-bold text-rani-800">{formatINR(total)}</dd>
            </div>
          </dl>

          {error && (
            <p className="mt-4 rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-rani-700 py-4 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Placing order…" : `Place Order · ${formatINR(total)}`}
          </button>
        </aside>
      </form>
    </div>
  );
}
