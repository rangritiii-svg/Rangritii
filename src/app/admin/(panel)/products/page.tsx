import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { deleteProductAction } from "@/app/admin/actions";
import { getCategories, getProducts } from "@/lib/data";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getProducts({ includeInactive: true }),
    getCategories(),
  ]);
  const categoryName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          Products <span className="text-lg text-ink-500">({products.length})</span>
        </h1>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800"
        >
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-cream-300 bg-white">
        <table className="w-full min-w-175 text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3.5">Product</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5 text-right">Price</th>
              <th className="px-5 py-3.5 text-right">Stock</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-cream-100 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0] || "/products/p-01.svg"}
                      alt=""
                      className="h-14 w-11 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-semibold text-ink-900">{p.name}</p>
                      <p className="text-xs text-ink-500">/{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-700">{categoryName(p.categorySlug)}</td>
                <td className="px-5 py-3 text-right font-semibold text-rani-800">
                  {formatINR(p.price)}
                </td>
                <td className="px-5 py-3 text-right">
                  <span className={p.stock === 0 ? "font-bold text-rani-700" : "text-ink-700"}>
                    {p.stock}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      p.isActive ? "bg-green-100 text-green-800" : "bg-cream-200 text-ink-500"
                    }`}
                  >
                    {p.isActive ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="rounded-lg p-2 text-ink-500 transition hover:bg-cream-200 hover:text-rani-700"
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton label={p.name} onDelete={deleteProductAction.bind(null, p.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-ink-500">
                  No products yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
