/**
 * firestoreService.ts
 * All Firestore database operations for Rangritii.
 * Collections: artists, customers, bookings, settings, chats
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

const ARTISTS_COL = "artists";
const CUSTOMERS_COL = "customers";
const BOOKINGS_COL = "bookings";
const SETTINGS_COL = "settings";

export async function fetchArtists(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, ARTISTS_COL));
    return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
  } catch (e) { console.warn("fetchArtists", e); return []; }
}
export async function saveArtist(artistId: string, data: any): Promise<void> {
  try { await setDoc(doc(db, ARTISTS_COL, artistId), { ...data, updatedAt: serverTimestamp() }); }
  catch (e) { console.warn("saveArtist", e); }
}
export async function updateArtist(artistId: string, updates: any): Promise<void> {
  try { await updateDoc(doc(db, ARTISTS_COL, artistId), { ...updates, updatedAt: serverTimestamp() }); }
  catch (e) { console.warn("updateArtist", e); }
}
export function subscribeToArtists(callback: (artists: any[]) => void): Unsubscribe {
  return onSnapshot(collection(db, ARTISTS_COL), (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id })));
  }, (e) => console.warn("Artist listener error:", e));
}

export async function fetchCustomers(): Promise<any[]> {
  try { const snap = await getDocs(collection(db, CUSTOMERS_COL)); return snap.docs.map((d) => ({ ...d.data(), id: d.id })); }
  catch (e) { console.warn("fetchCustomers", e); return []; }
}
export async function saveCustomer(customerId: string, data: any): Promise<void> {
  try { await setDoc(doc(db, CUSTOMERS_COL, customerId), { ...data, createdAt: data.createdAt || new Date().toISOString() }); }
  catch (e) { console.warn("saveCustomer", e); }
}
export async function updateCustomer(customerId: string, updates: any): Promise<void> {
  try { await updateDoc(doc(db, CUSTOMERS_COL, customerId), updates); } catch (e) { console.warn("updateCustomer", e); }
}
export async function getCustomerByPhone(phone: string): Promise<any | null> {
  try {
    const q = query(collection(db, CUSTOMERS_COL), where("phone", "==", phone));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { ...d.data(), id: d.id };
  } catch (e) { console.warn("getCustomerByPhone", e); return null; }
}

export async function fetchAllBookings(): Promise<any[]> {
  try { const snap = await getDocs(query(collection(db, BOOKINGS_COL), orderBy("createdAt", "desc"))); return snap.docs.map((d) => ({ ...d.data(), id: d.id })); }
  catch (e) { console.warn("fetchAllBookings", e); return []; }
}
function sortByCreatedDesc(rows: any[]): any[] {
  return rows.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
}
export async function fetchBookingsByCustomer(customerPhone: string): Promise<any[]> {
  try { const q = query(collection(db, BOOKINGS_COL), where("customerPhone", "==", customerPhone)); const snap = await getDocs(q); return sortByCreatedDesc(snap.docs.map((d) => ({ ...d.data(), id: d.id }))); }
  catch (e) { console.warn("fetchBookingsByCustomer", e); return []; }
}
export async function fetchBookingsByArtist(artistId: string): Promise<any[]> {
  try { const q = query(collection(db, BOOKINGS_COL), where("artistId", "==", artistId)); const snap = await getDocs(q); return sortByCreatedDesc(snap.docs.map((d) => ({ ...d.data(), id: d.id }))); }
  catch (e) { console.warn("fetchBookingsByArtist", e); return []; }
}
export async function saveBooking(bookingId: string, data: any): Promise<void> {
  try { await setDoc(doc(db, BOOKINGS_COL, bookingId), data); } catch (e) { console.warn("saveBooking", e); }
}
export async function updateBooking(bookingId: string, updates: any): Promise<void> {
  try { await updateDoc(doc(db, BOOKINGS_COL, bookingId), updates); } catch (e) { console.warn("updateBooking", e); }
}
export function subscribeToCustomerBookings(customerPhone: string, callback: (bookings: any[]) => void): Unsubscribe {
  const q = query(collection(db, BOOKINGS_COL), where("customerPhone", "==", customerPhone));
  return onSnapshot(q, (snap) => callback(sortByCreatedDesc(snap.docs.map((d) => ({ ...d.data(), id: d.id })))), (e) => console.warn("cust listener", e));
}
export function subscribeToArtistBookings(artistId: string, callback: (bookings: any[]) => void): Unsubscribe {
  const q = query(collection(db, BOOKINGS_COL), where("artistId", "==", artistId));
  return onSnapshot(q, (snap) => callback(sortByCreatedDesc(snap.docs.map((d) => ({ ...d.data(), id: d.id })))), (e) => console.warn("artist listener", e));
}
export function subscribeToAllBookings(callback: (bookings: any[]) => void): Unsubscribe {
  const q = query(collection(db, BOOKINGS_COL), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }))), (e) => console.warn("admin listener", e));
}

export async function fetchAdminSettings(): Promise<any | null> {
  try { const snap = await getDoc(doc(db, SETTINGS_COL, "admin")); if (!snap.exists()) return null; return snap.data(); }
  catch (e) { console.warn("fetchAdminSettings", e); return null; }
}
export async function saveAdminSettings(data: any): Promise<void> {
  try { await setDoc(doc(db, SETTINGS_COL, "admin"), data, { merge: true }); } catch (e) { console.warn("saveAdminSettings", e); }
}

const CHATS_COL = "chats";
export function conversationId(customerPhone: string, artistId: string): string {
  return `${(customerPhone || "guest").replace(/\s+/g, "")}__${artistId}`;
}
export async function sendChatMessage(convId: string, message: { text: string; senderId: "user" | "artist"; timestamp: string }): Promise<void> {
  try { await addDoc(collection(db, CHATS_COL, convId, "messages"), { ...message, createdAt: serverTimestamp() }); }
  catch (e) { console.warn("sendChatMessage", e); }
}
export function subscribeToChat(convId: string, callback: (messages: any[]) => void): Unsubscribe {
  const q = query(collection(db, CHATS_COL, convId, "messages"), orderBy("timestamp", "asc"));
  return onSnapshot(q, (snap) => callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }))), (e) => console.warn("Chat listener error:", e));
}
