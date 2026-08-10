import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, RefreshCcw, Truck } from "lucide-react";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";
import { WishlistButton } from "@/components/WishlistButton";
import { SITE } from "@/lib/config";
import { getCategoryBySlug, getProductBySlug, getProducts } from "@/lib/data";
import { discountPercent, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return { title: product.name, description: product.description.slice(0, 160) };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, related] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getProducts({ category: product.categorySlug, limit: 5 }),
  ]);
  const off = discountPercent(product.price, product.compareAtPrice);
  const suggestions = related.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-rani-700">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-rani-700">
          {category?.name ?? "Shop"}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-900">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0] ?? "/products/p-01.svg"}
            alt={product.name}
            className="aspect-[3/4] w-full rounded-3xl object-cover shadow-lg shadow-rani-900/10"
          />
          <div className="absolute left-4 top-4 flex gap-2">
            {off !== null && (
              <span className="rounded-full bg-rani-700 px-3 py-1.5 text-xs font-bold text-white">
                -{off}% OFF
              </span>
            )}
            {product.isNew && (
              <span className="rounded-full bg-marigold-500 px-3 py-1.5 text-xs font-bold text-white">
                NEW
              </span>
            )}
          </div>
          <div className="absolute right-4 top-4">
            <WishlistButton
              large
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
        </div>

        {/* Details */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
            {product.fabric}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-rani-800">{formatINR(product.price)}</span>
            {product.compareAtPrice !== null && product.compareAtPrice > product.price && (
              <>
                <span className="text-lg text-ink-300 line-through">
                  {formatINR(product.compareAtPrice)}
                </span>
                <span className="rounded-full bg-rani-100 px-2.5 py-1 text-xs font-bold text-rani-800">
                  Save {formatINR(product.compareAtPrice - product.price)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-500">Inclusive of all taxes</p>

          <AddToCart product={product} />

          <div className="mt-8 space-y-3 rounded-2xl border border-cream-300 bg-white p-5 text-sm text-ink-700">
            <p className="flex items-center gap-2.5">
              <Truck className="h-4.5 w-4.5 text-rani-700" />
              Free shipping on orders above ₹{SITE.freeShippingAbove}
            </p>
            <p className="flex items-center gap-2.5">
              <BadgeCheck className="h-4.5 w-4.5 text-rani-700" />
              Cash on Delivery available
            </p>
            <p className="flex items-center gap-2.5">
              <RefreshCcw className="h-4.5 w-4.5 text-rani-700" />
              Easy 7-day return & exchange
            </p>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">The story</h2>
            <p className="mt-3 leading-relaxed text-ink-700">{product.description}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-xl bg-cream-200/60 p-4">
                <dt className="text-xs uppercase tracking-wider text-ink-500">Fabric</dt>
                <dd className="mt-1 font-semibold text-ink-900">{product.fabric}</dd>
              </div>
              <div className="rounded-xl bg-cream-200/60 p-4">
                <dt className="text-xs uppercase tracking-wider text-ink-500">Sizes</dt>
                <dd className="mt-1 font-semibold text-ink-900">
                  {product.sizes.join(" · ") || "Free size"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Related */}
      {suggestions.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            Aapko yeh bhi pasand aayenge
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {suggestions.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
