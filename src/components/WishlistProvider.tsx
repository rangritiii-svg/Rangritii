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

const STORAGE_KEY = "rangritii-wishlist-v1";

/** Snapshot of a product saved to the wishlist (renders offline/instantly). */
export type WishItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  image: string;
};

type WishlistContextValue = {
  items: WishItem[];
  ready: boolean;
  count: number;
  has: (productId: string) => boolean;
  toggle: (item: WishItem) => void;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishItem[]>([]);
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
      // storage unavailable — wishlist still works in memory
    }
  }, [items]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.productId === productId),
    [items]
  );

  const toggle = useCallback((item: WishItem) => {
    setItems((prev) =>
      prev.some((i) => i.productId === item.productId)
        ? prev.filter((i) => i.productId !== item.productId)
        : [...prev, item]
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({ items, ready, count: items.length, has, toggle, remove }),
    [items, ready, has, toggle, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside <WishlistProvider>");
  return ctx;
}
