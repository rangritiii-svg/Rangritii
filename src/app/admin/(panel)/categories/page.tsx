import { deleteCategoryAction } from "@/app/admin/actions";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { getCategories, getProducts } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({ includeInactive: true }),
  ]);
  const countFor = (slug: string) =>
    products.filter((p) => p.categorySlug === slug).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">Categories</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="overflow-x-auto rounded-3xl border border-cream-300 bg-white">
          <table className="w-full min-w-120 text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5 text-right">Products</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-cream-100 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {c.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <span className="font-semibold text-ink-900">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-500">/{c.slug}</td>
                  <td className="px-5 py-3 text-right text-ink-700">{countFor(c.slug)}</td>
                  <td className="px-5 py-3 text-right">
                    {countFor(c.slug) === 0 ? (
                      <DeleteButton
                        label={c.name}
                        onDelete={deleteCategoryAction.bind(null, c.id)}
                      />
                    ) : (
                      <span className="text-xs text-ink-300">has products</span>
                    )}
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-ink-500">
                    No categories yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <CategoryForm />
      </div>
    </div>
  );
}
