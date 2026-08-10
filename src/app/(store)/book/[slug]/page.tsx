import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Award, MapPin, Wallet } from "lucide-react";
import { BookingForm } from "@/components/BookingForm";
import { getArtistBySlug } from "@/lib/data";
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
  const artist = await getArtistBySlug(slug);
  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-rani-700">Home</Link>
        <span className="mx-1.5">/</span>
        <Link href={`/artist/${artist.slug}`} className="hover:text-rani-700">
          {artist.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-900">Book</span>
      </nav>

      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
        Book {artist.name}
      </h1>
      <p className="mt-1 text-sm text-ink-500">
        Booking request free hai — artist aapko confirm karegi.
      </p>

      <div className="mt-7 grid gap-8 lg:grid-cols-[340px_1fr]">
        {/* Artist summary */}
        <aside className="h-fit rounded-3xl border border-cream-300 bg-white p-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={artist.profileImage || "/art/artist-1-profile.svg"}
            alt={artist.name}
            className="aspect-[4/3] w-full rounded-2xl object-cover object-top"
          />
          <p className="mt-4 font-display text-xl font-semibold text-ink-900">
            {artist.name}
          </p>
          <div className="mt-3 space-y-2 text-sm text-ink-700">
            <p className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-rani-700" />
              {artist.area ? `${artist.area}, ` : ""}{artist.city}
            </p>
            <p className="flex items-center gap-2">
              <Award className="h-4 w-4 text-rani-700" />
              {artist.experienceYears}+ years experience
            </p>
            <p className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-rani-700" />
              {priceRange(artist.priceMin, artist.priceMax)}
            </p>
          </div>
          <Link
            href={`/artist/${artist.slug}`}
            className="mt-4 block text-center text-sm font-semibold text-rani-700 hover:underline"
          >
            View full portfolio →
          </Link>
        </aside>

        <div className="rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
          <BookingForm artistId={artist.id} artistCity={artist.city} />
        </div>
      </div>
    </div>
  );
}
