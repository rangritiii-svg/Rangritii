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
  { value: "price-low", label: "Lowest price" },
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

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-2 text-[15px] font-medium ${
      active ? "border-rani-700 bg-rani-700 text-white" : "border-cream-300 bg-white text-ink-700 hover:border-rani-300"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-5 sm:px-6 lg:pt-10">
      <h1 className="font-display text-[30px] leading-tight text-ink-900 sm:text-4xl">{title}</h1>
      {activeStyle?.description && (
        <p className="mt-1 max-w-xl text-[15px] text-ink-500">{activeStyle.description}</p>
      )}

      {/* Style chips */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="Style">
        <Link href={buildHref(params, { style: undefined })} className={chip(!params.style)}>
          All styles
        </Link>
        {styles.map((s) => (
          <Link key={s.slug} href={buildHref(params, { style: s.slug })} className={chip(params.style === s.slug)}>
            {s.name}
          </Link>
        ))}
      </div>

      {/* City chips */}
      <div className="no-scrollbar -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0" aria-label="City">
        <MapPin className="h-4 w-4 shrink-0 text-ink-500" aria-hidden />
        <Link
          href={buildHref(params, { city: undefined })}
          className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${!params.city ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-cream-200"}`}
        >
          All cities
        </Link>
        {cities.map((c) => {
          const on = params.city?.toLowerCase() === c.toLowerCase();
          return (
            <Link
              key={c}
              href={buildHref(params, { city: c })}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${on ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-cream-200"}`}
            >
              {c}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-cream-300 pt-3">
        <p className="text-sm text-ink-500">
          {artists.length} {artists.length === 1 ? "artist" : "artists"}
        </p>
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto text-sm">
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={buildHref(params, { sort: s.value })}
              className={`shrink-0 rounded-full px-3 py-1.5 font-medium ${
                sort === s.value ? "bg-rani-50 text-rani-800" : "text-ink-500 hover:bg-cream-200"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      {artists.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-16 text-center">
          <p className="font-display text-2xl text-ink-900">No artists match these filters</p>
          <p className="mt-2 text-[15px] text-ink-500">
            Clear a filter, or message us on WhatsApp and we&apos;ll find an artist in your city.
          </p>
          <Link href="/artists" className="mt-6 inline-block rounded-full bg-rani-700 px-6 py-3 text-[15px] font-semibold text-white">
            Show all artists
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {artists.map((a) => (
            <ArtistCard key={a.id} artist={a} styles={styles} />
          ))}
        </div>
      )}
    </div>
  );
}
