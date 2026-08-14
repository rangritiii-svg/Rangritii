import Link from "next/link";
import { Award, MapPin } from "lucide-react";
import { priceRange } from "@/lib/format";
import type { Artist, Style } from "@/lib/types";
import { SaveArtistButton } from "./SaveArtistButton";

export function ArtistCard({
  artist,
  styles,
}: {
  artist: Artist;
  styles: Style[];
}) {
  const styleNames = artist.styles
    .map((slug) => styles.find((s) => s.slug === slug)?.name.split(" / ")[0] ?? slug)
    .slice(0, 3);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-cream-300 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rani-900/10">
      <Link href={`/artist/${artist.slug}`} className="relative block overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artist.profileImage || "/art/artist-1-profile.jpg"}
          alt={`${artist.name} — mehandi artist`}
          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink-900 shadow-sm">
          <Award className="h-3 w-3 text-marigold-600" /> {artist.experienceYears}+ yrs
        </span>
      </Link>

      <div className="absolute right-3 top-3">
        <SaveArtistButton
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

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/artist/${artist.slug}`}
          className="font-display text-lg font-semibold text-ink-900 transition group-hover:text-rani-700"
        >
          {artist.name}
        </Link>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3 w-3 text-rani-700" />
          {artist.area ? `${artist.area}, ` : ""}{artist.city}
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {styleNames.map((name) => (
            <span
              key={name}
              className="rounded-full bg-cream-200/80 px-2.5 py-1 text-[11px] font-semibold text-ink-700"
            >
              {name}
            </span>
          ))}
        </div>
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-sm font-bold text-rani-800">
            {priceRange(artist.priceMin, artist.priceMax)}
          </span>
        </div>
        <Link
          href={`/book/${artist.slug}`}
          className="mt-3 rounded-full bg-rani-700 py-2.5 text-center text-xs font-bold text-white transition hover:bg-rani-800"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
