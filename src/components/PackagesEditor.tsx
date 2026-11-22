"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { ArtistPackage } from "@/lib/types";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-[15px] outline-none focus:border-rani-400";

const SUGGESTED: Omit<ArtistPackage, "id">[] = [
  { name: "Bridal — full hands & feet", price: 5100, unit: "per_person" },
  { name: "Guest — both hands", price: 500, unit: "per_person" },
  { name: "Kids / simple palm", price: 300, unit: "per_person" },
];

const newId = () => `p-${Math.random().toString(36).slice(2, 10)}`;

/** Artist's price list. Customers pick from these at booking time, so the total is
 *  known before they pay the token. Sent to the server as JSON in a hidden input. */
export function PackagesEditor({ initial }: { initial: ArtistPackage[] }) {
  const [rows, setRows] = useState<ArtistPackage[]>(
    initial.length ? initial : SUGGESTED.map((s) => ({ ...s, id: newId() }))
  );
  const update = (i: number, patch: Partial<ArtistPackage>) =>
    setRows((r) => r.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <div className="rounded-2xl border border-cream-300 bg-white p-4">
      <p className="text-[15px] font-semibold text-ink-900">Your packages & prices</p>
      <p className="mt-0.5 text-sm text-ink-500">
        Customers choose from these when they book, so they see the total up front.
      </p>
      <input type="hidden" name="packages" value={JSON.stringify(rows)} />
      <ul className="mt-3 space-y-3">
        {rows.map((p, i) => (
          <li key={p.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-xl bg-cream-100 p-3 sm:grid-cols-[1fr_120px_140px_auto]">
            <input
              aria-label="Package name"
              value={p.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="e.g. Bridal full hands"
              className={`${field} col-span-2 sm:col-span-1`}
            />
            <input
              aria-label="Price in rupees"
              type="number"
              inputMode="numeric"
              min={50}
              step={50}
              value={p.price || ""}
              onChange={(e) => update(i, { price: Number(e.target.value) })}
              placeholder="₹"
              className={field}
            />
            <select
              aria-label="Charged"
              value={p.unit}
              onChange={(e) => update(i, { unit: e.target.value as ArtistPackage["unit"] })}
              className={field}
            >
              <option value="per_person">per person</option>
              <option value="per_event">per event</option>
            </select>
            <button
              type="button"
              onClick={() => setRows((r) => r.filter((_, j) => j !== i))}
              className="grid h-11 w-11 place-items-center rounded-xl text-ink-500 hover:bg-white hover:text-rani-700"
              aria-label={`Remove ${p.name || "package"}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      {rows.length < 12 && (
        <button
          type="button"
          onClick={() => setRows((r) => [...r, { id: newId(), name: "", price: 0, unit: "per_person" }])}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-cream-300 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-rani-300"
        >
          <Plus className="h-4 w-4" /> Add a package
        </button>
      )}
    </div>
  );
}
