import Link from "next/link";
import { BadgeCheck, MapPin } from "lucide-react";
import { formatINR } from "@/lib/format";
import type { Artist, Style } from "@/lib/types";
import { SaveArtistButton } from "./SaveArtistButton";

/** Lowest bookable price: cheapest package, else the "from" price. */
export function startingPrice(artist: Artist): number {
  if (artist.packages.length) return Math.min(...artist.packages.map((p) => p.price));
  return artist.priceMin;
}

/** Photo-first card: customers choose by the designs, so the portfolio leads. */
export function ArtistCard({ artist, styles }: { artist: Artist; styles: Style[] }) {
  const styleNames = artist.styles
    .map((slug) => styles.find((s) => s.slug === slug)?.name.split(" / ")[0] ?? slug)
    .slice(0, 3)
    .join(", ");
  const photos = [artist.portfolioImages[0] || artist.profileImage, artist.portfolioImages[1], artist.portfolioImages[2]]
    .filter(Boolean) as string[];
  const from = startingPrice(artist);

  return (
    <article className="relative overflow-hidden rounded-[22px] border border-cream-300 bg-white">
      <Link href={`/artist/${artist.slug}`} className="block" aria-label={`${artist.name}, ${artist.city}`}>
        <div className="grid h-52 grid-cols-3 grid-rows-2 gap-0.5 bg-cream-200 sm:h-56">
          {photos.length > 0 ? (
            photos.map((src, i) => (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                key={src + i}
                src={src}
                alt={`Mehandi design by ${artist.name}${i > 0 ? ` (${i + 1})` : ""}`}
                loading="lazy"
                className={`h-full w-full object-cover ${
                  i === 0 ? (photos.length === 1 ? "col-span-3 row-span-2" : "col-span-2 row-span-2") : ""
                } ${photos.length === 2 && i === 1 ? "row-span-2" : ""}`}
              />
            ))
          ) : (
            <div className="col-span-3 row-span-2" />
          )}
        </div>
        <div className="flex items-start gap-3 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artist.profileImage || "/art/artist-1-profile.jpg"}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover object-top ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <h3 className="flex items-center gap-1.5 font-body text-[17px] font-semibold leading-tight text-ink-900">
              <span className="truncate">{artist.name}</span>
              <BadgeCheck className="h-4 w-4 shrink-0 text-leaf-600" aria-label="Verified" />
            </h3>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-ink-500">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {artist.area ? `${artist.area}, ` : ""}
              {artist.city}
            </p>
            <p className="mt-1 truncate text-sm text-ink-700">
              {styleNames}
              {artist.experienceYears > 0 && <span className="text-ink-500"> — {artist.experienceYears} yrs</span>}
            </p>
          </div>
          <p className="shrink-0 text-right text-sm leading-tight text-ink-500">
            from
            <span className="block text-[17px] font-semibold text-stain-700">
              {from > 0 ? formatINR(from) : "Ask"}
            </span>
          </p>
        </div>
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
    </article>
  );
}
