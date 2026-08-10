"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createArtistAction, updateArtistAction } from "@/app/admin/actions";
import type { Artist, Style } from "@/lib/types";
import { ArtistFields } from "@/components/ArtistFields";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

export function AdminArtistForm({
  styles,
  artist,
}: {
  styles: Style[];
  artist?: Artist;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = artist
        ? await updateArtistAction(artist.id, formData)
        : await createArtistAction(formData);
      if (result.ok) {
        router.push("/admin/artists");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <div className="space-y-5 rounded-3xl border border-cream-300 bg-white p-6">
        <ArtistFields styles={styles} artist={artist} />
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="slug">
            Profile URL slug (blank = auto)
          </label>
          <input id="slug" name="slug" defaultValue={artist?.slug} className={field} placeholder="meera-rathore-jaipur" />
        </div>
      </div>

      <div className="rounded-3xl border border-cream-300 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Visibility</h2>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              name="isApproved"
              defaultChecked={artist?.isApproved ?? true}
              className="h-4.5 w-4.5 accent-rani-700"
            />
            Approved (live on site)
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={artist?.isActive ?? true}
              className="h-4.5 w-4.5 accent-rani-700"
            />
            Active
          </label>
        </div>
      </div>

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
          {pending ? "Saving…" : artist ? "Save changes" : "Create artist"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/artists")}
          className="rounded-full border border-cream-300 bg-white px-8 py-3.5 text-sm font-semibold text-ink-700 hover:border-rani-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
