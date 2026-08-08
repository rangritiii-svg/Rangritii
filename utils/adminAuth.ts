/**
 * Admin session client.
 *
 * All admin authentication is verified SERVER-SIDE (see api/index.js):
 * credentials live only in Vercel environment variables, and the server
 * returns an HMAC-signed, expiring session token. The token is kept in
 * AsyncStorage and re-verified with the server every time the admin
 * dashboard is opened — so nobody can reach the dashboard without the
 * owner-configured credentials.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { VERIFICATION_CONFIG } from "@/constants/verificationConfig";

const BACKEND_URL = VERIFICATION_CONFIG.BACKEND_URL;
const TOKEN_KEY = "rangritii_admin_session_token";

async function postJson(path: string, body: object) {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, data };
}

/** Email + password login. Resolves with the admin email, throws on failure. */
export async function adminLoginWithPassword(email: string, password: string): Promise<string> {
  const { ok, data } = await postJson("/api/admin/login", { email, password });
  if (!ok || !data.success || !data.token) {
    throw new Error(data.error || "Admin login failed. Please try again.");
  }
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.email;
}

/** Google login — pass the Google ID token from signInWithGoogle(). */
export async function adminLoginWithGoogle(idToken: string): Promise<string> {
  const { ok, data } = await postJson("/api/admin/google", { idToken });
  if (!ok || !data.success || !data.token) {
    throw new Error(data.error || "This Google account is not authorized for admin access.");
  }
  await AsyncStorage.setItem(TOKEN_KEY, data.token);
  return data.email;
}

/** Checks the stored session token with the server. */
export async function verifyAdminSession(): Promise<{ valid: boolean; email?: string }> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return { valid: false };
    const { ok, data } = await postJson("/api/admin/session", { token });
    if (!ok || !data.valid) return { valid: false };
    return { valid: true, email: data.email };
  } catch (_e) {
    return { valid: false };
  }
}

export async function clearAdminSession(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
}
