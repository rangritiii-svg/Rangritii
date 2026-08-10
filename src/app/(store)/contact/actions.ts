"use server";

import { isSupabaseConfigured } from "@/lib/config";

export type ContactResult = { ok: true } | { ok: false; error: string };

export async function sendMessage(formData: FormData): Promise<ContactResult> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Please enter a valid email." };
  if (message.length < 5) return { ok: false, error: "Please write a short message." };

  if (!isSupabaseConfigured()) {
    // Demo mode: accept the message without persistence.
    return { ok: true };
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name: name.slice(0, 120),
    email: email.slice(0, 200),
    message: message.slice(0, 2000),
  });
  if (error) return { ok: false, error: "Could not send your message. Please try WhatsApp." };
  return { ok: true };
}
