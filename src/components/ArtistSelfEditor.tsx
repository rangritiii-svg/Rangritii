"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Pencil } from "lucide-react";
import { updateOwnArtistProfile } from "@/app/(store)/account/actions";
import type { Artist, Style } from "@/lib/types";
import { ArtistFields } from "./ArtistFields";

export function ArtistSelfEditor({
  artist,
  styles,
}: {
  artist: Artist;
  styles: Style[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            setOpen(true);
            setSaved(false);
          }}
          className="inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-6 py-3 text-sm font-bold text-rani-700 transition hover:bg-rani-50"
        >
          <Pencil className="h-4 w-4" /> Edit My Profile
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Saved!
          </span>
        )}
      </div>
    );
  }

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await updateOwnArtistProfile(formData);
      if (result.ok) {
        setOpen(false);
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-5 rounded-3xl border border-cream-300 bg-white p-6">
      <ArtistFields styles={styles} artist={artist} />
      {error && (
        <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-rani-700 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Profile"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border border-cream-300 bg-white px-8 py-3.5 text-sm font-semibold text-ink-700 hover:border-rani-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
