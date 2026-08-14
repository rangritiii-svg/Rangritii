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
  getPlatformSettings,
  updateArtist,
  updatePlatformSettings,
  updateStyle,
} from "@/lib/data";
import { slugify } from "@/lib/format";
import {
  markPaymentVerified,
  markSettled,
  setBookingAmount,
  updateBookingStatus,
} from "@/lib/bookings";
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

export async function updateSettingsAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    const upiId = String(formData.get("upiId") ?? "").trim().slice(0, 100);
    if (upiId && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId)) {
      throw new Error("Enter the UPI ID in a valid format (e.g. rangritii@upi).");
    }
    const commissionPercent = Number(formData.get("commissionPercent"));
    if (!Number.isFinite(commissionPercent) || commissionPercent < 0 || commissionPercent > 50) {
      throw new Error("Commission must be between 0 and 50%.");
    }
    const upiQr = String(formData.get("upiQr") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0] ?? "";

    const contactPhone = String(formData.get("contactPhone") ?? "").trim().slice(0, 50);
    const contactWhatsapp = String(formData.get("contactWhatsapp") ?? "").trim().replace(/[^\d]/g, "").slice(0, 20);
    const contactEmail = String(formData.get("contactEmail") ?? "").trim().slice(0, 100);
    const contactHours = String(formData.get("contactHours") ?? "").trim().slice(0, 100);

    await updatePlatformSettings({
      upiId,
      upiQr,
      commissionPercent,
      contactPhone,
      contactWhatsapp,
      contactEmail,
      contactHours,
    });
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setAmountAction(id: string, amount: number): Promise<ActionResult> {
  try {
    await requireAdmin();
    const settings = await getPlatformSettings();
    await setBookingAmount(id, amount, settings.commissionPercent);
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function verifyPaymentAction(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await markPaymentVerified(id);
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markSettledAction(id: string, utr: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    await markSettled(id, utr || undefined);
    revalidatePath("/admin/bookings");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

function parseStyle(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Style name is required.");
  const slug = slugify(String(formData.get("slug") ?? "").trim() || name);
  const sortOrder = Number(formData.get("sortOrder") ?? 0) || 0;
  // image comes from ImageListInput (newline-separated hidden input)
  const image =
    String(formData.get("image") ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean)[0] ?? "";
  return {
    name: name.slice(0, 100),
    slug,
    description: String(formData.get("description") ?? "").trim().slice(0, 300),
    image: image.slice(0, 500),
    sortOrder,
  };
}

export async function createStyleAction(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();
    await createStyle(parseStyle(formData));
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function updateStyleAction(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();
    await updateStyle(id, parseStyle(formData));
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
