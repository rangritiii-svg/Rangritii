"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useSavedArtists } from "./SavedArtistsProvider";

type NavStyle = { name: string; slug: string };

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
        router.push(query ? `/artists?q=${encodeURIComponent(query)}` : "/artists");
        onDone();
      }}
    >
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search artist, city ya style…"
        className="w-full rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm outline-none focus:border-rani-400"
        aria-label="Search artists"
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

export function Header({ styles }: { styles: NavStyle[] }) {
  const { count: savedCount } = useSavedArtists();
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
          <Link href="/artists" className={navLink}>Find Artists</Link>
          <div className="group relative">
            <button className={`${navLink} flex items-center gap-1`}>
              Styles <ChevronDown className="h-3.5 w-3.5" />
            </button>
            <div className="invisible absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-3 opacity-0 transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
              <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white py-2 shadow-xl shadow-rani-900/10">
                {styles.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/artists?style=${s.slug}`}
                    className="block px-5 py-2.5 text-sm text-ink-700 hover:bg-cream-100 hover:text-rani-700"
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <Link href="/designs" className={navLink}>Designs</Link>
          <Link href="/#how-it-works" className={navLink}>How it Works</Link>
          <Link href="/join" className={`${navLink} inline-flex items-center gap-1.5`}>
            <Sparkles className="h-3.5 w-3.5 text-marigold-600" /> Join as Artist
          </Link>
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
            href="/saved"
            className="relative rounded-lg p-2 text-ink-700 hover:bg-cream-200"
            aria-label="Saved artists"
          >
            <Heart className="h-5 w-5" />
            <Badge count={savedCount} />
          </Link>
          <Link
            href="/artists"
            className="hidden rounded-full bg-rani-700 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-rani-800 sm:block"
          >
            Book Mehandi
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
                { href: "/artists", label: "Find Artists" },
                { href: "/designs", label: "Design Gallery" },
                { href: "/#how-it-works", label: "How it Works" },
                { href: "/join", label: "Join as Artist ✨" },
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
                Styles
              </p>
              {styles.map((s) => (
                <Link
                  key={s.slug}
                  href={`/artists?style=${s.slug}`}
                  className="rounded-xl px-4 py-2.5 text-[15px] text-ink-700 hover:bg-cream-200"
                >
                  {s.name}
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
