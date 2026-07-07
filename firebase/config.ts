import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

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
export const auth = getAuth(app);
export default app;
