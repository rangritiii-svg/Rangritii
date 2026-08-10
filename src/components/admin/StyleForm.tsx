"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createStyleAction } from "@/app/admin/actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

export function StyleForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createStyleAction(formData);
      if (result.ok) {
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="rounded-3xl border border-cream-300 bg-white p-6"
    >
      <h2 className="font-display text-lg font-semibold text-ink-900">Add style</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="st-name">
            Name *
          </label>
          <input id="st-name" name="name" required className={field} placeholder="Portrait Mehandi" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="st-sort">
            Sort order
          </label>
          <input id="st-sort" name="sortOrder" type="number" defaultValue={10} className={field} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="st-desc">
            Description
          </label>
          <input id="st-desc" name="description" className={field} placeholder="Short line shown on the artists page" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="st-image">
            Image URL
          </label>
          <input id="st-image" name="image" className={field} placeholder="/art/style-bridal.svg or https://…" />
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
        <Plus className="h-4 w-4" /> {pending ? "Adding…" : "Add style"}
      </button>
    </form>
  );
}
