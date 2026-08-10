"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import {
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateProduct,
} from "@/lib/data";
import { slugify } from "@/lib/format";
import { updateOrderStatus } from "@/lib/orders";
import type { OrderStatus, ProductInput } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorised. Please log in again.");
}

function parseProduct(formData: FormData): ProductInput {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Product name is required.");

  const price = Number(formData.get("price"));
  if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid price.");

  const compareRaw = String(formData.get("compareAtPrice") ?? "").trim();
  const compareAtPrice = compareRaw === "" ? null : Number(compareRaw);
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice < 0)) {
    throw new Error("Enter a valid compare-at price.");
  }

  const stock = Number(formData.get("stock"));
  if (!Number.isInteger(stock) || stock < 0) throw new Error("Enter a valid stock count.");

  const categorySlug = String(formData.get("categorySlug") ?? "").trim();
  if (!categorySlug) throw new Error("Please choose a category.");

  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugRaw || name);
  if (!slug) throw new Error("Could not derive a URL slug — please type one.");

  const images = String(formData.get("images") ?? "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const sizes = String(formData.get("sizes") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name: name.slice(0, 200),
    slug,
    description: String(formData.get("description") ?? "").trim().slice(0, 2000),
    price,
    compareAtPrice,
    categorySlug,
    images,
    sizes,
    fabric: String(formData.get("fabric") ?? "").trim().slice(0, 100),
    stock,
    isNew: formData.get("isNew") === "on",
    isBestseller: formData.get("isBestseller") === "on",
    isActive: formData.get("isActive") === "on",
  };
}

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

export async function createProductAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    await createProduct(parseProduct(formData));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateProductAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateProduct(id, parseProduct(formData));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteProduct(id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateOrderStatusAction(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateOrderStatus(id, status as OrderStatus);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createCategoryAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Category name is required.");
    const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
    const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
    await createCategory({
      name: name.slice(0, 100),
      slug,
      description: String(formData.get("description") ?? "").trim().slice(0, 300),
      image: String(formData.get("image") ?? "").trim().slice(0, 500),
      sortOrder,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteCategory(id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
