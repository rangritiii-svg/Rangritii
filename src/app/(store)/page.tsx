import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  MapPin,
  Search,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ArtistCard } from "@/components/ArtistCard";
import { SITE } from "@/lib/config";
import { getArtists, getStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [styles, featured] = await Promise.all([
    getStyles(),
    getArtists({ limit: 8 }),
  ]);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="texture-dots relative overflow-hidden bg-cream-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="animate-fade-up">
            <p className="inline-flex items-center gap-2 rounded-full border border-rani-200 bg-rani-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-rani-700">
              <Sparkles className="h-3.5 w-3.5" /> India&apos;s mehandi platform
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl lg:text-6xl">
              Haathon mein <span className="italic text-rani-700">rang</span>,
              <br />
              dil mein <span className="italic text-marigold-600">khushiyaan</span>.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-ink-500">
              Apne sheher ke best mehandi artists — portfolio dekho, style chuno, aur
              shaadi se Karva Chauth tak har occasion ke liye ghar baithe book karo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/artists"
                className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-rani-800"
              >
                <Search className="h-4 w-4" /> Find Your Artist
              </Link>
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-7 py-3.5 text-sm font-semibold text-rani-700 transition hover:bg-rani-50"
              >
                Join as Artist
              </Link>
            </div>
          </div>

          {/* Hero collage */}
          <div className="relative hidden gap-4 lg:grid lg:grid-cols-2">
            <div className="space-y-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/art/artist-1-profile.jpg"
                alt="Bridal mehandi design"
                className="w-full rounded-3xl shadow-xl shadow-rani-900/15"
              />
            </div>
            <div className="space-y-4 pt-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/art/style-bridal.jpg"
                alt="Mandala mehandi design"
                className="w-full rounded-3xl shadow-xl shadow-rani-900/15"
              />
            </div>
            <span className="absolute -left-4 top-8 rounded-full bg-marigold-500 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg -rotate-6">
              100% Free booking
            </span>
          </div>
        </div>
      </section>

      {/* ── Trust strip ── */}
      <section className="border-y border-cream-300 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 text-center sm:px-6 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, text: "Verified artists only" },
            { icon: Wallet, text: "Booking request FREE hai" },
            { icon: MapPin, text: "Apne sheher mein dhundo" },
            { icon: CalendarCheck, text: "Date pehle se lock karo" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center justify-center gap-2.5 text-sm text-ink-700">
              <Icon className="h-5 w-5 shrink-0 text-rani-700" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Styles ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
              Browse by style
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
              Har occasion ka design
            </h2>
          </div>
          <Link
            href="/designs"
            className="hidden items-center gap-1 text-sm font-semibold text-rani-700 hover:underline sm:inline-flex"
          >
            Design gallery <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="no-scrollbar mt-7 flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-6">
          {styles.map((s) => (
            <Link
              key={s.slug}
              href={`/artists?style=${s.slug}`}
              className="group w-36 shrink-0 lg:w-auto"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.image || "/art/style-bridal.svg"}
                alt={s.name}
                className="aspect-square w-full rounded-2xl object-cover shadow-md transition group-hover:scale-[1.03] group-hover:shadow-lg"
              />
              <p className="mt-2.5 text-center text-sm font-semibold text-ink-900 group-hover:text-rani-700">
                {s.name}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
              Kaise kaam karta hai
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
              3 easy steps mein booking
            </h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Artist dhundo",
                text: "Apna sheher aur pasandida style chuno, portfolios compare karo.",
              },
              {
                step: "2",
                title: "Date book karo",
                text: "Event date, occasion aur address ke saath free booking request bhejo.",
              },
              {
                step: "3",
                title: "Mehandi lagwao",
                text: "Artist confirm karke aapke ghar aayegi. Payment seedha artist ko, service ke baad.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="relative rounded-3xl border border-cream-300 bg-cream-50 p-7 text-center"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rani-700 font-display text-xl font-bold text-white">
                  {s.step}
                </span>
                <h3 className="mt-4 font-display text-xl font-semibold text-ink-900">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured artists ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
                Top rated
              </p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-ink-900">
                Featured Artists
              </h2>
            </div>
            <Link
              href="/artists"
              className="inline-flex items-center gap-1 text-sm font-semibold text-rani-700 hover:underline"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {featured.map((a) => (
              <ArtistCard key={a.id} artist={a} styles={styles} />
            ))}
          </div>
        </section>
      )}

      {/* ── Artist CTA banner ── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="texture-dots relative overflow-hidden rounded-3xl bg-rani-800 px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-xs font-bold uppercase tracking-widest text-marigold-300">
            Mehandi artist ho?
          </p>
          <h2 className="mx-auto mt-3 max-w-xl font-display text-3xl font-semibold text-white sm:text-4xl">
            Apna portfolio dikhao, apne sheher se bookings pao
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-cream-200/90">
            Registration bilkul free hai. Profile approve hote hi customers aap tak
            pahunchenge — bina kisi commission ke.
          </p>
          <Link
            href="/join"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-marigold-500 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-marigold-600"
          >
            Free Registration <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Community ── */}
      <section className="border-t border-cream-300 bg-white py-14">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-semibold text-ink-900">
            Join the Rangritii parivaar
          </h2>
          <p className="mt-3 text-ink-500">
            Seasonal offers, design inspiration aur naye artists ki updates WhatsApp par.
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
