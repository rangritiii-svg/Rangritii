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
            Rangritii ek simple soch se shuru hua — har sheher mein kamaal ki mehandi
            artists hain, lekin unhe dhundhna mushkil hai. Aur artists ke paas hunar hai,
            par naye customers tak pahunchne ka zariya nahi. Rangritii dono ko milata
            hai: customers ko verified artists ke real portfolios, aur artists ko bina
            commission ke seedhi bookings.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-3 sm:px-6">
        {[
          {
            icon: Palette,
            title: "Kalakaari first",
            text: "Har artist ka asli portfolio — jo dikhta hai wahi milta hai. Design dekho, phir chuno.",
          },
          {
            icon: ShieldCheck,
            title: "Verified & safe",
            text: "Har profile team se approve hoti hai. Contact details check, portfolio check.",
          },
          {
            icon: HandHeart,
            title: "Artist ka haq",
            text: "Zero commission. Payment seedha artist ko — unki mehnat, unki kamai.",
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
          Shaadi ho ya Karva Chauth — rang humara, kahaani aapki
        </h2>
        <p className="mt-3 text-ink-500">
          Har booking ke saath ek celebration judta hai. Humein khushi hai ki hum uska
          hissa hain.
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
