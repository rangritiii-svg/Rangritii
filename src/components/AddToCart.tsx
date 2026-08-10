"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Minus, Plus, ShoppingBag, Zap } from "lucide-react";
import { useCart } from "./CartProvider";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [size, setSize] = useState<string>(product.sizes[0] ?? "");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock === 0;

  function add() {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.images[0] ?? "",
        size,
      },
      quantity
    );
  }

  return (
    <div className="mt-6 space-y-5">
      {product.sizes.length > 0 && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink-900">Size</p>
            <a href="/policies/size-guide" className="text-xs font-medium text-rani-700 underline">
              Size guide
            </a>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {product.sizes.map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                aria-pressed={size === s}
                className={`min-w-12 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  size === s
                    ? "border-rani-700 bg-rani-700 text-white"
                    : "border-cream-300 bg-white text-ink-700 hover:border-rani-400"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-sm font-semibold text-ink-900">Quantity</p>
        <div className="mt-2.5 inline-flex items-center rounded-xl border border-cream-300 bg-white">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 text-ink-700 hover:text-rani-700 disabled:opacity-40"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-10 text-center text-sm font-bold">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="p-3 text-ink-700 hover:text-rani-700 disabled:opacity-40"
            disabled={quantity >= 10}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => {
            add();
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
          }}
          disabled={soldOut}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-rani-700 px-6 py-3.5 text-sm font-bold text-rani-700 transition hover:bg-rani-50 disabled:cursor-not-allowed disabled:border-ink-300 disabled:text-ink-300"
        >
          {added ? (
            <>
              <Check className="h-4 w-4" /> Added to bag
            </>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" /> {soldOut ? "Sold out" : "Add to bag"}
            </>
          )}
        </button>
        <button
          onClick={() => {
            add();
            router.push("/checkout");
          }}
          disabled={soldOut}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rani-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-not-allowed disabled:bg-ink-300"
        >
          <Zap className="h-4 w-4" /> Buy now
        </button>
      </div>

      {product.stock > 0 && product.stock <= 10 && (
        <p className="text-xs font-semibold text-rani-700">
          Sirf {product.stock} left in stock — jaldi karo!
        </p>
      )}
    </div>
  );
}
