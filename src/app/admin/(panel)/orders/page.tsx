import { Phone } from "lucide-react";
import { OrderStatusSelect } from "@/components/admin/OrderStatusSelect";
import { formatDate, formatINR } from "@/lib/format";
import { getOrders } from "@/lib/orders";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">
        Orders <span className="text-lg text-ink-500">({orders.length})</span>
      </h1>

      {orders.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-cream-300 bg-white py-16 text-center text-ink-500">
          No orders yet. They will appear here the moment customers check out.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((order) => (
            <li key={order.id} className="rounded-3xl border border-cream-300 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-bold text-ink-900">{order.orderNumber}</p>
                  <p className="text-xs text-ink-500">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rani-800">
                    {formatINR(order.total)}
                  </span>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>
              </div>

              <div className="mt-4 grid gap-5 border-t border-cream-200 pt-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Items
                  </p>
                  <ul className="mt-2 space-y-2">
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
                        <span className="font-semibold">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-ink-500">
                    Subtotal {formatINR(order.subtotal)} · Shipping{" "}
                    {order.shippingFee === 0 ? "FREE" : formatINR(order.shippingFee)} ·{" "}
                    <strong className="text-ink-900">COD</strong>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-500">
                    Deliver to
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-900">
                    {order.customerName}
                  </p>
                  <p className="text-sm leading-relaxed text-ink-700">
                    {order.address}, {order.city}, {order.state} — {order.pincode}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-ink-700">
                    <Phone className="h-3.5 w-3.5 text-rani-700" />
                    <a href={`tel:${order.phone}`} className="hover:text-rani-700">
                      {order.phone}
                    </a>
                    <span className="text-ink-300">·</span>
                    <a href={`mailto:${order.email}`} className="hover:text-rani-700">
                      {order.email}
                    </a>
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
