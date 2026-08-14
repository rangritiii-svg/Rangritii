"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";
import { parseArtistSelfFields, artistSlugFrom } from "@/lib/artist-form";
import { createArtist, getArtistByUserId } from "@/lib/data";

export type JoinResult = { ok: true } | { ok: false; error: string };

export async function submitArtistProfile(formData: FormData): Promise<JoinResult> {
  try {
    if (!isSupabaseConfigured()) {
      return {
        ok: false,
        error:
          "Artist registration needs the database to be connected. (In demo mode, you can add artists from the admin panel.)",
      };
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: "Please log in first, then submit your profile." };

    const existing = await getArtistByUserId(user.id);
    if (existing) {
      return { ok: false, error: "You already have an artist profile — check your account page." };
    }

    const fields = parseArtistSelfFields(formData);
    let slug = artistSlugFrom(fields.name, fields.city);
    // ensure slug uniqueness with a short random suffix on conflict
    const { data: clash } = await supabase
      .from("artists")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (clash) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    await createArtist({
      ...fields,
      userId: user.id,
      slug,
      isApproved: false,
      isActive: true,
    });
    revalidatePath("/account");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
    };
  }
}
