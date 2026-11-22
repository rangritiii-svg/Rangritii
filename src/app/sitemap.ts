import type { MetadataRoute } from "next";
import { SITE } from "@/lib/config";
import { getArtists, getStyles } from "@/lib/data";

export const revalidate = 3600;

const STATIC_PATHS = [
  "/",
  "/artists",
  "/designs",
  "/join",
  "/about",
  "/contact",
  "/policies/cancellation-policy",
  "/policies/privacy-policy",
  "/policies/terms-of-service",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: `${SITE.url}${path === "/" ? "" : path}`,
    changeFrequency: path === "/" || path === "/artists" ? "daily" : "monthly",
    priority: path === "/" ? 1 : path === "/artists" ? 0.9 : 0.5,
  }));

  // The sitemap must still be served if the database is unreachable.
  try {
    const [artists, styles] = await Promise.all([getArtists({}), getStyles()]);
    for (const s of styles) {
      entries.push({ url: `${SITE.url}/artists?style=${s.slug}`, changeFrequency: "weekly", priority: 0.6 });
    }
    for (const a of artists) {
      entries.push({ url: `${SITE.url}/artist/${a.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    /* static pages only */
  }
  return entries;
}
