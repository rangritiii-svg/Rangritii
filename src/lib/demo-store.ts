import type { Artist, Booking, Style } from "./types";
import { DEMO_ARTISTS, DEMO_STYLES } from "./demo-data";

/**
 * Mutable in-memory store used ONLY in demo mode (no Supabase configured).
 * Lets the full flow (browse → book → admin manage/approve) work end-to-end
 * without a database. Data resets when the server restarts — expected for a
 * demo; connect Supabase for persistence.
 */

type DemoStore = {
  artists: Artist[];
  styles: Style[];
  bookings: Booking[];
  bookingSeq: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __rangritiiStore: DemoStore | undefined;
}

function seedBookings(): Booking[] {
  return [
    {
      id: "b-demo-1",
      bookingNumber: "RB-5001",
      artistId: "a-01",
      artistName: "Meera Rathore",
      customerName: "Pooja Sharma",
      phone: "9876543210",
      email: "pooja@example.com",
      address: "12, Rose Villa, MG Road",
      city: "Jaipur",
      eventDate: "2026-08-20",
      eventType: "Bridal / Dulhan",
      notes: "Shaadi 21 August ko hai, ek din pehle full bridal chahiye. 4 family members ke liye bhi simple designs.",
      status: "confirmed",
      userId: null,
      createdAt: "2026-08-06T09:30:00Z",
    },
    {
      id: "b-demo-2",
      bookingNumber: "RB-5002",
      artistId: "a-02",
      artistName: "Ayesha Khan",
      customerName: "Neha Gupta",
      phone: "9812345678",
      email: "neha@example.com",
      address: "B-44, Shanti Nagar",
      city: "Delhi",
      eventDate: "2026-08-15",
      eventType: "Karva Chauth",
      notes: "2 ladies, Arabic style, evening slot preferred.",
      status: "pending",
      userId: null,
      createdAt: "2026-08-09T14:10:00Z",
    },
  ];
}

export function demoStore(): DemoStore {
  if (!globalThis.__rangritiiStore) {
    globalThis.__rangritiiStore = {
      artists: DEMO_ARTISTS.map((a) => ({ ...a })),
      styles: DEMO_STYLES.map((s) => ({ ...s })),
      bookings: seedBookings(),
      bookingSeq: 5003,
    };
  }
  return globalThis.__rangritiiStore;
}
