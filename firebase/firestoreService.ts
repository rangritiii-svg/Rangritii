/**
 * firestoreService.ts
 * All Firestore database operations for Rangritii.
 * Collections: artists, customers, bookings, settings
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

// ─── COLLECTION NAMES ───────────────────────────────────────────
const ARTISTS_COL = "artists";
const CUSTOMERS_COL = "customers";
const BOOKINGS_COL = "bookings";
const SETTINGS_COL = "settings";

// ─── ARTISTS ────────────────────────────────────────────────────

/** Fetch all artists from Firestore */
export async function fetchArtists(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, ARTISTS_COL));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (e) {
    console.warn("Firestore fetchArtists error:", e);
    return [];
  }
}

/** Save a new artist to Firestore */
export async function saveArtist(artistId: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, ARTISTS_COL, artistId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("Firestore saveArtist error:", e);
  }
}

/** Update specific fields on an artist document */
export async function updateArtist(artistId: string, updates: any): Promise<void> {
  try {
    await updateDoc(doc(db, ARTISTS_COL, artistId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("Firestore updateArtist error:", e);
  }
}

/** Listen to artists in real-time */
export function subscribeToArtists(callback: (artists: any[]) => void): Unsubscribe {
  return onSnapshot(collection(db, ARTISTS_COL), (snap) => {
    const artists = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    callback(artists);
  }, (e) => console.warn("Artist listener error:", e));
}

// ─── CUSTOMERS ──────────────────────────────────────────────────

/** Fetch all customers (admin only) */
export async function fetchCustomers(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, CUSTOMERS_COL));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (e) {
    console.warn("Firestore fetchCustomers error:", e);
    return [];
  }
}

/** Save a new customer to Firestore */
export async function saveCustomer(customerId: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, CUSTOMERS_COL, customerId), {
      ...data,
      createdAt: data.createdAt || new Date().toISOString(),
    });
  } catch (e) {
    console.warn("Firestore saveCustomer error:", e);
  }
}

/** Update specific fields on a customer document */
export async function updateCustomer(customerId: string, updates: any): Promise<void> {
  try {
    await updateDoc(doc(db, CUSTOMERS_COL, customerId), updates);
  } catch (e) {
    console.warn("Firestore updateCustomer error:", e);
  }
}

/** Find a customer by phone number */
export async function getCustomerByPhone(phone: string): Promise<any | null> {
  try {
    const q = query(collection(db, CUSTOMERS_COL), where("phone", "==", phone));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...d.data(), id: d.id };
  } catch (e) {
    console.warn("Firestore getCustomerByPhone error:", e);
    return null;
  }
}

// ─── BOOKINGS ───────────────────────────────────────────────────

/** Fetch ALL bookings — Admin only */
export async function fetchAllBookings(): Promise<any[]> {
  try {
    const snap = await getDocs(query(collection(db, BOOKINGS_COL), orderBy("createdAt", "desc")));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (e) {
    console.warn("Firestore fetchAllBookings error:", e);
    return [];
  }
}

/** Fetch bookings for a specific CUSTOMER by their phone */
export async function fetchBookingsByCustomer(customerPhone: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COL),
      where("customerPhone", "==", customerPhone),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (e) {
    console.warn("Firestore fetchBookingsByCustomer error:", e);
    return [];
  }
}

/** Fetch bookings for a specific ARTIST by their artistId */
export async function fetchBookingsByArtist(artistId: string): Promise<any[]> {
  try {
    const q = query(
      collection(db, BOOKINGS_COL),
      where("artistId", "==", artistId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (e) {
    console.warn("Firestore fetchBookingsByArtist error:", e);
    return [];
  }
}

/** Save a new booking to Firestore */
export async function saveBooking(bookingId: string, data: any): Promise<void> {
  try {
    await setDoc(doc(db, BOOKINGS_COL, bookingId), data);
  } catch (e) {
    console.warn("Firestore saveBooking error:", e);
  }
}

/** Update specific fields on a booking */
export async function updateBooking(bookingId: string, updates: any): Promise<void> {
  try {
    await updateDoc(doc(db, BOOKINGS_COL, bookingId), updates);
  } catch (e) {
    console.warn("Firestore updateBooking error:", e);
  }
}

/** Listen to bookings for a customer in real-time */
export function subscribeToCustomerBookings(
  customerPhone: string,
  callback: (bookings: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, BOOKINGS_COL),
    where("customerPhone", "==", customerPhone),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  }, (e) => console.warn("Customer booking listener error:", e));
}

/** Listen to bookings for an artist in real-time */
export function subscribeToArtistBookings(
  artistId: string,
  callback: (bookings: any[]) => void
): Unsubscribe {
  const q = query(
    collection(db, BOOKINGS_COL),
    where("artistId", "==", artistId),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  }, (e) => console.warn("Artist booking listener error:", e));
}

/** Listen to ALL bookings in real-time — Admin only */
export function subscribeToAllBookings(callback: (bookings: any[]) => void): Unsubscribe {
  const q = query(collection(db, BOOKINGS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  }, (e) => console.warn("Admin booking listener error:", e));
}

// ─── ADMIN SETTINGS ─────────────────────────────────────────────

/** Load admin settings from Firestore */
export async function fetchAdminSettings(): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, "admin"));
    if (!snap.exists()) return null;
    return snap.data();
  } catch (e) {
    console.warn("Firestore fetchAdminSettings error:", e);
    return null;
  }
}

/** Save admin settings to Firestore */
export async function saveAdminSettings(data: any): Promise<void> {
  try {
    await setDoc(doc(db, SETTINGS_COL, "admin"), data, { merge: true });
  } catch (e) {
    console.warn("Firestore saveAdminSettings error:", e);
  }
}
