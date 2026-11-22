import "server-only";
import { isSupabaseConfigured, SITE } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type {
  Artist,
  ArtistInput,
  ArtistPackage,
  ContactMessage,
  PlatformSettings,
  Style,
} from "./types";

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
  packages: unknown;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
};

/** Columns the public may read. whatsapp / upi_id / upi_qr are private (owner + admin
 *  only, via the get_artist_private() function) so the "contact unlocks after the
 *  artist confirms" rule can't be bypassed through the API. */
const PUBLIC_COLS =
  "id, user_id, name, slug, bio, city, area, experience_years, price_min, price_max, styles, profile_image, portfolio_images, packages, is_approved, is_active, created_at";

export function parsePackages(raw: unknown): ArtistPackage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((p) => {
      const o = (p ?? {}) as Record<string, unknown>;
      return {
        id: String(o.id ?? ""),
        name: String(o.name ?? "").slice(0, 80),
        price: Math.max(0, Math.round(Number(o.price ?? 0))),
        unit: o.unit === "per_event" ? "per_event" : "per_person",
      } as ArtistPackage;
    })
    .filter((p) => p.id && p.name && p.price > 0);
}

/** Merge private columns (whatsapp/UPI) for artists the caller owns or administers. */
async function withPrivate(artists: Artist[]): Promise<Artist[]> {
  if (artists.length === 0) return artists;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_artist_private", {
    p_artist_ids: artists.map((a) => a.id),
  });
  if (error || !Array.isArray(data)) return artists;
  const byId = new Map(
    (data as { artist_id: string; whatsapp: string; upi_id: string; upi_qr: string }[]).map((r) => [
      r.artist_id,
      r,
    ])
  );
  return artists.map((a) => {
    const p = byId.get(a.id);
    return p ? { ...a, whatsapp: p.whatsapp ?? "", upiId: p.upi_id ?? "", upiQr: p.upi_qr ?? "" } : a;
  });
}

/** Strip characters that would break or alter a PostgREST `or()` filter. */
function safeSearch(q: string): string {
  return q.replace(/[^\p{L}\p{N}\s-]/gu, " ").trim().slice(0, 60);
}

type StyleRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sort_order: number;
};

