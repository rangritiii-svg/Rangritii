"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "rangritii-cart-v1";
const MAX_QTY = 10;

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, size: string) => void;
  setQuantity: (productId: string, size: string, quantity: number) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      // corrupted storage — start fresh
    }
    loaded.current = true;
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage full/unavailable — cart still works in memory
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) => i.productId === item.productId && i.size === item.size
        );
        if (existing) {
          return prev.map((i) =>
            i === existing
              ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) }
              : i
          );
        }
        return [...prev, { ...item, quantity: Math.min(MAX_QTY, Math.max(1, quantity)) }];
      });
    },
    []
  );

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) => prev.filter((i) => !(i.productId === productId && i.size === size)));
  }, []);

  const setQuantity = useCallback((productId: string, size: string, quantity: number) => {
    setItems((prev) =>
      quantity < 1
        ? prev.filter((i) => !(i.productId === productId && i.size === size))
        : prev.map((i) =>
            i.productId === productId && i.size === size
              ? { ...i, quantity: Math.min(MAX_QTY, quantity) }
              : i
          )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, ready, count, subtotal, addItem, removeItem, setQuantity, clear };
  }, [items, ready, addItem, removeItem, setQuantity, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
