import { slugify } from "./format";

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
};

export function parseArtistSelfFields(formData: FormData): ArtistSelfFields {
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) throw new Error("Please enter the artist's name.");

  const whatsapp = String(formData.get("whatsapp") ?? "").replace(/\D/g, "");
  if (whatsapp && (whatsapp.length < 10 || whatsapp.length > 13)) {
    throw new Error("WhatsApp number should be 10 digits (ya 91 ke saath 12).");
  }

  const city = String(formData.get("city") ?? "").trim();
  if (!city) throw new Error("Please enter the city.");

  const experienceYears = Number(formData.get("experienceYears") ?? 0);
  if (!Number.isInteger(experienceYears) || experienceYears < 0 || experienceYears > 60) {
    throw new Error("Experience should be between 0 and 60 years.");
  }

  const priceMin = Number(formData.get("priceMin") ?? 0);
  const priceMax = Number(formData.get("priceMax") ?? 0);
  if (!Number.isFinite(priceMin) || priceMin < 0 || !Number.isFinite(priceMax) || priceMax < 0) {
    throw new Error("Enter valid prices.");
  }
  if (priceMax > 0 && priceMax < priceMin) {
    throw new Error("Maximum price minimum se kam nahi ho sakta.");
  }

  const styles = formData
    .getAll("styles")
    .map((s) => String(s).trim())
    .filter(Boolean);
  if (styles.length === 0) throw new Error("Kam se kam ek style chuno.");

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
    throw new Error("UPI ID sahi format mein daalo (jaise name@upi).");
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
  };
}

export function artistSlugFrom(name: string, city: string): string {
  return slugify(`${name}-${city}`) || `artist-${Date.now().toString(36)}`;
}
