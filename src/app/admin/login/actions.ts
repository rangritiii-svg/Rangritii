"use server";

import { cookies } from "next/headers";
import { isSupabaseConfigured } from "@/lib/config";
import {
  ADMIN_COOKIE,
  createDemoAdminToken,
  demoAdminEmail,
  demoAdminPassword,
} from "@/lib/admin-auth";

export type AdminLoginResult = { ok: true } | { ok: false; error: string };

export async function adminLogin(formData: FormData): Promise<AdminLoginResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!isSupabaseConfigured()) {
    if (email !== demoAdminEmail().toLowerCase() || password !== demoAdminPassword()) {
      return { ok: false, error: "Incorrect admin email or password." };
    }
    const token = await createDemoAdminToken();
    const cookieStore = await cookies();
    cookieStore.set(ADMIN_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 24 * 3600,
    });
    return { ok: true };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return { ok: false, error: "Incorrect email or password." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    return { ok: false, error: "This account does not have admin access." };
  }
  return { ok: true };
}

export async function adminLogout(): Promise<void> {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    cookieStore.delete(ADMIN_COOKIE);
    return;
  }
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
}
