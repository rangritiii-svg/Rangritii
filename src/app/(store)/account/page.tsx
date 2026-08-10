import type { Metadata } from "next";
import Link from "next/link";
import { Database, LogOut, Package, ShieldCheck } from "lucide-react";
import { AuthTabs } from "@/components/AuthTabs";
import { isSupabaseConfigured } from "@/lib/config";
import { formatDate, formatINR } from "@/lib/format";
import { getOrdersForUser } from "@/lib/orders";
import { signOut } from "./actions";

export const metadata: Metadata = { title: "My Account" };
export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-marigold-100 text-marigold-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-rani-100 text-rani-800",
};

export default async function AccountPage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Database className="mx-auto h-14 w-14 text-ink-300" />
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">
          Demo mode chal raha hai
        </h1>
        <p className="mx-auto mt-3 max-w-md text-ink-500">
          Customer accounts unlock once Supabase is connected (2-minute setup — see the
          project README). Shopping, cart aur checkout abhi bhi fully working hain!
        </p>
        <div className="mx-auto mt-8 max-w-sm rounded-3xl border border-cream-300 bg-white p-6 text-left">
          <p className="flex items-center gap-2 text-sm font-bold text-ink-900">
            <ShieldCheck className="h-4 w-4 text-rani-700" /> Admin panel demo
          </p>
          <p className="mt-2 text-sm text-ink-500">
            Store manager ho? Admin panel try karo:
          </p>
          <Link
            href="/admin/login"
            className="mt-4 block rounded-full bg-rani-700 py-3 text-center text-sm font-bold text-white hover:bg-rani-800"
          >
            Go to Admin Login
          </Link>
        </div>
      </div>
    );
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h1 className="text-center font-display text-4xl font-semibold text-ink-900">
          Welcome back
        </h1>
        <p className="mt-2 text-center text-ink-500">
          Log in to track orders and check out faster.
        </p>
        <div className="mt-8">
          <AuthTabs />
        </div>
      </div>
    );
  }

  const orders = await getOrdersForUser(user.id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-900 sm:text-4xl">
            Namaste, {profile?.full_name || user.email} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">{user.email}</p>
        </div>
        <div className="flex gap-3">
          {profile?.role === "admin" && (
            <Link
              href="/admin"
              className="rounded-full border-2 border-rani-700 px-5 py-2.5 text-sm font-bold text-rani-700 hover:bg-rani-50"
            >
              Admin Panel
            </Link>
          )}
          <form action={signOut}>
            <button className="inline-flex items-center gap-2 rounded-full border border-cream-300 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 hover:border-rani-300">
              <LogOut className="h-4 w-4" /> Log out
            </button>
          </form>
        </div>
      </div>

      <h2 className="mt-10 flex items-center gap-2 font-display text-2xl font-semibold text-ink-900">
        <Package className="h-5 w-5 text-rani-700" /> My Orders
      </h2>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-cream-300 bg-white py-16 text-center">
          <p className="text-ink-500">No orders yet — your first Rangritii look awaits.</p>
          <Link
            href="/shop"
            className="mt-5 inline-block rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-ink-900">{order.orderNumber}</p>
                  <p className="text-xs text-ink-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      STATUS_STYLES[order.status] ?? "bg-cream-200 text-ink-700"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="font-bold text-rani-800">{formatINR(order.total)}</span>
                </div>
              </div>
              <ul className="mt-4 space-y-2 border-t border-cream-200 pt-4">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                    {item.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={item.image} alt="" className="h-12 w-9 rounded-lg object-cover" />
                    )}
                    <span className="flex-1 text-ink-700">
                      {item.productName}
                      {item.size && ` · ${item.size}`} × {item.quantity}
                    </span>
                    <span className="font-semibold">{formatINR(item.price * item.quantity)}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
