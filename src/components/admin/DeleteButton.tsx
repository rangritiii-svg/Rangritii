"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

export function DeleteButton({
  label,
  onDelete,
}: {
  label: string;
  onDelete: () => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <button
          onClick={() =>
            startTransition(async () => {
              await onDelete();
              setConfirming(false);
              router.refresh();
            })
          }
          disabled={pending}
          className="rounded-full bg-rani-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rani-800 disabled:opacity-60"
        >
          {pending ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-full border border-cream-300 px-3 py-1.5 text-xs font-semibold text-ink-700"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label={`Delete ${label}`}
      className="rounded-lg p-2 text-ink-300 transition hover:bg-rani-50 hover:text-rani-700"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
