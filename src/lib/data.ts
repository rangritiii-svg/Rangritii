import "server-only";
import { isSupabaseConfigured } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type { Artist, ArtistInput, PlatformSettings, Style } from "./types";

/* ── Row mappers (Supabase snake_case → app camelCase) ─────────────── */

type ArtistRow = {
  id: string;
  user_id: string | null;
  name: string;
  slug: string;
  bio: string;
  city: string;
  area: string;
  whatsapp: string;
  experience_years: number;
  price_min: number;
  price_max: number;
  styles: string[];
  profile_image: string;
  portfolio_images: string[];
  upi_id: string;
  upi_qr: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
};

type StyleRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sort_order: number;
};

function mapArtist(r: ArtistRow): Artist {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    slug: r.slug,
    bio: r.bio ?? "",
    city: r.city ?? "",
    area: r.area ?? "",
    whatsapp: r.whatsapp ?? "",
    experienceYears: r.experience_years ?? 0,
    priceMin: Number(r.price_min ?? 0),
    priceMax: Number(r.price_max ?? 0),
    styles: r.styles ?? [],
    profileImage: r.profile_image ?? "",
    portfolioImages: r.portfolio_images ?? [],
    upiId: r.upi_id ?? "",
    upiQr: r.upi_qr ?? "",
    isApproved: r.is_approved,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapStyle(r: StyleRow): Style {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    image: r.image ?? "",
    sortOrder: r.sort_order,
  };
}

function toArtistRow(input: ArtistInput) {
  return {
    user_id: input.userId,
    name: input.name,
    slug: input.slug,
    bio: input.bio,
    city: input.city,
    area: input.area,
    whatsapp: input.whatsapp,
    experience_years: input.experienceYears,
    price_min: input.priceMin,
    price_max: input.priceMax,
    styles: input.styles,
    profile_image: input.profileImage,
    portfolio_images: input.portfolioImages,
    upi_id: input.upiId,
    upi_qr: input.upiQr,
    is_approved: input.isApproved,
    is_active: input.isActive,
  };
}

/* ── Styles ────────────────────────────────────────────────────────── */

