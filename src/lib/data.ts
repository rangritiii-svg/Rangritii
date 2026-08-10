import "server-only";
import { isSupabaseConfigured } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type { Category, Product, ProductInput } from "./types";

/* ── Row mappers (Supabase snake_case → app camelCase) ─────────────── */

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category_slug: string;
  images: string[];
  sizes: string[];
  fabric: string;
  stock: number;
  is_new: boolean;
  is_bestseller: boolean;
  is_active: boolean;
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sort_order: number;
};

function mapProduct(r: ProductRow): Product {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    price: Number(r.price),
    compareAtPrice: r.compare_at_price === null ? null : Number(r.compare_at_price),
    categorySlug: r.category_slug,
    images: r.images ?? [],
    sizes: r.sizes ?? [],
    fabric: r.fabric ?? "",
    stock: r.stock,
    isNew: r.is_new,
    isBestseller: r.is_bestseller,
    isActive: r.is_active,
    createdAt: r.created_at,
  };
}

function mapCategory(r: CategoryRow): Category {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description ?? "",
    image: r.image ?? "",
    sortOrder: r.sort_order,
  };
}

function toProductRow(input: ProductInput) {
  return {
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    compare_at_price: input.compareAtPrice,
    category_slug: input.categorySlug,
    images: input.images,
    sizes: input.sizes,
    fabric: input.fabric,
    stock: input.stock,
    is_new: input.isNew,
    is_bestseller: input.isBestseller,
    is_active: input.isActive,
  };
}

/* ── Categories ────────────────────────────────────────────────────── */

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return [...demoStore().categories].sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(`Failed to load categories: ${error.message}`);
  return (data as CategoryRow[]).map(mapCategory);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.slug === slug) ?? null;
}

export async function createCategory(input: Omit<Category, "id">): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    store.categories.push({ ...input, id: `c-${Date.now()}` });
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name: input.name,
    slug: input.slug,
    description: input.description,
    image: input.image,
    sort_order: input.sortOrder,
  });
  if (error) throw new Error(error.message);
}

export async function deleteCategory(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    store.categories = store.categories.filter((c) => c.id !== id);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ── Products ──────────────────────────────────────────────────────── */

export type ProductQuery = {
  category?: string;
  q?: string;
  sort?: "newest" | "price-low" | "price-high";
  onlyNew?: boolean;
  onlyBestsellers?: boolean;
  includeInactive?: boolean;
  limit?: number;
};

export async function getProducts(query: ProductQuery = {}): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    let items = demoStore().products.map((p) => ({ ...p }));
    if (!query.includeInactive) items = items.filter((p) => p.isActive);
    if (query.category) items = items.filter((p) => p.categorySlug === query.category);
    if (query.onlyNew) items = items.filter((p) => p.isNew);
    if (query.onlyBestsellers) items = items.filter((p) => p.isBestseller);
    if (query.q) {
      const q = query.q.toLowerCase();
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q)
      );
    }
    switch (query.sort) {
      case "price-low":
        items.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        items.sort((a, b) => b.price - a.price);
        break;
      default:
        items.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }
    return query.limit ? items.slice(0, query.limit) : items;
  }

  const supabase = await createClient();
  let req = supabase.from("products").select("*");
  if (!query.includeInactive) req = req.eq("is_active", true);
  if (query.category) req = req.eq("category_slug", query.category);
  if (query.onlyNew) req = req.eq("is_new", true);
  if (query.onlyBestsellers) req = req.eq("is_bestseller", true);
  if (query.q) req = req.or(`name.ilike.%${query.q}%,description.ilike.%${query.q}%`);
  switch (query.sort) {
    case "price-low":
      req = req.order("price", { ascending: true });
      break;
    case "price-high":
      req = req.order("price", { ascending: false });
      break;
    default:
      req = req.order("created_at", { ascending: false });
  }
  if (query.limit) req = req.limit(query.limit);
  const { data, error } = await req;
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    const p = demoStore().products.find((p) => p.slug === slug && p.isActive);
    return p ? { ...p } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as ProductRow) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    const p = demoStore().products.find((p) => p.id === id);
    return p ? { ...p } : null;
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapProduct(data as ProductRow) : null;
}

export async function createProduct(input: ProductInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    if (store.products.some((p) => p.slug === input.slug)) {
      throw new Error("A product with this slug already exists.");
    }
    store.products.push({
      ...input,
      id: `p-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert(toProductRow(input));
  if (error) throw new Error(error.message);
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const idx = store.products.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found.");
    if (store.products.some((p) => p.slug === input.slug && p.id !== id)) {
      throw new Error("A product with this slug already exists.");
    }
    store.products[idx] = { ...store.products[idx], ...input };
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update(toProductRow(input))
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    store.products = store.products.filter((p) => p.id !== id);
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
