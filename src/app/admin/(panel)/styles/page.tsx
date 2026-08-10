import { StylesManager } from "@/components/admin/StylesManager";
import { getArtists, getStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminStylesPage() {
  const [styles, artists] = await Promise.all([
    getStyles(),
    getArtists({ includeUnapproved: true }),
  ]);
  const artistCounts: Record<string, number> = {};
  for (const s of styles) {
    artistCounts[s.slug] = artists.filter((a) => a.styles.includes(s.slug)).length;
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">Styles</h1>
      <p className="mt-1 text-sm text-ink-500">
        Style ka naam, image (upload bhi kar sakte ho) aur order edit karo — ya nayi add
        karo.
      </p>
      <div className="mt-6">
        <StylesManager styles={styles} artistCounts={artistCounts} />
      </div>
    </div>
  );
}
