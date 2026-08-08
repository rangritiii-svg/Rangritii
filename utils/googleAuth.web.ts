/**
 * Google Sign-In — WEB implementation (Firebase Auth popup).
 * Metro automatically uses this file instead of ./googleAuth.ts when
 * bundling for the website.
 *
 * Requires the Google provider to be enabled once in
 * Firebase Console → Authentication → Sign-in method. No client ID needed here.
 */

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import app from "@/firebase/config";

export interface GoogleSignInResult {
  email: string;
  name: string;
  photoUrl?: string;
  /** Google-issued ID token — used by the backend to verify admin sign-ins */
  idToken?: string;
}

export function isGoogleSignInAvailable(): boolean {
  return true;
}

export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const user = result.user;

    if (!user.email) {
      throw new Error("Could not read the email address of the selected Google account.");
    }

    return {
      email: user.email.toLowerCase(),
      name: user.displayName || user.email.split("@")[0],
      photoUrl: user.photoURL || undefined,
      idToken: credential?.idToken || undefined,
    };
  } catch (err: any) {
    if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
      throw new Error("Google sign-in was cancelled.");
    }
    if (err?.code === "auth/operation-not-allowed") {
      throw new Error(
        "Google sign-in is not enabled for this project yet. Enable the Google provider in Firebase Console → Authentication → Sign-in method."
      );
    }
    if (err?.code === "auth/popup-blocked") {
      throw new Error("The sign-in popup was blocked by the browser. Please allow popups and try again.");
    }
    throw new Error(err?.message || "Google sign-in failed. Please try again.");
  }
}
