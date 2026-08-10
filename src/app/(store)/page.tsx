import Link from "next/link";
import { ArrowRight, BadgeCheck, RefreshCcw, Sparkles, Truck } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SITE } from "@/lib/config";
import { getCategories, getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, newArrivals, bestsellers] = await Promise.all([
    getCategories(),
    getProducts({ onlyNew: true, limit: 8 }),
    getProducts({ onlyBestsellers: true, limit: 4 }),
  ]);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="texture-dots relative overflow-hidden bg-cream-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-rani-200 bg-rani-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-rani-700">
              <Sparkles className="h-3.5 w-3.5" /> Fresh drop · Monsoon 2026
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Wear your <span className="italic text-rani-700">rang</span>,
              <br />
              tell your <span className="italic text-marigold-600">kahaani</span>.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-500">
              {SITE.description}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-rani-800"
              >
                Shop the Collection <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/shop?filter=new"
                className="inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-7 py-3.5 text-sm font-semibold text-rani-700 transition hover:bg-rani-50"
              >
                New Arrivals
              </Link>
            </div>
          </div>

          {/* Hero collage from category art */}
          <div className="relative hidden gap-4 lg:grid lg:grid-cols-2">
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/p-01.svg"
                alt="Gulaab Rani Co-ord Set"
                className="w-full rounded-3xl shadow-xl shadow-rani-900/15"
              />
            </div>
            <div className="space-y-4 pt-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/products/p-15.svg"
                alt="Jashn Velvet Kurta Set"
                className="w-full rounded-3xl shadow-xl shadow-rani-900/15"
              />
            </div>
            <span className="absolute -left-4 top-8 rounded-full bg-marigold-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg -rotate-6">
              Upto 30% off
            </span>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-cream-300 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 text-center sm:px-6 lg:grid-cols-4">
          {[
            { icon: Truck, text: `Free shipping above ₹${SITE.freeShippingAbove}` },
            { icon: BadgeCheck, text: "Cash on Delivery available" },
            { icon: RefreshCcw, text: "Easy 7-day returns" },
            { icon: Sparkles, text: "New styles every week" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2.5 text-sm text-ink-700">
              <Icon className="h-5 w-5 shrink-0 text-rani-700" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
              Shop by category
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
              Har mood ka rang
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-1 text-sm font-semibold text-rani-700 hover:underline sm:inline-flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="no-scrollbar mt-7 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6">
          {categories.map((c) => (
            <Link
              key={c.slug}
              href={`/shop?category=${c.slug}`}
              className="group w-36 shrink-0 lg:w-auto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image || "/products/cat-coord.svg"}
                alt={c.name}
                className="aspect-square w-full rounded-2xl object-cover shadow-md transition group-hover:scale-[1.03] group-hover:shadow-lg"
              />
              <p className="mt-2.5 text-center text-sm font-semibold text-ink-900 group-hover:text-rani-700">
                {c.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── New arrivals ── */}
      {newArrivals.length > 0 && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
                  Just landed
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
                  New Arrivals
                </h2>
              </div>
              <Link
                href="/shop?filter=new"
                className="inline-flex items-center gap-1 text-sm font-semibold text-rani-700 hover:underline"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {newArrivals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Promo banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="texture-dots relative overflow-hidden rounded-3xl bg-rani-800 px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-marigold-300">
            The Final Drop
          </p>
          <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-semibold text-white sm:text-4xl">
            Festive favourites, upto 30% off — jab tak stock hai
          </h2>
          <Link
            href="/shop?category=party-wear"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-marigold-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-marigold-600"
          >
            Shop Party Wear <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Bestsellers ── */}
      {bestsellers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
                Loved by thousands
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
                Bestsellers
              </h2>
            </div>
            <Link
              href="/shop?filter=bestsellers"
              className="inline-flex items-center gap-1 text-sm font-semibold text-rani-700 hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── Community ── */}
      <section className="border-t border-cream-300 bg-white py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-ink-900">
            Join the Rangritii parivaar
          </h2>
          <p className="mt-3 text-ink-500">
            Get first dibs on new drops, styling tips and members-only offers on WhatsApp.
          </p>
          <a
            href={`https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(
              "Hi! Please add me to the Rangritii community."
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-7 py-3.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            Join on WhatsApp
          </a>
        </div>
      </section>
    </div>
  );
}
