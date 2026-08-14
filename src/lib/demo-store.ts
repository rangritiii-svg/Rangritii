import type { Artist, Booking, ContactMessage, PlatformSettings, Style } from "./types";
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
  settings: PlatformSettings;
  messages: ContactMessage[];
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
      notes: "The wedding is on 21 August — need full bridal mehandi a day before. Simple designs for 4 family members as well.",
      status: "confirmed",
      amount: 11000,
      commissionAmount: 1100,
      paymentMethod: "upi_artist",
      paymentStatus: "verified",
      paymentUtr: "425511223344",
      settlementStatus: "pending",
      settlementUtr: "",
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
      amount: null,
      commissionAmount: null,
      paymentMethod: null,
      paymentStatus: "unpaid",
      paymentUtr: "",
      settlementStatus: "na",
      settlementUtr: "",
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
      settings: {
        upiId: "rangritii@demoupi",
        upiQr: "/art/qr-demo.svg",
        commissionPercent: 10,
        contactPhone: "+91 99250 26318",
        contactWhatsapp: "919925026318",
        contactEmail: "rangritii21@gmail.com",
        contactHours: "Mon–Sat, 10am–7pm",
      },
      messages: [
        {
          id: "m-demo-1",
          name: "Ritika Jain",
          email: "ritika@example.com",
          message:
            "Hi! I'm looking for a bridal mehandi artist in Udaipur for my sister's wedding on 2 October. Could you help?",
          createdAt: "2026-08-08T11:20:00Z",
        },
      ],
    };
  }
  return globalThis.__rangritiiStore;
}
