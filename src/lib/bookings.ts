import "server-only";
import { isSupabaseConfigured } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type { Booking, BookingStatus } from "./types";
import { BOOKING_STATUSES } from "./types";

export type BookingDetails = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  eventDate: string; // yyyy-mm-dd
  eventType: string;
  notes: string;
};

type BookingRow = {
  id: string;
  booking_number: string;
  artist_id: string;
  artist_name: string;
  customer_name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  event_date: string;
  event_type: string;
  notes: string;
  status: string;
  user_id: string | null;
  created_at: string;
};

function mapBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    bookingNumber: r.booking_number,
    artistId: r.artist_id,
    artistName: r.artist_name,
    customerName: r.customer_name,
    phone: r.phone,
    email: r.email ?? "",
    address: r.address ?? "",
    city: r.city ?? "",
    eventDate: r.event_date,
    eventType: r.event_type,
    notes: r.notes ?? "",
    status: (BOOKING_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as BookingStatus)
      : "pending",
    userId: r.user_id,
    createdAt: r.created_at,
  };
}

export async function createBooking(
  artistId: string,
  details: BookingDetails,
  userId: string | null
): Promise<{ bookingNumber: string; artistName: string; artistWhatsapp: string }> {
  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const artist = store.artists.find(
      (a) => a.id === artistId && a.isApproved && a.isActive
    );
    if (!artist) throw new Error("This artist is not available for booking right now.");
    const bookingNumber = `RB-${store.bookingSeq++}`;
    store.bookings.unshift({
      id: `b-${Date.now()}`,
      bookingNumber,
      artistId: artist.id,
      artistName: artist.name,
      ...details,
      status: "pending",
      userId,
      createdAt: new Date().toISOString(),
    });
    return { bookingNumber, artistName: artist.name, artistWhatsapp: artist.whatsapp };
  }

  // Supabase mode: SECURITY DEFINER function validates the artist and inserts.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_booking", {
    p_artist_id: artistId,
    p_details: {
      customer_name: details.customerName,
      phone: details.phone,
      email: details.email,
      address: details.address,
      city: details.city,
      event_date: details.eventDate,
      event_type: details.eventType,
      notes: details.notes,
    },
  });
  if (error) throw new Error(`Could not place booking: ${error.message}`);
  const result = data as {
    booking_number: string;
    artist_name: string;
    artist_whatsapp: string;
  };
  return {
    bookingNumber: result.booking_number,
    artistName: result.artist_name,
    artistWhatsapp: result.artist_whatsapp ?? "",
  };
}

/** Admin: all bookings (RLS restricts to admins in Supabase mode). */
export async function getBookings(): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoStore().bookings.map((b) => ({ ...b }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

/** Logged-in customer: own bookings. */
export async function getBookingsForUser(userId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoStore()
      .bookings.filter((b) => b.userId === userId)
      .map((b) => ({ ...b }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

/** Bookings received by an artist (for their dashboard in /account). */
export async function getBookingsForArtist(artistId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured()) {
    return demoStore()
      .bookings.filter((b) => b.artistId === artistId)
      .map((b) => ({ ...b }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("artist_id", artistId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load bookings: ${error.message}`);
  return (data as BookingRow[]).map(mapBooking);
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (!(BOOKING_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid status.");
  }
  if (!isSupabaseConfigured()) {
    const booking = demoStore().bookings.find((b) => b.id === id);
    if (!booking) throw new Error("Booking not found.");
    booking.status = status;
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
