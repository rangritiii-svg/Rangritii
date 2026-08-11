import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Inbox,
  LayoutDashboard,
  Palette,
  SlidersHorizontal,
  Store,
  Users,
} from "lucide-react";
import { getAdminSession } from "@/lib/admin-auth";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

export const dynamic = "force-dynamic";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/artists", label: "Artists", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/admin/styles", label: "Styles", icon: Palette },
  { href: "/admin/messages", label: "Messages", icon: Inbox },
  { href: "/admin/settings", label: "Settings", icon: SlidersHorizontal },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-cream-100">
      <header className="sticky top-0 z-40 border-b border-cream-300 bg-white">
        <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <svg viewBox="0 0 64 64" className="h-7 w-7" aria-hidden>
              <rect width="64" height="64" rx="14" fill="#8b1e3f" />
              <path d="M32 13 L51 32 L32 51 L13 32 Z" fill="none" stroke="#c9973f" strokeWidth="5" />
              <circle cx="32" cy="32" r="6" fill="#fdfbf7" />
            </svg>
            <span className="font-display text-lg font-semibold text-rani-800">
              Rangritii <span className="text-ink-500">Admin</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden rounded-full bg-cream-200 px-3 py-1.5 text-xs font-semibold text-ink-700 sm:block">
              {session.email}
              {session.mode === "demo" && " · demo"}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 px-4 py-2 text-xs font-bold text-ink-700 hover:border-rani-300"
            >
              <Store className="h-3.5 w-3.5" /> View Store
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 sm:px-6" aria-label="Admin">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-700 transition hover:bg-cream-200 hover:text-rani-700"
            >
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
