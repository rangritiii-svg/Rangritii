export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  images: string[];
  sizes: string[];
  fabric: string;
  stock: number;
  isNew: boolean;
  isBestseller: boolean;
  isActive: boolean;
  createdAt: string;
};

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  quantity: number;
};

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type OrderItem = {
  id: string;
  productId: string;
  productName: string;
  price: number;
  size: string;
  quantity: number;
  image: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  paymentMethod: "cod";
  status: OrderStatus;
  subtotal: number;
  shippingFee: number;
  total: number;
  items: OrderItem[];
  userId: string | null;
  createdAt: string;
};

export type ProductInput = {
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  categorySlug: string;
  images: string[];
  sizes: string[];
  fabric: string;
  stock: number;
  isNew: boolean;
  isBestseller: boolean;
  isActive: boolean;
};
