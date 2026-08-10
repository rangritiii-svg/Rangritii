"use server";

import { isSupabaseConfigured } from "@/lib/config";
import { createOrder, type CheckoutItem } from "@/lib/orders";

export type PlaceOrderResult =
  | { ok: true; orderNumber: string; total: number }
  | { ok: false; error: string };

type Details = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

function validate(d: Details): string | null {
  if (!d.customerName.trim()) return "Please enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) return "Please enter a valid email address.";
  if (!/^[6-9]\d{9}$/.test(d.phone.replace(/\D/g, "")))
    return "Please enter a valid 10-digit mobile number.";
  if (d.address.trim().length < 8) return "Please enter your complete address.";
  if (!d.city.trim()) return "Please enter your city.";
  if (!d.state.trim()) return "Please enter your state.";
  if (!/^\d{6}$/.test(d.pincode.trim())) return "Please enter a valid 6-digit pincode.";
  return null;
}

export async function placeOrder(
  details: Details,
  items: CheckoutItem[]
): Promise<PlaceOrderResult> {
  try {
    const error = validate(details);
    if (error) return { ok: false, error };
    if (!Array.isArray(items) || items.length === 0) {
      return { ok: false, error: "Your bag is empty." };
    }

    let userId: string | null = null;
    if (isSupabaseConfigured()) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id ?? null;
    }

    const clean: Details = {
      customerName: details.customerName.trim().slice(0, 120),
      email: details.email.trim().slice(0, 200),
      phone: details.phone.replace(/\D/g, "").slice(0, 10),
      address: details.address.trim().slice(0, 500),
      city: details.city.trim().slice(0, 100),
      state: details.state.trim().slice(0, 100),
      pincode: details.pincode.trim().slice(0, 6),
    };

    const result = await createOrder(clean, items, userId);
    return { ok: true, orderNumber: result.orderNumber, total: result.total };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Something went wrong. Please try again.",
    };
  }
}
