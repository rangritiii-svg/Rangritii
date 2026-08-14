"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, X } from "lucide-react";

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

/**
 * Manage a list of image URLs: upload files to Supabase Storage (when
 * configured and logged in) or paste URLs manually. Exposes the list via a
 * hidden input so plain FormData server actions can read it.
 */
export function ImageListInput({
  name,
  label,
  initial = [],
  max = 12,
  single = false,
}: {
  name: string;
  label: string;
  initial?: string[];
  max?: number;
  single?: boolean;
}) {
  const [urls, setUrls] = useState<string[]>(initial);
  const [manual, setManual] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const limit = single ? 1 : max;

  function addUrl(url: string) {
    const clean = url.trim();
    if (!clean) return;
    setUrls((prev) => {
      if (prev.includes(clean)) return prev;
      const next = single ? [clean] : [...prev, clean];
      return next.slice(0, limit);
    });
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("You need to be logged in to upload — or paste a URL below.");
        return;
      }
      for (const file of Array.from(files).slice(0, limit)) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setError("Each photo must be under 5MB.");
          continue;
        }
        const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { data, error: upErr } = await supabase.storage
          .from("portfolios")
          .upload(path, file, { upsert: false });
        if (upErr) {
          setError(`Upload failed: ${upErr.message}`);
          continue;
        }
        const { data: pub } = supabase.storage.from("portfolios").getPublicUrl(data.path);
        addUrl(pub.publicUrl);
      }
    } catch {
      setError("Something went wrong while uploading — try pasting a URL.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 block text-xs font-semibold text-ink-700">{label}</p>
      <input type="hidden" name={name} value={urls.join("\n")} />

      {urls.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {urls.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="h-20 w-20 rounded-xl border border-cream-300 object-cover"
              />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-rani-700 p-1 text-white shadow"
                aria-label="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {supabaseConfigured && urls.length < limit && (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple={!single}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 rounded-full border-2 border-rani-700 px-5 py-2.5 text-xs font-bold text-rani-700 transition hover:bg-rani-50 disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {uploading ? "Uploading…" : "Upload photo"}
            </button>
          </>
        )}
        {urls.length < limit && (
          <div className="flex min-w-52 flex-1 items-center gap-2">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="…or paste an image URL"
              className="w-full rounded-full border border-cream-300 bg-white px-4 py-2.5 text-xs outline-none focus:border-rani-400"
            />
            <button
              type="button"
              onClick={() => {
                addUrl(manual);
                setManual("");
              }}
              className="rounded-full bg-cream-200 p-2.5 text-ink-700 hover:bg-cream-300"
              aria-label="Add image URL"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-rani-700">{error}</p>}
    </div>
  );
}
