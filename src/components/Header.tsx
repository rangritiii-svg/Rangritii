"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, Menu, Search, User, X } from "lucide-react";
import { useSavedArtists } from "./SavedArtistsProvider";

type NavStyle = { name: string; slug: string };

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Rangritii home">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-8 w-8 shrink-0 rounded-[10px]" />
      {!compact && <span className="font-display text-[26px] leading-none text-rani-800">Rangritii</span>}
    </Link>
  );
}

function SearchForm({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");

  return (
    <form
      role="search"
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
        placeholder="Artist name, city or area"
        enterKeyHint="search"
        className="h-11 w-full rounded-full border border-cream-300 bg-white px-5 text-[15px] outline-none focus:border-rani-400"
        aria-label="Search artists"
      />
      <button
        type="submit"
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rani-700 text-white"
        aria-label="Search"
      >
        <Search className="h-5 w-5" />
      </button>
    </form>
  );
}

/** Desktop "Styles" menu — opens on click/tap as well as hover, so it also
 *  works on touch screens (it used to be hover-only, i.e. dead on phones). */
function StylesMenu({ styles }: { styles: NavStyle[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open]);

  return (
    <div ref={ref} className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[15px] font-medium text-ink-700 hover:text-rani-700"
      >
        Styles <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-50 w-60 -translate-x-1/2 pt-3">
          <div className="overflow-hidden rounded-2xl border border-cream-300 bg-white py-2 shadow-lg shadow-rani-900/10">
            {styles.map((s) => (
              <Link
                key={s.slug}
                href={`/artists?style=${s.slug}`}
                onClick={() => setOpen(false)}
                className="block px-5 py-2.5 text-[15px] text-ink-700 hover:bg-cream-100 hover:text-rani-700"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
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

  const navLink = "text-[15px] font-medium text-ink-700 hover:text-rani-700";
  const iconBtn = "relative grid h-11 w-11 place-items-center rounded-full text-ink-700 hover:bg-cream-200";

  return (
    <header className="sticky top-0 z-40 border-b border-cream-300 bg-white/95 pt-[var(--sat)] backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:h-16">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
          <Link href="/artists" className={navLink}>Find artists</Link>
          <StylesMenu styles={styles} />
          <Link href="/designs" className={navLink}>Designs</Link>
          <Link href="/#how-it-works" className={navLink}>How booking works</Link>
          <Link href="/join" className={navLink}>For artists</Link>
        </nav>

        <div className="flex items-center">
          <button className={iconBtn} onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
            {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </button>
          <Link href="/saved" className={iconBtn} aria-label={`Saved artists (${savedCount})`}>
            <Heart className="h-5 w-5" />
            {savedCount > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-rani-700 px-1 text-[10px] font-bold text-white">
                {savedCount > 99 ? "99+" : savedCount}
              </span>
            )}
          </Link>
          <Link href="/account" className={`${iconBtn} hidden lg:grid`} aria-label="My account">
            <User className="h-5 w-5" />
          </Link>
          <button className={`${iconBtn} lg:hidden`} onClick={() => setMenuOpen(true)} aria-label="More">
            <Menu className="h-5 w-5" />
          </button>
          <Link
            href="/artists"
            className="ml-2 hidden rounded-full bg-rani-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rani-800 lg:block"
          >
            Book mehandi
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-cream-300 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <Suspense fallback={null}>
              <SearchForm onDone={() => setSearchOpen(false)} />
            </Suspense>
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button className="absolute inset-0 bg-ink-900/40" onClick={() => setMenuOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-white pb-[var(--sab)] pt-[var(--sat)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-cream-300 px-5 py-3">
              <Logo />
              <button onClick={() => setMenuOpen(false)} className={iconBtn} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex flex-col px-3 py-3" aria-label="Mobile">
              <p className="px-4 pb-1 pt-2 text-sm font-semibold text-ink-500">Browse by style</p>
              {styles.map((s) => (
                <Link key={s.slug} href={`/artists?style=${s.slug}`} className="rounded-xl px-4 py-3 text-[16px] text-ink-900 hover:bg-cream-100">
                  {s.name}
                </Link>
              ))}
              <div className="mt-3 border-t border-cream-300 pt-3">
                {[
                  { href: "/pay", label: "Pay for a booking" },
                  { href: "/saved", label: "Saved artists" },
                  { href: "/join", label: "Join as an artist" },
                  { href: "/#how-it-works", label: "How booking works" },
                  { href: "/about", label: "About us" },
                  { href: "/contact", label: "Contact us" },
                  { href: "/policies/cancellation-policy", label: "Cancellation & refunds" },
                ].map((l) => (
                  <Link key={l.href} href={l.href} className="block rounded-xl px-4 py-3 text-[16px] text-ink-700 hover:bg-cream-100">
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