function mapArtist(r: ArtistRow): Artist {
  let profileImage = r.profile_image ?? "";
  if (profileImage.endsWith(".svg") && profileImage.includes("/art/")) {
    profileImage = profileImage.replace(".svg", ".jpg");
  }
  const portfolioImages = (r.portfolio_images ?? []).map((img) =>
    img.endsWith(".svg") && img.includes("/art/") ? img.replace(".svg", ".jpg") : img
  );

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
    profileImage,
    portfolioImages,
    upiId: r.upi_id ?? "",
    upiQr: r.upi_qr ?? "",
    packages: parsePackages(r.packages),
    isApproved: r.is_approved,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapStyle(r: StyleRow): Style {
  let image = r.image ?? "";
  if (image.endsWith(".svg") && image.includes("/art/")) {
    image = image.replace(".svg", ".jpg");
  }
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    image,
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
    packages: input.packages,
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

export async function updateStyle(id: string, input: Omit<Style, "id">): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const idx = store.styles.findIndex((s) => s.id === id);
    if (idx === -1) throw new Error("Style not found.");
    const oldSlug = store.styles[idx].slug;
    if (store.styles.some((s) => s.slug === input.slug && s.id !== id)) {
      throw new Error("A style with this slug already exists.");
    }
    store.styles[idx] = { ...input, id };
    // keep artist references in sync when the slug changes
    if (oldSlug !== input.slug) {
      for (const a of store.artists) {
        a.styles = a.styles.map((s) => (s === oldSlug ? input.slug : s));
      }
    }
    return;
  }
  const supabase = await createClient();
  const { data: existing, error: readError } = await supabase
    .from("styles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!existing) throw new Error("Style not found.");

  const { error } = await supabase
    .from("styles")
    .update({
      name: input.name,
      slug: input.slug,
      description: input.description,
      image: input.image,
      sort_order: input.sortOrder,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  if (existing.slug !== input.slug) {
    const { data: artists } = await supabase
      .from("artists")
      .select("id, styles")
      .contains("styles", [existing.slug]);
    for (const a of artists ?? []) {
      await supabase
        .from("artists")
        .update({ styles: (a.styles as string[]).map((s) => (s === existing.slug ? input.slug : s)) })
        .eq("id", a.id);
    }
  }
}

/** Deletes a style and detaches it from every artist that referenced it. */
export async function deleteStyle(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const style = store.styles.find((s) => s.id === id);
    if (!style) return;
    store.styles = store.styles.filter((s) => s.id !== id);
    for (const a of store.artists) {
      a.styles = a.styles.filter((s) => s !== style.slug);
    }
    return;
  }
  const supabase = await createClient();
  const { data: style, error: readError } = await supabase
    .from("styles")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!style) return;

  const { error } = await supabase.from("styles").delete().eq("id", id);
  if (error) throw new Error(error.message);

  const { data: artists } = await supabase
    .from("artists")
    .select("id, styles")
    .contains("styles", [style.slug]);
  for (const a of artists ?? []) {
    await supabase
      .from("artists")
      .update({ styles: (a.styles as string[]).filter((s) => s !== style.slug) })
      .eq("id", a.id);
  }
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
  let req = supabase.from("artists").select(PUBLIC_COLS);
  if (!query.includeUnapproved) req = req.eq("is_approved", true).eq("is_active", true);
  if (query.city) req = req.ilike("city", query.city);
  if (query.style) req = req.contains("styles", [query.style]);
  const q = query.q ? safeSearch(query.q) : "";
  if (q) req = req.or(`name.ilike.%${q}%,city.ilike.%${q}%,area.ilike.%${q}%,bio.ilike.%${q}%`);
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
  const list = (data as unknown as ArtistRow[]).map(mapArtist);
  // Admin listings need payout details; public listings never get them.
  return query.includeUnapproved ? withPrivate(list) : list;
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
    .select(PUBLIC_COLS)
    .eq("slug", slug)
    .eq("is_approved", true)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapArtist(data as unknown as ArtistRow) : null;
}

export async function getArtistById(id: string): Promise<Artist | null> {
  if (!isSupabaseConfigured()) {
    const a = demoStore().artists.find((a) => a.id === id);
    return a ? { ...a } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("artists")
    .select(PUBLIC_COLS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [a] = await withPrivate([mapArtist(data as unknown as ArtistRow)]);
  return a;
}

/** Look up several artists at once, keyed by id (used to resolve booking → artist). */
export async function getArtistsByIds(ids: string[]): Promise<Map<string, Artist>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return new Map();

  if (!isSupabaseConfigured()) {
    return new Map(
      demoStore()
        .artists.filter((a) => unique.includes(a.id))
        .map((a) => [a.id, { ...a }])
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from("artists").select(PUBLIC_COLS).in("id", unique);
  if (error) throw new Error(error.message);
  return new Map((data as unknown as ArtistRow[]).map((r) => [r.id, mapArtist(r)]));
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
    .select(PUBLIC_COLS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [a] = await withPrivate([mapArtist(data as unknown as ArtistRow)]);
  return a;
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
    ["packages", "packages"],
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
  tokenAmount: 500,
  responseHours: 24,
  contactPhone: SITE.phone,
  contactWhatsapp: SITE.whatsapp,
  contactEmail: SITE.email,
  contactHours: "Mon–Sat, 10am–7pm",
};

type SettingsRow = {
  upi_id: string;
  upi_qr: string;
  commission_percent: number;
  token_amount?: number;
  response_hours?: number;
  contact_phone?: string;
  contact_whatsapp?: string;
  contact_email?: string;
  contact_hours?: string;
};

export async function getPlatformSettings(): Promise<PlatformSettings> {
  if (!isSupabaseConfigured()) {
    return { ...DEFAULT_SETTINGS, ...demoStore().settings };
  }
  const supabase = await createClient();
  // select("*") so the read keeps working even before the contact_* column
  // migration has been run on the database.
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Failed to load settings: ${error.message}`);
  if (!data) return { ...DEFAULT_SETTINGS };
  const row = data as SettingsRow;
  return {
    upiId: row.upi_id ?? "",
    upiQr: row.upi_qr ?? "",
    commissionPercent: Number(row.commission_percent ?? 10),
    tokenAmount: Number(row.token_amount ?? 500),
    responseHours: Number(row.response_hours ?? 24),
    contactPhone: row.contact_phone || SITE.phone,
    contactWhatsapp: row.contact_whatsapp || SITE.whatsapp,
    contactEmail: row.contact_email || SITE.email,
    contactHours: row.contact_hours || "Mon–Sat, 10am–7pm",
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
    token_amount: settings.tokenAmount,
    response_hours: settings.responseHours,
    contact_phone: settings.contactPhone,
    contact_whatsapp: settings.contactWhatsapp,
    contact_email: settings.contactEmail,
    contact_hours: settings.contactHours,
  });
  if (error) throw new Error(error.message);
}

/* ── Contact messages (admin inbox) ────────────────────────────────── */

export async function getContactMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseConfigured()) {
    return [...demoStore().messages];
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, message, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load messages: ${error.message}`);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name ?? "",
    email: row.email ?? "",
    message: row.message ?? "",
    createdAt: row.created_at ?? "",
  }));
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
