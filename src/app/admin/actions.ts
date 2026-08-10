"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/admin-auth";
import { parseArtistSelfFields, artistSlugFrom } from "@/lib/artist-form";
import {
  createArtist,
  createStyle,
  deleteArtist,
  deleteStyle,
  getArtistById,
  updateArtist,
} from "@/lib/data";
import { slugify } from "@/lib/format";
import { updateBookingStatus } from "@/lib/bookings";
import type { ArtistInput, BookingStatus } from "@/lib/types";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function requireAdmin(): Promise<void> {
  const session = await getAdminSession();
  if (!session) throw new Error("Not authorised. Please log in again.");
}

function parseAdminArtist(formData: FormData): ArtistInput {
  const fields = parseArtistSelfFields(formData);
  const slugRaw = String(formData.get("slug") ?? "").trim();
  const slug = slugRaw ? slugify(slugRaw) : artistSlugFrom(fields.name, fields.city);
  if (!slug) throw new Error("Could not derive a profile URL — please type one.");
  return {
    ...fields,
    userId: null,
    slug,
    isApproved: formData.get("isApproved") === "on",
    isActive: formData.get("isActive") === "on",
  };
}

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

export async function createArtistAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    await createArtist(parseAdminArtist(formData));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateArtistAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const existing = await getArtistById(id);
    if (!existing) throw new Error("Artist not found.");
    const input = parseAdminArtist(formData);
    // preserve the linked account — admin edits must never detach a user
    await updateArtist(id, { ...input, userId: existing.userId });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setArtistApprovalAction(
  id: string,
  approved: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateArtist(id, { isApproved: approved });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteArtistAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteArtist(id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateBookingStatusAction(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateBookingStatus(id, status as BookingStatus);
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function createStyleAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("Style name is required.");
    const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
    const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
    await createStyle({
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

export async function deleteStyleAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await deleteStyle(id);
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
