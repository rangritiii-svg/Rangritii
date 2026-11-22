import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, Lock, MapPin } from "lucide-react";
import { ArtistCard, startingPrice } from "@/components/ArtistCard";
import { BookingSteps } from "@/components/BookingSteps";
import { SaveArtistButton } from "@/components/SaveArtistButton";
import { getArtistBySlug, getArtists, getPlatformSettings, getStyles } from "@/lib/data";
import { formatINR, priceRange } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) return { title: "Artist not found" };
  return {
    title: `${artist.name} — Mehandi Artist in ${artist.city}`,
    description: artist.bio.slice(0, 160),
  };
}

export default async function ArtistProfilePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  const [styles, cityArtists, settings] = await Promise.all([
    getStyles(),
    getArtists({ city: artist.city, limit: 5 }),
    getPlatformSettings(),
  ]);
  const artistStyles = artist.styles
    .map((s) => styles.find((st) => st.slug === s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const others = cityArtists.filter((a) => a.id !== artist.id).slice(0, 4);
  const gallery = artist.portfolioImages.length ? artist.portfolioImages : [artist.profileImage].filter(Boolean);
  const from = startingPrice(artist);

  return (
    <div className="mx-auto max-w-6xl pb-24 lg:px-6 lg:pb-12 lg:pt-8">
      <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        {/* Portfolio — swipe on phones, grid on desktop */}
        <section aria-label="Portfolio" className="relative">
          <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto lg:grid lg:grid-cols-2 lg:gap-3 lg:overflow-visible">
            {gallery.map((img, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={img + i}
                src={img}
                alt={`${artist.name} — mehandi design ${i + 1}`}
                loading={i < 2 ? "eager" : "lazy"}
                className={`aspect-[4/5] w-[86vw] shrink-0 snap-center object-cover sm:w-[60vw] lg:w-full lg:rounded-2xl ${
                  i === 0 ? "lg:col-span-2 lg:aspect-[4/3]" : ""
                } ${i > 0 ? "border-l-2 border-white lg:border-0" : ""}`}
              />
            ))}
          </div>
          {gallery.length > 1 && (
            <span className="absolute bottom-3 left-4 rounded-full bg-ink-900/70 px-3 py-1 text-xs font-medium text-white lg:hidden">
              {gallery.length} photos — swipe
            </span>
          )}
          <div className="absolute right-3 top-3">
            <SaveArtistButton
              large
              item={{
                artistId: artist.id,
                slug: artist.slug,
                name: artist.name,
                city: artist.city,
                priceMin: artist.priceMin,
                priceMax: artist.priceMax,
                image: artist.profileImage,
              }}
            />
          </div>
        </section>

        <div className="px-4 pt-5 sm:px-6 lg:px-0 lg:pt-0">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.profileImage || "/art/artist-1-profile.jpg"}
              alt=""
              className="h-16 w-16 rounded-full object-cover object-top"
            />
            <div>
              <h1 className="font-display text-[30px] leading-tight text-ink-900 sm:text-4xl">{artist.name}</h1>
              <p className="flex items-center gap-1 text-[15px] text-ink-500">
                <MapPin className="h-4 w-4" />
                {artist.area ? `${artist.area}, ` : ""}
                {artist.city}
              </p>
            </div>
          </div>

          <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[15px] text-ink-700">
            <span className="inline-flex items-center gap-1 font-medium text-leaf-700">
              <BadgeCheck className="h-4 w-4" /> Verified by Rangritii
            </span>
            {artist.experienceYears > 0 && <span>{artist.experienceYears}+ years of work</span>}
            <span>Comes to your home</span>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {artistStyles.map((s) => (
              <Link
                key={s.slug}
                href={`/artists?style=${s.slug}`}
                className="rounded-full border border-cream-300 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700 hover:border-rani-300"
              >
                {s.name}
              </Link>
            ))}
          </div>

          {/* Packages */}
          <section className="mt-7">
            <h2 className="font-display text-[22px] text-ink-900">Packages & prices</h2>
            {artist.packages.length > 0 ? (
              <ul className="mt-3 divide-y divide-cream-200 rounded-2xl border border-cream-300 bg-white">
                {artist.packages.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 px-4 py-3.5">
                    <span className="text-[15px] text-ink-900">{p.name}</span>
                    <span className="shrink-0 text-right text-[15px] font-semibold text-stain-700">
                      {formatINR(p.price)}
                      <span className="block text-xs font-normal text-ink-500">
                        {p.unit === "per_person" ? "per person" : "per event"}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-[15px] text-ink-700">{priceRange(artist.priceMin, artist.priceMax)}</p>
            )}
          </section>

          <section className="mt-7">
            <h2 className="font-display text-[22px] text-ink-900">How your booking works</h2>
            <BookingSteps tokenAmount={settings.tokenAmount} responseHours={settings.responseHours} artistName={artist.name} />
          </section>

          {artist.bio && (
            <section className="mt-7">
              <h2 className="font-display text-[22px] text-ink-900">About {artist.name.split(" ")[0]}</h2>
              <p className="mt-2 max-w-prose text-[16px] leading-relaxed text-ink-700">{artist.bio}</p>
            </section>
          )}

          <p className="mt-6 flex items-start gap-2 text-sm text-ink-500">
            <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            Her phone and WhatsApp unlock for you as soon as she accepts your booking.
          </p>

          <div className="mt-6 hidden lg:block">
            <Link
              href={`/book/${artist.slug}`}
              className="inline-flex rounded-full bg-rani-700 px-10 py-4 text-[16px] font-semibold text-white hover:bg-rani-800"
            >
              Book {artist.name.split(" ")[0]}
            </Link>
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <section className="mt-12 px-4 sm:px-6 lg:px-0">
          <h2 className="font-display text-[24px] text-ink-900">More artists in {artist.city}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((a) => (
              <ArtistCard key={a.id} artist={a} styles={styles} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky book bar on phones, sits on top of the tab bar */}
      <div className="fixed inset-x-0 bottom-[calc(var(--sab)+4rem)] z-30 border-t border-cream-300 bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <p className="text-sm leading-tight text-ink-500">
            from <span className="block text-lg font-semibold text-stain-700">{from > 0 ? formatINR(from) : "Ask"}</span>
          </p>
          <Link
            href={`/book/${artist.slug}`}
            className="flex-1 rounded-full bg-rani-700 py-3.5 text-center text-[16px] font-semibold text-white active:bg-rani-800"
          >
            Book {artist.name.split(" ")[0]}
          </Link>
        </div>
      </div>
    </div>
  );
}
