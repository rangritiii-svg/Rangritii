import { isSupabaseConfigured } from "./config";

/**
 * Admin authentication that works in two modes:
 *  - Demo mode: HMAC-signed cookie issued after checking DEMO_ADMIN_* creds.
 *  - Supabase mode: Supabase session + profiles.role === 'admin'.
 * Uses Web Crypto only, so it runs in both Node and Edge (middleware) runtimes.
 */

export const ADMIN_COOKIE = "rt_admin";
const SESSION_HOURS = 24;

export function demoAdminEmail(): string {
  return process.env.DEMO_ADMIN_EMAIL || "admin@rangritii.com";
}

export function demoAdminPassword(): string {
  return process.env.DEMO_ADMIN_PASSWORD || "rangritii123";
}

function secret(): string {
  return `rangritii-admin::${demoAdminPassword()}`;
}

async function hmac(message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Issue a signed demo-admin session token. */
export async function createDemoAdminToken(): Promise<string> {
  const expires = Date.now() + SESSION_HOURS * 3600 * 1000;
  const payload = `${demoAdminEmail()}|${expires}`;
  return `${payload}|${await hmac(payload)}`;
}

/** Verify a demo-admin session token. */
export async function verifyDemoAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const parts = token.split("|");
  if (parts.length !== 3) return false;
  const [email, expires, sig] = parts;
  if (Number(expires) < Date.now()) return false;
  const expected = await hmac(`${email}|${expires}`);
  return sig === expected;
}

export type AdminSession = { email: string; mode: "demo" | "supabase" };

/**
 * Server-side guard for admin pages & actions.
 * Returns the admin session, or null if the requester is not an admin.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  if (!isSupabaseConfigured()) {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const ok = await verifyDemoAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
    return ok ? { email: demoAdminEmail(), mode: "demo" } : null;
  }

  const { createClient } = await import("./supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") return null;
  return { email: user.email ?? "", mode: "supabase" };
}
