import Link from "next/link";
import { ArrowRight, IndianRupee, Package, ShoppingCart, Timer } from "lucide-react";
import { getProducts } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/format";
import { getOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-marigold-100 text-marigold-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-rani-100 text-rani-800",
};

export default async function AdminDashboard() {
  const [products, orders] = await Promise.all([
    getProducts({ includeInactive: true }),
    getOrders(),
  ]);

  const pending = orders.filter((o) => o.status === "pending");
  const revenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);

  const stats = [
    { label: "Total revenue", value: formatINR(revenue), icon: IndianRupee },
    { label: "Orders", value: String(orders.length), icon: ShoppingCart },
    { label: "Pending orders", value: String(pending.length), icon: Timer },
    { label: "Products", value: String(products.length), icon: Package },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-cream-300 bg-white p-5">
            <span className="inline-flex rounded-xl bg-rani-50 p-2.5 text-rani-700">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-bold text-ink-900">{value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-ink-900">Recent orders</h2>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm font-semibold text-rani-700 hover:underline"
        >
          All orders <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-3xl border border-cream-300 bg-white">
        <table className="w-full min-w-140 text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3.5">Order</th>
              <th className="px-5 py-3.5">Customer</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.slice(0, 6).map((o) => (
              <tr key={o.id} className="border-b border-cream-100 last:border-0">
                <td className="px-5 py-3.5 font-bold text-ink-900">{o.orderNumber}</td>
                <td className="px-5 py-3.5 text-ink-700">{o.customerName}</td>
                <td className="px-5 py-3.5 text-ink-500">{formatDate(o.createdAt)}</td>
                <td className="px-5 py-3.5">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                      STATUS_STYLES[o.status] ?? "bg-cream-200 text-ink-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-rani-800">
                  {formatINR(o.total)}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-ink-500">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
