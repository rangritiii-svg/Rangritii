/**
 * firebase/config.ts
 * Firebase configuration for RangRiti.
 *
 * - Firestore: uses Firebase JS SDK (web SDK) — works in Expo managed workflow
 * - Auth (Phone OTP): uses @react-native-firebase/auth — native SDK,
 *   handles Android app attestation automatically without reCAPTCHA
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAb3yFH3NimZAXbJNq7C-t1PPOA7GIPYyI",
  authDomain: "rangritii.firebaseapp.com",
  projectId: "rangritii",
  storageBucket: "rangritii.firebasestorage.app",
  messagingSenderId: "793048443440",
  appId: "1:793048443440:android:fed1a0b28b96c40eab5bf5",
};

// Prevent re-initializing on hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export default app;
