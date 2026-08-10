import "server-only";
import { isSupabaseConfigured, SITE } from "./config";
import { demoStore } from "./demo-store";
import { createClient } from "./supabase/server";
import type { Order, OrderItem, OrderStatus } from "./types";
import { ORDER_STATUSES } from "./types";

export type CheckoutDetails = {
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

/** What the client is allowed to send: ids + sizes + quantities only.
 *  Prices are always looked up server-side so they cannot be tampered with. */
export type CheckoutItem = { productId: string; size: string; quantity: number };

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: string;
  status: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  user_id: string | null;
  created_at: string;
  order_items?: OrderItemRow[];
};

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
};

function mapItem(r: OrderItemRow): OrderItem {
  return {
    id: r.id,
    productId: r.product_id ?? "",
    productName: r.product_name,
    price: Number(r.price),
    size: r.size,
    quantity: r.quantity,
    image: r.image ?? "",
  };
}

function mapOrder(r: OrderRow): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    customerName: r.customer_name,
    email: r.email,
    phone: r.phone,
    address: r.address,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    paymentMethod: "cod",
    status: (ORDER_STATUSES as readonly string[]).includes(r.status)
      ? (r.status as OrderStatus)
      : "pending",
    subtotal: Number(r.subtotal),
    shippingFee: Number(r.shipping_fee),
    total: Number(r.total),
    userId: r.user_id,
    createdAt: r.created_at,
    items: (r.order_items ?? []).map(mapItem),
  };
}

const clampQty = (q: number) => Math.max(1, Math.min(10, Math.floor(q) || 1));

export async function createOrder(
  details: CheckoutDetails,
  rawItems: CheckoutItem[],
  userId: string | null
): Promise<{ orderNumber: string; total: number }> {
  if (rawItems.length === 0) throw new Error("Cart is empty.");

  if (!isSupabaseConfigured()) {
    const store = demoStore();
    const lines = rawItems.map((raw) => {
      const product = store.products.find((p) => p.id === raw.productId && p.isActive);
      if (!product) throw new Error("A product in your cart is no longer available.");
      return { product, size: raw.size, quantity: clampQty(raw.quantity) };
    });
    const subtotal = lines.reduce((s, l) => s + l.product.price * l.quantity, 0);
    const shippingFee = subtotal >= SITE.freeShippingAbove ? 0 : SITE.shippingFee;
    const total = subtotal + shippingFee;
    const orderNumber = `RT-${store.orderSeq++}`;
    const id = `o-${Date.now()}`;

    for (const l of lines) {
      l.product.stock = Math.max(0, l.product.stock - l.quantity);
    }
    store.orders.unshift({
      id,
      orderNumber,
      ...details,
      paymentMethod: "cod",
      status: "pending",
      subtotal,
      shippingFee,
      total,
      userId,
      createdAt: new Date().toISOString(),
      items: lines.map((l, n) => ({
        id: `${id}-i${n}`,
        productId: l.product.id,
        productName: l.product.name,
        price: l.product.price,
        size: l.size,
        quantity: l.quantity,
        image: l.product.images[0] ?? "",
      })),
    });
    return { orderNumber, total };
  }

  // Supabase mode: SECURITY DEFINER function validates products, computes
  // totals from DB prices, and inserts order + items atomically.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    customer: {
      customer_name: details.customerName,
      email: details.email,
      phone: details.phone,
      address: details.address,
      city: details.city,
      state: details.state,
      pincode: details.pincode,
    },
    items: rawItems.map((i) => ({
      product_id: i.productId,
      size: i.size,
      quantity: clampQty(i.quantity),
    })),
  });
  if (error) throw new Error(`Could not place order: ${error.message}`);
  const result = data as { order_number: string; total: number };
  return { orderNumber: result.order_number, total: Number(result.total) };
}

/** Admin: list all orders (RLS restricts to admins in Supabase mode). */
export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return demoStore().orders.map((o) => ({ ...o, items: [...o.items] }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data as OrderRow[]).map(mapOrder);
}

/** Logged-in customer: own orders only. */
export async function getOrdersForUser(userId: string): Promise<Order[]> {
  if (!isSupabaseConfigured()) {
    return demoStore()
      .orders.filter((o) => o.userId === userId)
      .map((o) => ({ ...o, items: [...o.items] }));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data as OrderRow[]).map(mapOrder);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
    throw new Error("Invalid status.");
  }
  if (!isSupabaseConfigured()) {
    const order = demoStore().orders.find((o) => o.id === id);
    if (!order) throw new Error("Order not found.");
    order.status = status;
    return;
  }
  const supabase = await createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
