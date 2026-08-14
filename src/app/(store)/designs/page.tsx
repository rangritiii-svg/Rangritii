import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export const metadata: Metadata = {
  title: "Mehandi Design Gallery — Har Style ke Designs",
  description:
    "Bridal, Arabic, Indo-Arabic, Traditional, Minimal aur Festive — har mehandi style ke designs ek jagah dekho aur apne style ke artists book karo.",
};

const DESIGN_TYPES = [
  {
    slug: "bridal",
    name: "Bridal / Dulhan",
    hindi: "Shaadi ka sabse khaas rang",
    text: "Full-coverage design — baarik jaal, palm mandala, ungliyon par ladder work aur wrist band. Dulhan ke haathon ki shaan, jo mehendi ki raat ko yaadgar bana de.",
    best: "Shaadi · Sagai · Anniversary",
  },
  {
    slug: "arabic",
    name: "Arabic",
    hindi: "Bold bel, khula design",
    text: "Ek statement diagonal bel — bade phool, lambi pattiyan aur khoob saari khali jagah. Jaldi lagti hai, door se hi classy dikhti hai.",
    best: "Party · Eid · Guest look",
  },
  {
    slug: "indo-arabic",
    name: "Indo-Arabic",
    hindi: "Do duniyaon ka sangam",
    text: "Indian baariki aur Arabic boldness ka mix — center mandala, ambi (paisley) pairs aur alternate ungliyon par bel. Bharaa-bharaa bhi, modern bhi.",
    best: "Engagement · Reception · Festivals",
  },
  {
    slug: "traditional",
    name: "Traditional / Rajasthani",
    hindi: "Parampara ki kahaani",
    text: "Mor (peacock), ambi aur checkered patterns — Rajasthani gharanon ki puraani kala. Har motif ka apna matlab, har haath par ek kahaani.",
    best: "Teej · Gangaur · Shubh avsar",
  },
  {
    slug: "minimal",
    name: "Minimal / Modern",
    hindi: "Kam mein zyada",
    text: "Ek delicate ring mandala, dot chains aur dipped fingertips — bas itna hi. Aaj kal ki brides aur working women ki pehli pasand.",
    best: "Office · Brunch · Modern bride",
  },
  {
    slug: "festive",
    name: "Festive / Party",
    hindi: "Har khushi ke liye",
    text: "Knuckle line par phool-chain, chhota mandala aur latakte jhumka drops — na zyada heavy, na bilkul halka. Tyohaar ke liye perfect.",
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
            Har type ki mehandi, <span className="italic text-rani-700">ek jagah</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-500">
            Pehle design pasand karo, phir wahi style banane waale artists ko book
            karo — bridal se minimal tak, sab kuch yahan hai.
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
                Is style ke artists <ArrowRight className="h-3.5 w-3.5" />
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
            Design pasand aa gaya?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream-200/90">
            Apne sheher ke verified artists dekho aur free booking request bhejo —
            artist aapke ghar aakar wahi jadoo utaar degi.
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
