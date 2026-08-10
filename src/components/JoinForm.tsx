"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitArtistProfile } from "@/app/(store)/join/actions";
import type { Style } from "@/lib/types";
import { ArtistFields } from "./ArtistFields";

export function JoinForm({ styles }: { styles: Style[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) {
    return (
      <div className="py-10 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">
          Profile submit ho gayi! 🎉
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Humari team 24–48 hours mein review karke approve kar degi. Approve hote hi
          aapki profile customers ko dikhne lagegi. Status aap apne account page par dekh
          sakti ho.
        </p>
        <button
          onClick={() => router.push("/account")}
          className="mt-6 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white hover:bg-rani-800"
        >
          Go to My Account
        </button>
      </div>
    );
  }

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await submitArtistProfile(formData);
      if (result.ok) {
        setDone(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-5">
      <ArtistFields styles={styles} />
      {error && (
        <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-rani-700 py-4 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {pending ? "Submitting…" : "Submit Profile for Approval"}
      </button>
    </form>
  );
}
