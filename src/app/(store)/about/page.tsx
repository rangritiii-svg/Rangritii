import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Heart, Leaf, Palette } from "lucide-react";
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
            Rangritii began with a simple belief — that everyday ethnic wear should feel as
            special as festive wear, without the festive price tag. We work directly with
            fabric makers and karigars to bring you kurtis, co-ord sets and party looks in
            colours that celebrate who you are.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {[
          {
            icon: Palette,
            title: "Rang first",
            text: "Every collection starts with colour — shades picked from Indian streets, seasons and celebrations.",
          },
          {
            icon: Leaf,
            title: "Fabric you can breathe in",
            text: "Pure cottons, soft rayons and airy georgettes — chosen for Indian weather, tested by real wear.",
          },
          {
            icon: Heart,
            title: "Style for every body",
            text: "Sizes S to 5XL, cuts designed on real bodies. Fashion is for everyone, full stop.",
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
          From our parivaar to yours
        </h2>
        <p className="mt-3 text-ink-500">
          Thousands of women across India wear Rangritii to work, weddings and everything in
          between. We would love to dress your story too.
        </p>
        <Link
          href="/shop"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
        >
          Explore the Collection <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
