"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/config";

export type AuthResult = { ok: true; message?: string } | { ok: false; error: string };

export async function signIn(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts require the database to be connected." };
  }
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: "Incorrect email or password." };
  revalidatePath("/account");
  return { ok: true };
}

export async function signUp(formData: FormData): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Accounts require the database to be connected." };
  }
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!fullName) return { ok: false, error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 8)
    return { ok: false, error: "Password must be at least 8 characters." };

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/account");
  if (data.session) return { ok: true };
  return {
    ok: true,
    message: "Account created! Check your email to confirm, then log in.",
  };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/account");
}
