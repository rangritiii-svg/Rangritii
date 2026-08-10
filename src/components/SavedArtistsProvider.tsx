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

const STORAGE_KEY = "rangritii-saved-artists-v1";

/** Snapshot of an artist saved for later (renders instantly, works offline). */
export type SavedArtist = {
  artistId: string;
  slug: string;
  name: string;
  city: string;
  priceMin: number;
  priceMax: number;
  image: string;
};

type SavedContextValue = {
  items: SavedArtist[];
  ready: boolean;
  count: number;
  has: (artistId: string) => boolean;
  toggle: (item: SavedArtist) => void;
  remove: (artistId: string) => void;
};

const SavedContext = createContext<SavedContextValue | null>(null);

export function SavedArtistsProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<SavedArtist[]>([]);
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
      // storage unavailable — still works in memory
    }
  }, [items]);

  const has = useCallback(
    (artistId: string) => items.some((i) => i.artistId === artistId),
    [items]
  );

  const toggle = useCallback((item: SavedArtist) => {
    setItems((prev) =>
      prev.some((i) => i.artistId === item.artistId)
        ? prev.filter((i) => i.artistId !== item.artistId)
        : [...prev, item]
    );
  }, []);

  const remove = useCallback((artistId: string) => {
    setItems((prev) => prev.filter((i) => i.artistId !== artistId));
  }, []);

  const value = useMemo<SavedContextValue>(
    () => ({ items, ready, count: items.length, has, toggle, remove }),
    [items, ready, has, toggle, remove]
  );

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

export function useSavedArtists(): SavedContextValue {
  const ctx = useContext(SavedContext);
  if (!ctx) throw new Error("useSavedArtists must be used inside <SavedArtistsProvider>");
  return ctx;
}
