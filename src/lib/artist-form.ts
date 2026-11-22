import { slugify } from "./format";
import type { ArtistPackage } from "./types";

/** Fields an artist can edit about themselves (no approval/slug/identity). */
export type ArtistSelfFields = {
  name: string;
  whatsapp: string;
  city: string;
  area: string;
  experienceYears: number;
  priceMin: number;
  priceMax: number;
  styles: string[];
  bio: string;
  profileImage: string;
  portfolioImages: string[];
  upiId: string;
  upiQr: string;
  packages: ArtistPackage[];
};

/** Packages arrive as JSON from the PackagesEditor hidden input. */
export function parsePackagesField(raw: string): ArtistPackage[] {
  let list: unknown;
  try {
    list = JSON.parse(raw || "[]");
  } catch {
    throw new Error("Could not read the packages — please re-enter them.");
  }
  if (!Array.isArray(list)) return [];
  const out: ArtistPackage[] = [];
  for (const item of list.slice(0, 12)) {
    const o = (item ?? {}) as Record<string, unknown>;
    const name = String(o.name ?? "").trim().slice(0, 80);
    const price = Math.round(Number(o.price ?? 0));
    if (!name && !price) continue;
    if (!name) throw new Error("Every package needs a name.");
    if (!Number.isFinite(price) || price < 50 || price > 500000) {
      throw new Error(`Enter a price between ₹50 and ₹5,00,000 for "${name}".`);
    }
    const id = String(o.id ?? "").replace(/[^\w-]/g, "").slice(0, 40) || `p-${Math.random().toString(36).slice(2, 10)}`;
    out.push({ id, name, price, unit: o.unit === "per_event" ? "per_event" : "per_person" });
  }
  return out;
}

export function parseArtistSelfFields(formData: FormData): ArtistSelfFields {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("Please enter the artist's name.");

  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) {
    throw new Error("WhatsApp number should be 10 digits (or 12 with the 91 prefix).");
  }

  const city = String(formData.get("city") ?? "").trim();
  if (!city) throw new Error("Please enter the city.");

  const experienceYears = Number(formData.get("experienceYears") ?? 0);
  if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60) {
    throw new Error("Experience should be between 0 and 60 years.");
  }

  const packages = parsePackagesField(String(formData.get("packages") ?? "[]"));
  let priceMin = Number(formData.get("priceMin") ?? 0);
  let priceMax = Number(formData.get("priceMax") ?? 0);
  if (packages.length > 0) {
    // the price range shown on cards follows the packages
    priceMin = Math.min(...packages.map((p) => p.price));
    priceMax = Math.max(...packages.map((p) => p.price));
  }
  if (!Number.isFinite(priceMin) || priceMin < 0 || !Number.isFinite(priceMax) || priceMax < 0) {
    throw new Error("Enter valid prices.");
  }
  if (priceMax > 0 && priceMax < priceMin) {
    throw new Error("Maximum price cannot be less than the minimum price.");
  }

  const styles = formData
    .getAll("styles")
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (styles.length === 0) throw new Error("Please choose at least one style.");

  const parseImages = (field: string) =>
    String(formData.get(field) ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);

  const profileImages = parseImages("profileImage");
  const portfolioImages = parseImages("portfolioImages");
  const upiQrImages = parseImages("upiQr");

  const upiId = String(formData.get("upiId") ?? "").trim().slice(0, 100);
  if (upiId && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
    throw new Error("Please enter the UPI ID in a valid format (e.g. name@upi).");
  }

  return {
    name: name.slice(0, 120),
    whatsapp: whatsapp.length === 10 ? `91${whatsapp}` : whatsapp,
    city: city.slice(0, 100),
    area: String(formData.get("area") ?? "").trim().slice(0, 100),
    experienceYears,
    priceMin,
    priceMax,
    styles: styles.slice(0, 10),
    bio: String(formData.get("bio") ?? "").trim().slice(0, 2000),
    profileImage: profileImages[0] ?? "",
    portfolioImages: portfolioImages.slice(0, 12),
    upiId,
    upiQr: upiQrImages[0] ?? "",
    packages,
  };
}

export function artistSlugFrom(name: string, city: string): string {
  return slugify(`${name}-${city}`) || `artist-${Date.now().toString(36)}`;
}
