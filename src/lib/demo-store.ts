import type { Category, Order, Product } from "./types";
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from "./demo-data";

/**
 * Mutable in-memory store used ONLY in demo mode (no Supabase configured).
 * Lets the full admin panel (product CRUD, order management) work end-to-end
 * without a database. Data resets when the server restarts — that is expected
 * for a demo; connect Supabase for persistence.
 */

type DemoStore = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  orderSeq: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __rangritiiStore: DemoStore | undefined;
}

function seedOrders(): Order[] {
  const p1 = DEMO_PRODUCTS[0];
  const p2 = DEMO_PRODUCTS[6];
  return [
    {
      id: "o-demo-1",
      orderNumber: "RT-100001",
      customerName: "Priya Sharma",
      email: "priya@example.com",
      phone: "9876543210",
      address: "12, Rose Villa, MG Road",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      paymentMethod: "cod",
      status: "delivered",
      subtotal: p1.price + p2.price,
      shippingFee: 0,
      total: p1.price + p2.price,
      userId: null,
      createdAt: "2026-08-05T09:30:00Z",
      items: [
        {
          id: "oi-1",
          productId: p1.id,
          productName: p1.name,
          price: p1.price,
          size: "M",
          quantity: 1,
          image: p1.images[0],
        },
        {
          id: "oi-2",
          productId: p2.id,
          productName: p2.name,
          price: p2.price,
          size: "L",
          quantity: 1,
          image: p2.images[0],
        },
      ],
    },
    {
      id: "o-demo-2",
      orderNumber: "RT-100002",
      customerName: "Anjali Mehta",
      email: "anjali@example.com",
      phone: "9812345678",
      address: "B-44, Shanti Nagar",
      city: "Ahmedabad",
      state: "Gujarat",
      pincode: "380001",
      paymentMethod: "cod",
      status: "pending",
      subtotal: DEMO_PRODUCTS[14].price,
      shippingFee: 0,
      total: DEMO_PRODUCTS[14].price,
      userId: null,
      createdAt: "2026-08-09T14:10:00Z",
      items: [
        {
          id: "oi-3",
          productId: DEMO_PRODUCTS[14].id,
          productName: DEMO_PRODUCTS[14].name,
          price: DEMO_PRODUCTS[14].price,
          size: "XL",
          quantity: 1,
          image: DEMO_PRODUCTS[14].images[0],
        },
      ],
    },
  ];
}

export function demoStore(): DemoStore {
  if (!globalThis.__rangritiiStore) {
    globalThis.__rangritiiStore = {
      products: DEMO_PRODUCTS.map((p) => ({ ...p })),
      categories: DEMO_CATEGORIES.map((c) => ({ ...c })),
      orders: seedOrders(),
      orderSeq: 100003,
    };
  }
  return globalThis.__rangritiiStore;
}
