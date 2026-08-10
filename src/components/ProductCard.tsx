import Link from "next/link";
import { discountPercent, formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { WishlistButton } from "./WishlistButton";

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rani-900/10">
      <Link href={`/product/${product.slug}`} className="relative block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0] ?? "/products/p-01.svg"}
          alt={product.name}
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off !== null && (
            <span className="rounded-full bg-rani-700 px-2.5 py-1 text-[11px] font-bold text-white">
              -{off}%
            </span>
          )}
          {product.isNew && (
            <span className="rounded-full bg-marigold-500 px-2.5 py-1 text-[11px] font-bold text-white">
              NEW
            </span>
          )}
          {product.stock === 0 && (
            <span className="rounded-full bg-ink-700 px-2.5 py-1 text-[11px] font-bold text-white">
              SOLD OUT
            </span>
          )}
        </div>
      </Link>

      <div className="absolute right-3 top-3">
        <WishlistButton
          item={{
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            image: product.images[0] ?? "",
          }}
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-xs uppercase tracking-wider text-ink-500">{product.fabric}</p>
        <Link
          href={`/product/${product.slug}`}
          className="mt-1 line-clamp-2 font-medium text-ink-900 transition group-hover:text-rani-700"
        >
          {product.name}
        </Link>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-lg font-bold text-rani-800">{formatINR(product.price)}</span>
          {product.compareAtPrice !== null && product.compareAtPrice > product.price && (
            <span className="text-sm text-ink-300 line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
