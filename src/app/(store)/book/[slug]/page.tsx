import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/BookingForm";
import { getArtistBySlug, getPlatformSettings } from "@/lib/data";
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
  return { title: artist ? `Book ${artist.name}` : "Book Artist" };
}

export default async function BookPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const [artist, settings] = await Promise.all([getArtistBySlug(slug), getPlatformSettings()]);
  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 sm:px-6 lg:pt-10">
      <Link href={`/artist/${artist.slug}`} className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={artist.profileImage || "/art/artist-1-profile.jpg"} alt="" className="h-12 w-12 rounded-full object-cover object-top" />
        <div>
          <h1 className="font-display text-[26px] leading-tight text-ink-900">Book {artist.name}</h1>
          <p className="text-sm text-ink-500">{artist.area ? `${artist.area}, ` : ""}{artist.city}</p>
        </div>
      </Link>
      <div className="mt-5">
        <BookingForm
          artistId={artist.id}
          artistName={artist.name}
          artistCity={artist.city}
          packages={artist.packages}
          tokenAmount={settings.tokenAmount}
          priceHint={artist.priceMin > 0 || artist.priceMax > 0 ? priceRange(artist.priceMin, artist.priceMax) : undefined}
        />
      </div>
    </div>
  );
}
