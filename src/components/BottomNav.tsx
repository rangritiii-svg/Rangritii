"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarHeart, Home, Images, Search, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/artists", label: "Artists", icon: Search, match: (p: string) => p.startsWith("/artist") || p.startsWith("/book") },
  { href: "/designs", label: "Designs", icon: Images, match: (p: string) => p.startsWith("/designs") },
  { href: "/account#bookings", label: "Bookings", icon: CalendarHeart, match: (p: string) => p.startsWith("/pay") || p.startsWith("/booking-confirmed") },
  { href: "/account", label: "Account", icon: User, match: (p: string) => p.startsWith("/account") || p.startsWith("/join") },
];

/** App-style tab bar for phones (and the Android app). Hidden on desktop. */
export function BottomNav() {
  const pathname = usePathname();
  // Pages with their own sticky action bar hide the tabs so buttons never overlap.
  if (pathname.startsWith("/book/")) return null;

  return (
    <nav
      aria-label="App"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-white/97 pb-[var(--sab)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-medium ${
                  active ? "text-rani-700" : "text-ink-500"
                }`}
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
