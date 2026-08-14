"use client";

import Link from "next/link";
import { ArrowRight, Heart, Trash2 } from "lucide-react";
import { useSavedArtists } from "@/components/SavedArtistsProvider";
import { priceRange } from "@/lib/format";

export default function SavedArtistsPage() {
  const { items, ready, remove } = useSavedArtists();

  if (!ready) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center text-ink-500">
        Loading saved artists…
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <Heart className="mx-auto h-14 w-14 text-ink-300" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">
          Koi saved artist nahi
        </h1>
        <p className="mt-2 text-ink-500">
          Kisi bhi artist par ♥ dabao — yahan compare karne ke liye save ho jayengi.
        </p>
        <Link
          href="/artists"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
        >
          Browse Artists <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
        Saved Artists <span className="text-lg text-ink-500">({items.length})</span>
      </h1>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.artistId}
            className="group overflow-hidden rounded-2xl border border-cream-300 bg-white"
          >
            <Link href={`/artist/${item.slug}`} className="block overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image || "/art/artist-1-profile.jpg"}
                alt={item.name}
                className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </Link>
            <div className="p-4">
              <Link
                href={`/artist/${item.slug}`}
                className="font-display text-lg font-semibold text-ink-900 hover:text-rani-700"
              >
                {item.name}
              </Link>
              <p className="text-xs text-ink-500">{item.city}</p>
              <p className="mt-1.5 text-sm font-bold text-rani-800">
                {priceRange(item.priceMin, item.priceMax)}
              </p>
              <div className="mt-3 flex gap-2">
                <Link
                  href={`/book/${item.slug}`}
                  className="flex-1 rounded-full bg-rani-700 py-2.5 text-center text-xs font-bold text-white hover:bg-rani-800"
                >
                  Book Now
                </Link>
                <button
                  onClick={() => remove(item.artistId)}
                  className="rounded-full border border-cream-300 p-2.5 text-ink-500 hover:border-rani-300 hover:text-rani-700"
                  aria-label={`Remove ${item.name} from saved`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
