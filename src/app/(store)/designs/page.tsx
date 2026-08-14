import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Mehandi Design Gallery — Designs for Every Style",
  description:
    "Bridal, Arabic, Indo-Arabic, Traditional, Minimal, and Festive — explore designs from every mehandi style in one place and book artists who create yours.",
};

const DESIGN_TYPES = [
  {
    slug: "bridal",
    name: "Bridal / Dulhan",
    hindi: "The wedding's most special color",
    text: "Full-coverage design — fine net work, a palm mandala, ladder work on the fingers, and a wrist band. The pride of a bride's hands, making the mehandi night unforgettable.",
    best: "Wedding · Engagement · Anniversary",
  },
  {
    slug: "arabic",
    name: "Arabic",
    hindi: "Bold vines, open design",
    text: "One statement diagonal vine — big florals, long leaves, and plenty of open space. Quick to apply, and it looks classy even from across the room.",
    best: "Party · Eid · Guest look",
  },
  {
    slug: "indo-arabic",
    name: "Indo-Arabic",
    hindi: "Where two worlds meet",
    text: "Indian intricacy meets Arabic boldness — a center mandala, paisley pairs, and vines on alternating fingers. Rich and full, yet modern.",
    best: "Engagement · Reception · Festivals",
  },
  {
    slug: "traditional",
    name: "Traditional / Rajasthani",
    hindi: "A story of tradition",
    text: "Peacocks, paisleys, and checkered patterns — the age-old art of Rajasthani households. Every motif has a meaning, every hand tells a story.",
    best: "Teej · Gangaur · Auspicious days",
  },
  {
    slug: "minimal",
    name: "Minimal / Modern",
    hindi: "Less is more",
    text: "A delicate ring mandala, dot chains, and dipped fingertips — nothing more. The first choice of today's brides and working women.",
    best: "Office · Brunch · Modern bride",
  },
  {
    slug: "festive",
    name: "Festive / Party",
    hindi: "For every celebration",
    text: "A floral chain along the knuckles, a small mandala, and dangling jhumka drops — not too heavy, not too light. Perfect for the festive season.",
    best: "Karva Chauth · Diwali · Raksha Bandhan",
  },
];

export default function DesignsPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="texture-dots border-b border-cream-300 bg-cream-100">
        <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:py-16">
          <p className="inline-flex items-center gap-2 rounded-full border border-rani-200 bg-rani-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-rani-700">
            <Sparkles className="h-3.5 w-3.5" /> Design Gallery
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
            Every style of mehandi, <span className="italic text-rani-700">one place</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-500">
            Fall in love with a design first, then book the artists who create that
            very style — from bridal to minimal, it&apos;s all here.
          </p>
        </div>
      </section>

      {/* ── Style sections ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {DESIGN_TYPES.map((t, i) => (
          <section
            key={t.slug}
            className={`py-12 ${i > 0 ? "border-t border-cream-300" : ""}`}
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
                  {t.hindi}
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
                  {t.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{t.text}</p>
                <p className="mt-2 text-xs font-semibold text-rani-700">
                  Best for: <span className="font-normal text-ink-500">{t.best}</span>
                </p>
              </div>
              <Link
                href={`/artists?style=${t.slug}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rani-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rani-800"
              >
                Artists for this style <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6">
              {[1, 2, 3].map((n) => (
                <Link
                  key={n}
                  href={`/artists?style=${t.slug}`}
                  className={`group overflow-hidden rounded-3xl border border-cream-300 shadow-md transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rani-900/10 ${
                    n === 3 ? "col-span-2 sm:col-span-1" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/art/design-${t.slug}-${n}.jpg`}
                    alt={`${t.name} mehandi design ${n}`}
                    loading={i > 0 ? "lazy" : undefined}
                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── CTA ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="texture-dots overflow-hidden rounded-3xl bg-rani-800 px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-xl font-display text-3xl font-semibold text-white">
            Found a design you love?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream-200/90">
            Browse verified artists in your city and send a free booking request —
            the artist will come to your home and recreate the magic.
          </p>
          <Link
            href="/artists"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-marigold-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-marigold-600"
          >
            Find Your Artist <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
