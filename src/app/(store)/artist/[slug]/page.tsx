import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Award,
  BadgeCheck,
  CalendarCheck,
  MapPin,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { ArtistCard } from "@/components/ArtistCard";
import { SaveArtistButton } from "@/components/SaveArtistButton";
import { getArtistBySlug, getArtists, getStyles } from "@/lib/data";
import { priceRange } from "@/lib/format";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
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

  const [styles, cityArtists] = await Promise.all([
    getStyles(),
    getArtists({ city: artist.city, limit: 5 }),
  ]);
  const artistStyles = artist.styles
    .map((s) => styles.find((st) => st.slug === s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const others = cityArtists.filter((a) => a.id !== artist.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-rani-700">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href="/artists" className="hover:text-rani-700">Artists</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-900">{artist.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[420px_1fr]">
        {/* Profile card */}
        <div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.profileImage || "/art/artist-1-profile.jpg"}
              alt={`${artist.name} — mehandi artist`}
              className="aspect-[3/4] w-full rounded-3xl object-cover shadow-lg shadow-rani-900/10"
            />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-ink-900 shadow-sm">
              <BadgeCheck className="h-4 w-4 text-green-600" /> Verified
            </span>
            <div className="absolute right-4 top-4">
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
          </div>

          <div className="mt-5 space-y-3 rounded-2xl border border-cream-300 bg-white p-5 text-sm text-ink-700">
            <p className="flex items-center gap-2.5">
              <Award className="h-4.5 w-4.5 text-rani-700" />
              {artist.experienceYears}+ years experience
            </p>
            <p className="flex items-center gap-2.5">
              <Wallet className="h-4.5 w-4.5 text-rani-700" />
              {priceRange(artist.priceMin, artist.priceMax)}
            </p>
            <p className="flex items-center gap-2.5">
              <MapPin className="h-4.5 w-4.5 text-rani-700" />
              {artist.area ? `${artist.area}, ` : ""}{artist.city} · home service
            </p>
            <p className="flex items-center gap-2.5">
              <CalendarCheck className="h-4.5 w-4.5 text-rani-700" />
              Free booking request — pay after service
            </p>
          </div>
        </div>

        {/* Details */}
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            {artist.name}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Mehandi Artist · {artist.city}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {artistStyles.map((s) => (
              <Link
                key={s.slug}
                href={`/artists?style=${s.slug}`}
                className="rounded-full bg-rani-50 px-3.5 py-1.5 text-xs font-bold text-rani-800 transition hover:bg-rani-100"
              >
                {s.name}
              </Link>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/book/${artist.slug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-rani-700 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800"
            >
              <CalendarCheck className="h-4 w-4" /> Book This Artist
            </Link>
            {artist.whatsapp && (
              <a
                href={`https://wa.me/${artist.whatsapp}?text=${encodeURIComponent(
                  `Hi ${artist.name}! I saw your profile on Rangritii — I'd like to talk about a mehandi booking.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-full border-2 border-[#25d366] px-6 py-3.5 text-sm font-bold text-[#1da851] transition hover:bg-[#25d366]/10"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">About</h2>
            <p className="mt-3 leading-relaxed text-ink-700">{artist.bio}</p>
          </div>

          {/* Portfolio */}
          {artist.portfolioImages.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-xl font-semibold text-ink-900">Portfolio</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
                {artist.portfolioImages.map((img, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={img + i}
                    src={img}
                    alt={`${artist.name} — mehandi design ${i + 1}`}
                    className="aspect-square w-full rounded-2xl object-cover shadow-md transition hover:scale-[1.02] hover:shadow-lg"
                    loading="lazy"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Other artists in city */}
      {others.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            More artists in {artist.city}
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {others.map((a) => (
              <ArtistCard key={a.id} artist={a} styles={styles} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
