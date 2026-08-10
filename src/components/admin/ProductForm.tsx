"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createProductAction, updateProductAction } from "@/app/admin/actions";
import type { Category, Product } from "@/lib/types";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";
const label = "mb-1.5 block text-xs font-semibold text-ink-700";

export function ProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: Product;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = product
        ? await updateProductAction(product.id, formData)
        : await createProductAction(formData);
      if (result.ok) {
        router.push("/admin/products");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-6">
      <div className="rounded-3xl border border-cream-300 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Basics</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label} htmlFor="name">Product name *</label>
            <input id="name" name="name" required defaultValue={product?.name} className={field} placeholder="Gulaab Rani Co-ord Set" />
          </div>
          <div>
            <label className={label} htmlFor="slug">URL slug (blank = auto)</label>
            <input id="slug" name="slug" defaultValue={product?.slug} className={field} placeholder="gulaab-rani-coord-set" />
          </div>
          <div>
            <label className={label} htmlFor="categorySlug">Category *</label>
            <select
              id="categorySlug"
              name="categorySlug"
              required
              defaultValue={product?.categorySlug ?? categories[0]?.slug ?? ""}
              className={field}
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className={label} htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={4} defaultValue={product?.description} className={field} placeholder="Fabric, fit, occasion — tell the story." />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-cream-300 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Pricing & stock</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="price">Price (₹) *</label>
            <input id="price" name="price" type="number" min="0" step="1" required defaultValue={product?.price} className={field} placeholder="1499" />
          </div>
          <div>
            <label className={label} htmlFor="compareAtPrice">MRP / compare-at (₹)</label>
            <input id="compareAtPrice" name="compareAtPrice" type="number" min="0" step="1" defaultValue={product?.compareAtPrice ?? ""} className={field} placeholder="1999 (shows discount)" />
          </div>
          <div>
            <label className={label} htmlFor="stock">Stock *</label>
            <input id="stock" name="stock" type="number" min="0" step="1" required defaultValue={product?.stock ?? 10} className={field} />
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-cream-300 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Media & details</h2>
        <div className="mt-4 grid gap-4">
          <div>
            <label className={label} htmlFor="images">Image URLs (one per line)</label>
            <textarea
              id="images"
              name="images"
              rows={3}
              defaultValue={product?.images.join("\n")}
              className={field}
              placeholder={"/products/p-01.svg\nhttps://your-storage.supabase.co/…/photo.jpg"}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="sizes">Sizes (comma separated)</label>
              <input id="sizes" name="sizes" defaultValue={product?.sizes.join(", ") ?? "S, M, L, XL, XXL"} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="fabric">Fabric</label>
              <input id="fabric" name="fabric" defaultValue={product?.fabric} className={field} placeholder="Pure Cotton" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-cream-300 bg-white p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Visibility</h2>
        <div className="mt-4 flex flex-wrap gap-6">
          {[
            { name: "isActive", text: "Active (visible in store)", checked: product?.isActive ?? true },
            { name: "isNew", text: "Mark as NEW", checked: product?.isNew ?? false },
            { name: "isBestseller", text: "Mark as Bestseller", checked: product?.isBestseller ?? false },
          ].map((c) => (
            <label key={c.name} className="flex items-center gap-2.5 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                name={c.name}
                defaultChecked={c.checked}
                className="h-4.5 w-4.5 accent-rani-700"
              />
              {c.text}
            </label>
          ))}
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
          {pending ? "Saving…" : product ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-full border border-cream-300 bg-white px-8 py-3.5 text-sm font-semibold text-ink-700 hover:border-rani-300"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
