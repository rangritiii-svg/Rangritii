"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateOrderStatusAction } from "@/app/admin/actions";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={current}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as OrderStatus;
        const previous = current;
        setCurrent(next);
        startTransition(async () => {
          const result = await updateOrderStatusAction(orderId, next);
          if (!result.ok) setCurrent(previous);
          router.refresh();
        });
      }}
      className="rounded-full border border-cream-300 bg-white px-3 py-1.5 text-xs font-bold capitalize text-ink-900 outline-none focus:border-rani-400 disabled:opacity-60"
      aria-label="Order status"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
