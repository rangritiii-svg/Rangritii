"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { CheckCircle2, PauseCircle } from "lucide-react";
import { setArtistApprovalAction } from "@/app/admin/actions";

export function ApprovalToggle({
  artistId,
  isApproved,
}: {
  artistId: string;
  isApproved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await setArtistApprovalAction(artistId, !isApproved);
          router.refresh();
        })
      }
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition disabled:opacity-60 ${
        isApproved
          ? "border border-cream-300 bg-white text-ink-700 hover:border-rani-300"
          : "bg-green-600 text-white hover:bg-green-700"
      }`}
    >
      {isApproved ? (
        <>
          <PauseCircle className="h-3.5 w-3.5" /> {pending ? "…" : "Unapprove"}
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" /> {pending ? "…" : "Approve"}
        </>
      )}
    </button>
  );
}
