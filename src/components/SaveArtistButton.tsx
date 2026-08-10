"use client";

import { Heart } from "lucide-react";
import { useSavedArtists, type SavedArtist } from "./SavedArtistsProvider";

export function SaveArtistButton({ item, large }: { item: SavedArtist; large?: boolean }) {
  const { has, toggle } = useSavedArtists();
  const active = has(item.artistId);

  return (
    <button
      onClick={() => toggle(item)}
      aria-label={active ? "Remove from saved artists" : "Save artist"}
      aria-pressed={active}
      className={`flex items-center justify-center rounded-full border shadow-sm transition ${
        large ? "h-12 w-12" : "h-9 w-9"
      } ${
        active
          ? "border-rani-300 bg-rani-50 text-rani-700"
          : "border-cream-300 bg-white/90 text-ink-500 hover:text-rani-700"
      }`}
    >
      <Heart className={`${large ? "h-5 w-5" : "h-4 w-4"} ${active ? "fill-rani-700" : ""}`} />
    </button>
  );
}
