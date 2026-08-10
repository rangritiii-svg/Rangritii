import type { Metadata } from "next";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { ArtistCard } from "@/components/ArtistCard";
import { getArtists, getCities, getStyles, type ArtistQuery } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Find Mehandi Artists" };

type Search = {
  city?: string;
  style?: string;
  q?: string;
  sort?: string;
};

const SORTS = [
  { value: "experienced", label: "Most experienced" },
  { value: "price-low", label: "Price: low to high" },
  { value: "newest", label: "Newest" },
] as const;

function buildHref(params: Search, patch: Partial<Search>): string {
  const merged = { ...params, ...patch };
  const sp = new URLSearchParams();
  if (merged.city) sp.set("city", merged.city);
  if (merged.style) sp.set("style", merged.style);
  if (merged.q) sp.set("q", merged.q);
  if (merged.sort && merged.sort !== "experienced") sp.set("sort", merged.sort);
  const qs = sp.toString();
  return qs ? `/artists?${qs}` : "/artists";
}

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const sort: ArtistQuery["sort"] =
    params.sort === "price-low" || params.sort === "newest" ? params.sort : "experienced";

  const [styles, cities, artists] = await Promise.all([
    getStyles(),
    getCities(),
    getArtists({ city: params.city, style: params.style, q: params.q, sort }),
  ]);

  const activeStyle = styles.find((s) => s.slug === params.style);
  const title = params.q
    ? `Search: “${params.q}”`
    : activeStyle
      ? `${activeStyle.name} Artists`
      : params.city
        ? `Mehandi Artists in ${params.city}`
        : "Find Mehandi Artists";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="text-xs text-ink-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-rani-700">Home</Link>
        <span className="mx-1.5">/</span>
        <span className="text-ink-900">Artists</span>
      </nav>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
        {title}
      </h1>
      {activeStyle?.description && (
        <p className="mt-2 max-w-xl text-sm text-ink-500">{activeStyle.description}</p>
      )}

      {/* City filter */}
      <div className="no-scrollbar mt-6 flex items-center gap-2 overflow-x-auto pb-1">
        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold uppercase tracking-wider text-ink-500">
          <MapPin className="h-3.5 w-3.5 text-rani-700" /> City:
        </span>
        <Link
          href={buildHref(params, { city: undefined })}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
            !params.city
              ? "border-rani-700 bg-rani-700 text-white"
              : "border-cream-300 bg-white text-ink-700 hover:border-rani-300"
          }`}
        >
          All India
        </Link>
        {cities.map((c) => (
          <Link
            key={c}
            href={buildHref(params, { city: c })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              params.city?.toLowerCase() === c.toLowerCase()
                ? "border-rani-700 bg-rani-700 text-white"
                : "border-cream-300 bg-white text-ink-700 hover:border-rani-300"
            }`}
          >
            {c}
          </Link>
        ))}
      </div>

      {/* Style pills */}
      <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
        <Link
          href={buildHref(params, { style: undefined })}
          className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
            !params.style
              ? "border-marigold-500 bg-marigold-500 text-white"
              : "border-cream-300 bg-white text-ink-700 hover:border-marigold-300"
          }`}
        >
          All Styles
        </Link>
        {styles.map((s) => (
          <Link
            key={s.slug}
            href={buildHref(params, { style: s.slug })}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition ${
              params.style === s.slug
                ? "border-marigold-500 bg-marigold-500 text-white"
                : "border-cream-300 bg-white text-ink-700 hover:border-marigold-300"
            }`}
          >
            {s.name}
          </Link>
        ))}
      </div>

      {/* Toolbar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {artists.length} {artists.length === 1 ? "artist" : "artists"}
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
      {artists.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-cream-300 bg-white py-20 text-center">
          <p className="font-display text-2xl text-ink-900">Koi artist nahi mila 😔</p>
          <p className="mt-2 text-sm text-ink-500">
            Filter badal ke dekho, ya humein WhatsApp karo — hum aapke liye artist
            dhundh denge.
          </p>
          <Link
            href="/artists"
            className="mt-6 inline-block rounded-full bg-rani-700 px-6 py-3 text-sm font-semibold text-white hover:bg-rani-800"
          >
            All Artists
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} styles={styles} />
          ))}
        </div>
      )}
    </div>
  );
}
