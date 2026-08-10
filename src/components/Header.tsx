"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from "lucide-react";
import { useCart } from "./CartProvider";
import { useWishlist } from "./WishlistProvider";

type NavCategory = { name: string; slug: string };

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rani-700 px-1 text-[10px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function SearchForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  return (
    <form
      className="flex w-full items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
        onDone();
      }}
    >
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search kurtis, co-ord sets, party wear…"
        className="w-full rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm outline-none focus:border-rani-400"
        aria-label="Search products"
      />
      <button
        type="submit"
        className="rounded-full bg-rani-700 p-2.5 text-white transition hover:bg-rani-800"
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
      </button>
    </form>
  );
}

export function Header({ categories }: { categories: NavCategory[] }) {
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const navLink =
    "text-sm font-medium text-ink-700 transition hover:text-rani-700";

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-ink-700 hover:bg-cream-200 lg:hidden"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2" aria-label="Rangritii home">
          <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden>
            <rect width="64" height="64" rx="14" fill="#8b1e3f" />
            <path d="M32 13 L51 32 L32 51 L13 32 Z" fill="none" stroke="#c9973f" strokeWidth="5" />
            <circle cx="32" cy="32" r="6" fill="#fdfbf7" />
          </svg>
          <span className="font-display text-2xl font-semibold tracking-wide text-rani-800">
            Rangritii
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          <Link href="/shop" className={navLink}>Shop All</Link>
          <Link href="/shop?filter=new" className={navLink}>New In</Link>
          <Link href="/shop?filter=bestsellers" className={navLink}>Bestsellers</Link>
          <div className="group relative">
            <button className={`${navLink} flex items-center gap-1`}>
              Categories <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white py-2 shadow-xl shadow-rani-900/10">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/shop?category=${c.slug}`}
                    className="block px-5 py-2.5 text-sm text-ink-700 hover:bg-cream-100 hover:text-rani-700"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/about" className={navLink}>About</Link>
          <Link href="/contact" className={navLink}>Contact</Link>
        </nav>

        {/* Action icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            className="rounded-lg p-2 text-ink-700 hover:bg-cream-200"
            onClick={() => setSearchOpen((v) => !v)}
            aria-label="Toggle search"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link
            href="/account"
            className="hidden rounded-lg p-2 text-ink-700 hover:bg-cream-200 sm:block"
            aria-label="Account"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link
            href="/wishlist"
            className="relative rounded-lg p-2 text-ink-700 hover:bg-cream-200"
            aria-label="Wishlist"
          >
            <Heart className="h-5 w-5" />
            <Badge count={wishCount} />
          </Link>
          <Link
            href="/cart"
            className="relative rounded-lg p-2 text-ink-700 hover:bg-cream-200"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            <Badge count={cartCount} />
          </Link>
        </div>
      </div>

      {/* Expandable search */}
      {searchOpen && (
        <div className="border-t border-cream-300 bg-cream-50 px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <Suspense fallback={null}>
              <SearchForm onDone={() => setSearchOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink-900/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="absolute inset-y-0 left-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-cream-50 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream-300 px-5 py-4">
              <span className="font-display text-xl font-semibold text-rani-800">Rangritii</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-cream-200"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col px-3 py-3" aria-label="Mobile">
              {[
                { href: "/shop", label: "Shop All" },
                { href: "/shop?filter=new", label: "New In" },
                { href: "/shop?filter=bestsellers", label: "Bestsellers" },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="rounded-xl px-4 py-3 text-[15px] font-medium text-ink-900 hover:bg-cream-200"
                >
                  {l.label}
                </Link>
              ))}
              <p className="mt-3 px-4 text-xs font-semibold uppercase tracking-widest text-ink-500">
                Categories
              </p>
              {categories.map((c) => (
                <Link
                  key={c.slug}
                  href={`/shop?category=${c.slug}`}
                  className="rounded-xl px-4 py-2.5 text-[15px] text-ink-700 hover:bg-cream-200"
                >
                  {c.name}
                </Link>
              ))}
              <div className="mt-3 border-t border-cream-300 pt-3">
                {[
                  { href: "/account", label: "My Account" },
                  { href: "/about", label: "About Us" },
                  { href: "/contact", label: "Contact Us" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block rounded-xl px-4 py-2.5 text-[15px] text-ink-700 hover:bg-cream-200"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
