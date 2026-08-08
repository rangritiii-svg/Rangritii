/**
 * Google Sign-In — NATIVE (Android/iOS) implementation.
 * The website uses ./googleAuth.web.ts instead (Metro picks the .web file
 * automatically when bundling for web).
 *
 * Uses @react-native-google-signin/google-signin, which requires a native
 * rebuild after install (npx expo run:android). Until the app is rebuilt the
 * button shows a friendly setup message instead of crashing.
 */

import { GOOGLE_WEB_CLIENT_ID } from "@/constants/googleAuth";

export interface GoogleSignInResult {
  email: string;
  name: string;
  photoUrl?: string;
  /** Google-issued ID token — used by the backend to verify admin sign-ins */
  idToken?: string;
}

let GoogleSignin: any = null;
try {
  GoogleSignin = require("@react-native-google-signin/google-signin").GoogleSignin;
} catch (_e) {
  GoogleSignin = null;
}

export function isGoogleSignInAvailable(): boolean {
  return !!GoogleSignin;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  if (!GoogleSignin) {
    throw new Error(
      "Google Sign-In is not included in this build. Rebuild the app (npx expo run:android) to enable it."
    );
  }
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      "Google Sign-In is not configured yet. Add your Firebase Web Client ID in constants/googleAuth.ts and rebuild."
    );
  }

  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();

    // v13+ returns { type: "success" | "cancelled", data: {...} };
    // older versions return the user info object directly.
    if (result?.type === "cancelled") {
      throw new Error("Google sign-in was cancelled.");
    }
    const payload = result?.data ?? result;
    const user = payload?.user;
    const idToken = payload?.idToken ?? user?.idToken;

    if (!user?.email) {
      throw new Error("Could not read the email address of the selected Google account.");
    }

    return {
      email: String(user.email).toLowerCase(),
      name: user.name || user.givenName || String(user.email).split("@")[0],
      photoUrl: user.photo || undefined,
      idToken: idToken || undefined,
    };
  } catch (err: any) {
    // Normalize the native module's error shapes into a readable message
    if (err?.code === "SIGN_IN_CANCELLED" || /cancelled/i.test(err?.message || "")) {
      throw new Error("Google sign-in was cancelled.");
    }
    if (err?.code === "PLAY_SERVICES_NOT_AVAILABLE") {
      throw new Error("Google Play Services is not available or outdated on this device.");
    }
    throw new Error(err?.message || "Google sign-in failed. Please try again.");
  }
}
