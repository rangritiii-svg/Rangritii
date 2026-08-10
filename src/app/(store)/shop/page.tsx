import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { getCategories, getProducts, type ProductQuery } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Shop" };

type Search = {
  category?: string;
  q?: string;
  sort?: string;
  filter?: string;
};

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
] as const;

function buildHref(params: Search, patch: Partial<Search>): string {
  const merged = { ...params, ...patch };
  const sp = new URLSearchParams();
  if (merged.category) sp.set("category", merged.category);
  if (merged.q) sp.set("q", merged.q);
  if (merged.filter) sp.set("filter", merged.filter);
  if (merged.sort && merged.sort !== "newest") sp.set("sort", merged.sort);
  const qs = sp.toString();
  return qs ? `/shop?${qs}` : "/shop";
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const sort: ProductQuery["sort"] =
    params.sort === "price-low" || params.sort === "price-high" ? params.sort : "newest";

  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts({
      category: params.category,
      q: params.q,
      sort,
      onlyNew: params.filter === "new",
      onlyBestsellers: params.filter === "bestsellers",
    }),
  ]);

  const activeCategory = categories.find((c) => c.slug === params.category);
  const title = params.q
    ? `Search: “${params.q}”`
    : params.filter === "new"
      ? "New Arrivals"
      : params.filter === "bestsellers"
        ? "Bestsellers"
        : activeCategory?.name ?? "Shop All";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-rani-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-900">{title}</span>
      </nav>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
        {title}
      </h1>
      {activeCategory?.description && (
        <p className="mt-2 max-w-xl text-sm text-ink-500">{activeCategory.description}</p>
      )}

      {/* Category pills */}
      <div className="no-scrollbar mt-6 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref(params, { category: undefined, filter: undefined })}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
            !params.category && !params.filter
              ? "border-rani-700 bg-rani-700 text-white"
              : "border-cream-300 bg-white text-ink-700 hover:border-rani-300"
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={buildHref(params, { category: c.slug, filter: undefined })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              params.category === c.slug
                ? "border-rani-700 bg-rani-700 text-white"
                : "border-cream-300 bg-white text-ink-700 hover:border-rani-300"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {products.length} {products.length === 1 ? "style" : "styles"}
        </p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-500">Sort:</span>
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={buildHref(params, { sort: s.value })}
              className={`rounded-full px-3 py-1.5 font-medium transition ${
                sort === s.value
                  ? "bg-rani-100 text-rani-800"
                  : "text-ink-700 hover:bg-cream-200"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Grid */}
      {products.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-cream-300 bg-white py-20 text-center">
          <p className="font-display text-2xl text-ink-900">Kuch nahi mila 😔</p>
          <p className="mt-2 text-sm text-ink-500">
            Try a different search or browse the full collection.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-rani-700 px-6 py-3 text-sm font-semibold text-white hover:bg-rani-800"
          >
            Shop All
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