export async function getStyles(): Promise<Style[]> {
  if (!isSupabaseConfigured()) {
    return [...demoStore().styles].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("styles").select("*").order("sort_order");
  if (error) throw new Error(`Failed to load styles: ${error.message}`);
  return (data as StyleRow[]).map(mapStyle);
}

export async function createStyle(input: Omit<Style, "id">): Promise<void> {
  if (!isSupabaseConfigured()) {
    demoStore().styles.push({ ...input, id: `s-${Date.now()}` });
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("styles").insert({
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function deleteStyle(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    store.styles = store.styles.filter((s) => s.id !== id);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("styles").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ── Artists ───────────────────────────────────────────────────────── */

export type ArtistQuery = {
  city?: string;
  style?: string;
  q?: string;
  sort?: "experienced" | "price-low" | "newest";
  includeUnapproved?: boolean;
  limit?: number;
};

export async function getArtists(query: ArtistQuery = {}): Promise<Artist[]> {
  if (!isSupabaseConfigured()) {
    let items = demoStore().artists.map((a) => ({ ...a }));
    if (!query.includeUnapproved) {
      items = items.filter((a) => a.isApproved && a.isActive);
    }
    if (query.city) items = items.filter((a) => a.city.toLowerCase() === query.city!.toLowerCase());
    if (query.style) items = items.filter((a) => a.styles.includes(query.style!));
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.city.toLowerCase().includes(q) ||
          a.area.toLowerCase().includes(q) ||
          a.bio.toLowerCase().includes(q)
      );
    }
    switch (query.sort) {
      case "price-low":
        items.sort((a, b) => a.priceMin - b.priceMin);
        break;
      case "newest":
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        items.sort((a, b) => b.experienceYears - a.experienceYears);
    }
    return query.limit ? items.slice(0, query.limit) : items;
  }

  const supabase = await createClient();
  let req = supabase.from("artists").select("*");
  if (!query.includeUnapproved) req = req.eq("is_approved", true).eq("is_active", true);
  if (query.city) req = req.ilike("city", query.city);
  if (query.style) req = req.contains("styles", [query.style]);
  if (query.q) req = req.or(`name.ilike.%${query.q}%,city.ilike.%${query.q}%,bio.ilike.%${query.q}%`);
  switch (query.sort) {
    case "price-low":
      req = req.order("price_min", { ascending: true });
      break;
    case "newest":
      req = req.order("created_at", { ascending: false });
      break;
    default:
      req = req.order("experience_years", { ascending: false });
  }
  if (query.limit) req = req.limit(query.limit);
  const { data, error } = await req;
  if (error) throw new Error(`Failed to load artists: ${error.message}`);
  return (data as ArtistRow[]).map(mapArtist);
}

/** Distinct city list for the filter dropdown (approved artists only). */
export async function getCities(): Promise<string[]> {
  const artists = await getArtists();
  return [...new Set(artists.map((a) => a.city).filter(Boolean))].sort();
}

export async function getArtistBySlug(slug: string): Promise<Artist | null> {
  if (!isSupabaseConfigured()) {
    const a = demoStore().artists.find(
      (a) => a.slug === slug && a.isApproved && a.isActive
    );
    return a ? { ...a } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("slug", slug)
    .eq("is_approved", true)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArtist(data as ArtistRow) : null;
}

export async function getArtistById(id: string): Promise<Artist | null> {
  if (!isSupabaseConfigured()) {
    const a = demoStore().artists.find((a) => a.id === id);
    return a ? { ...a } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArtist(data as ArtistRow) : null;
}

/** The artist profile owned by a logged-in user (any approval state). */
export async function getArtistByUserId(userId: string): Promise<Artist | null> {
  if (!isSupabaseConfigured()) {
    const a = demoStore().artists.find((a) => a.userId === userId);
    return a ? { ...a } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArtist(data as ArtistRow) : null;
}

export async function createArtist(input: ArtistInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    if (store.artists.some((a) => a.slug === input.slug)) {
      throw new Error("An artist with this profile URL already exists.");
    }
    store.artists.push({
      ...input,
      id: `a-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("artists").insert(toArtistRow(input));
  if (error) throw new Error(error.message);
}

export async function updateArtist(id: string, input: Partial<ArtistInput>): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const idx = store.artists.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Artist not found.");
    if (
      input.slug &&
      store.artists.some((a) => a.slug === input.slug && a.id !== id)
    ) {
      throw new Error("An artist with this profile URL already exists.");
    }
    store.artists[idx] = { ...store.artists[idx], ...input };
    return;
  }
  const supabase = await createClient();
  const row: Record<string, unknown> = {};
  const full = toArtistRow(input as ArtistInput);
  for (const [key, camel] of [
    ["name", "name"],
    ["slug", "slug"],
    ["bio", "bio"],
    ["city", "city"],
    ["area", "area"],
    ["whatsapp", "whatsapp"],
    ["experience_years", "experienceYears"],
    ["price_min", "priceMin"],
    ["price_max", "priceMax"],
    ["styles", "styles"],
    ["profile_image", "profileImage"],
    ["portfolio_images", "portfolioImages"],
    ["upi_id", "upiId"],
    ["upi_qr", "upiQr"],
    ["is_approved", "isApproved"],
    ["is_active", "isActive"],
  ] as const) {
    if ((input as Record<string, unknown>)[camel] !== undefined) {
      row[key] = (full as Record<string, unknown>)[key];
    }
  }
  const { error } = await supabase.from("artists").update(row).eq("id", id);
  if (error) throw new Error(error.message);
}

/* ── Platform settings (admin UPI, commission) ─────────────────────── */

const DEFAULT_SETTINGS: PlatformSettings = {
  upiId: "",
  upiQr: "",
  commissionPercent: 10,
};

type SettingsRow = {
  upi_id: string;
  upi_qr: string;
  commission_percent: number;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!isSupabaseConfigured()) {
    return { ...demoStore().settings };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("platform_settings")
    .select("upi_id, upi_qr, commission_percent")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  if (!data) return { ...DEFAULT_SETTINGS };
  const row = data as SettingsRow;
  return {
    upiId: row.upi_id ?? "",
    upiQr: row.upi_qr ?? "",
    commissionPercent: Number(row.commission_percent ?? 10),
  };
}

export async function updatePlatformSettings(settings: PlatformSettings): Promise<void> {
  if (!isSupabaseConfigured()) {
    demoStore().settings = { ...settings };
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("platform_settings").upsert({
    id: 1,
    upi_id: settings.upiId,
    upi_qr: settings.upiQr,
    commission_percent: settings.commissionPercent,
  });
  if (error) throw new Error(error.message);
}

export async function deleteArtist(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    store.artists = store.artists.filter((a) => a.id !== id);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("artists").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
