"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil, Plus, X } from "lucide-react";
import { createStyleAction, deleteStyleAction, updateStyleAction } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { ImageListInput } from "@/components/ImageListInput";
import type { Style } from "@/lib/types";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";
const label = "mb-1.5 block text-xs font-semibold text-ink-700";

export function StylesManager({
  styles,
  artistCounts,
}: {
  styles: Style[];
  artistCounts: Record<string, number>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<Style | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = editing
        ? await updateStyleAction(editing.id, formData)
        : await createStyleAction(formData);
      if (result.ok) {
        setEditing(null);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-3xl border border-cream-300 bg-white">
        <table className="w-full min-w-130 text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3.5">Style</th>
              <th className="px-5 py-3.5">Slug</th>
              <th className="px-5 py-3.5 text-right">Artists</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {styles.map((s) => (
              <tr
                key={s.id}
                className={`border-b border-cream-100 last:border-0 ${
                  editing?.id === s.id ? "bg-rani-50/50" : ""
                }`}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {s.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={s.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    )}
                    <span className="font-semibold text-ink-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-500">/{s.slug}</td>
                <td className="px-5 py-3 text-right text-ink-700">
                  {artistCounts[s.slug] ?? 0}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditing(s);
                        setError("");
                      }}
                      className="rounded-lg p-2 text-ink-500 transition hover:bg-cream-200 hover:text-rani-700"
                      aria-label={`Edit ${s.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <DeleteButton
                      label={s.name}
                      onDelete={deleteStyleAction.bind(null, s.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {styles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-12 text-center text-ink-500">
                  No styles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <p className="border-t border-cream-100 px-5 py-3 text-xs text-ink-500">
          Note: style delete karne par wo artists ki profiles se bhi apne aap hat jayegi.
        </p>
      </div>

      {/* ── Add / Edit form ── */}
      <form
        key={editing?.id ?? "new"}
        action={submit}
        className="h-fit rounded-3xl border border-cream-300 bg-white p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            {editing ? `Edit: ${editing.name}` : "Add style"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setError("");
              }}
              className="inline-flex items-center gap-1 rounded-full border border-cream-300 px-3 py-1.5 text-xs font-bold text-ink-700 hover:border-rani-300"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="st-name">Name *</label>
            <input id="st-name" name="name" required defaultValue={editing?.name} className={field} placeholder="Portrait Mehandi" />
          </div>
          <div>
            <label className={label} htmlFor="st-sort">Sort order</label>
            <input id="st-sort" name="sortOrder" type="number" defaultValue={editing?.sortOrder ?? 10} className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="st-slug">URL slug (blank = auto from name)</label>
            <input id="st-slug" name="slug" defaultValue={editing?.slug} className={field} placeholder="portrait-mehandi" />
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="st-desc">Description</label>
            <input id="st-desc" name="description" defaultValue={editing?.description} className={field} placeholder="Short line shown on the artists page" />
          </div>
          <div className="sm:col-span-2">
            <ImageListInput
              name="image"
              label="Style image (upload ya URL)"
              initial={editing?.image ? [editing.image] : []}
              single
            />
          </div>
        </div>
        {error && (
          <p className="mt-4 rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          {editing ? (
            <>
              <Pencil className="h-4 w-4" /> {pending ? "Saving…" : "Save changes"}
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add style"}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
