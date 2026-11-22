import Link from "next/link";
import { ArtistCard } from "@/components/ArtistCard";
import { BookingSteps } from "@/components/BookingSteps";
import { getArtists, getPlatformSettings, getStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [styles, featured] = await Promise.all([
    getStyles(),
    getArtists({ limit: 8 }),
  ]);

  const settings = await getPlatformSettings();
  const heroPhotos = styles.map((s) => s.image).filter(Boolean).slice(0, 6);

  return (
    <div>
      {/* ── Hero: say what it is, let people search straight away ── */}
      <section className="overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-7 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:py-16">
          <div>
            <p lang="hi" className="font-display text-[64px] leading-[0.9] text-stain-600 sm:text-[88px]">
              मेहंदी
            </p>
            <h1 className="mt-3 font-display text-[34px] leading-[1.1] text-ink-900 sm:text-5xl">
              Book a mehandi artist who comes to your home
            </h1>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-ink-700">
              See real work from verified artists in your city, pick a package, and know the full price before you pay.
            </p>
            <form action="/artists" className="mt-6 flex max-w-md gap-2" role="search">
              <input
                name="q"
                placeholder="Your city or area"
                enterKeyHint="search"
                aria-label="City or area"
                className="h-13 w-full rounded-full border border-cream-300 bg-cream-100 px-5 text-[16px] outline-none focus:border-rani-400"
              />
              <button className="h-13 shrink-0 rounded-full bg-rani-700 px-6 text-[16px] font-semibold text-white active:bg-rani-800">
                Find artists
              </button>
            </form>
          </div>

          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0">
            {heroPhotos.map((src, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={src}
                src={src}
                alt=""
                className={`h-44 w-36 shrink-0 rounded-2xl object-cover sm:h-56 sm:w-44 lg:h-auto lg:w-full ${
                  i % 3 === 1 ? "lg:translate-y-8" : ""
                } aspect-[3/4]`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Styles ── */}
      <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:pt-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[26px] text-ink-900 sm:text-3xl">Pick a style</h2>
          <Link href="/designs" className="text-[15px] font-medium text-rani-700">
            See designs
          </Link>
        </div>
        <div className="no-scrollbar -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-6">
          {styles.map((s) => (
            <Link key={s.slug} href={`/artists?style=${s.slug}`} className="w-28 shrink-0 sm:w-32 lg:w-auto">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image || "/art/style-bridal.jpg"} alt="" className="aspect-square w-full rounded-2xl object-cover" />
              <p className="mt-2 text-center text-[15px] font-medium leading-tight text-ink-900">{s.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Artists ── */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:pt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-[26px] text-ink-900 sm:text-3xl">Artists taking bookings</h2>
            <Link href="/artists" className="text-[15px] font-medium text-rani-700">
              See all
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((a) => (
              <ArtistCard key={a.id} artist={a} styles={styles} />
            ))}
          </div>
        </section>
      )}

      {/* ── How booking works ── */}
      <section id="how-it-works" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-12 sm:px-6 lg:pt-20">
        <div className="grid gap-8 rounded-[28px] bg-white p-6 sm:p-10 lg:grid-cols-[0.9fr_1fr]">
          <div>
            <h2 className="font-display text-[26px] text-ink-900 sm:text-3xl">How booking works</h2>
            <p className="mt-2 max-w-sm text-[16px] text-ink-700">
              {settings.tokenAmount > 0
                ? `A small token keeps your date. You pay the rest only after the mehandi is done, and the token is refunded in full if the artist can't come.`
                : "Send a request, the artist confirms, and you pay after the mehandi."}
            </p>
          </div>
          <BookingSteps tokenAmount={settings.tokenAmount} responseHours={settings.responseHours} />
        </div>
      </section>

      {/* ── For artists ── */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-20">
        <div className="rounded-[28px] bg-rani-800 px-6 py-10 sm:px-12">
          <h2 className="max-w-xl font-display text-[28px] leading-tight text-white sm:text-4xl">
            Are you a mehandi artist? Get bookings from your city.
          </h2>
          <p className="mt-3 max-w-md text-[16px] text-rani-100">
            Listing is free. Customers pay a token before their request reaches you, so every request is serious.
            Rangritii keeps a {settings.commissionPercent}% commission only on completed bookings.
          </p>
          <Link
            href="/join"
            className="mt-6 inline-flex rounded-full bg-white px-7 py-3.5 text-[16px] font-semibold text-rani-800"
          >
            Create your free profile
          </Link>
        </div>
      </section>
    </div>
  );
}
