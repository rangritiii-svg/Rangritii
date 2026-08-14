import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HandHeart, Palette, ShieldCheck } from "lucide-react";
import { SITE } from "@/lib/config";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <div>
      <section className="texture-dots bg-cream-100 py-16 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
            Our story
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
            {SITE.tagline}
          </h1>
          <p className="mt-5 leading-relaxed text-ink-500">
            Rangritii began with a simple thought — every city has incredible mehandi
            artists, but they are hard to find. And artists have the talent, but no
            way to reach new customers. Rangritii brings the two together: real
            portfolios of verified artists for customers, and direct, commission-free
            bookings for artists.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {[
          {
            icon: Palette,
            title: "Artistry first",
            text: "Every artist's real portfolio — what you see is what you get. Browse the designs, then choose.",
          },
          {
            icon: ShieldCheck,
            title: "Verified & safe",
            text: "Every profile is approved by our team. Contact details checked, portfolio checked.",
          },
          {
            icon: HandHeart,
            title: "Artists keep it all",
            text: "Zero commission. Payment goes straight to the artist — their craft, their earnings.",
          },
        ].map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-cream-300 bg-white p-7">
            <span className="inline-flex rounded-2xl bg-rani-50 p-3 text-rani-700">
              <Icon className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-ink-900">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 text-center sm:px-6">
        <h2 className="font-display text-2xl font-semibold text-ink-900">
          A wedding or Karva Chauth — our color, your story
        </h2>
        <p className="mt-3 text-ink-500">
          Behind every booking there is a celebration. We are honored to be a part
          of it.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/artists"
            className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
          >
            Find Your Artist <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-7 py-3.5 text-sm font-bold text-rani-700 hover:bg-rani-50"
          >
            Join as Artist
          </Link>
        </div>
      </section>
    </div>
  );
}
