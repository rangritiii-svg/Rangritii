/**
 * Google Sign-In configuration.
 *
 * HOW TO SET UP (one-time):
 * 1. Firebase Console → Authentication → Sign-in method → enable "Google".
 *    This auto-creates a Web OAuth client for the project.
 * 2. Copy the "Web client ID" shown under the Google provider settings
 *    (it looks like  793048443440-xxxxxxxx.apps.googleusercontent.com )
 *    and paste it below.
 * 3. For the Android app: add your SHA-1 fingerprint in Firebase Console →
 *    Project settings → Your apps → Android app, then re-download
 *    google-services.json into the project root and rebuild
 *    (npx expo run:android or an EAS build).
 *
 * The website ("Continue with Google" popup) needs only step 1 — no client ID
 * in code. The native Android flow needs the Web client ID below.
 */
export const GOOGLE_WEB_CLIENT_ID =
  "793048443440-1kdb26k58cb0eh36jge0llki0u8pfruo.apps.googleusercontent.com";
