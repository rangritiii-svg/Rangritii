"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/app/(store)/contact/actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

export function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await sendMessage(formData);
      if (result.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
      {status === "sent" ? (
        <div className="py-10 text-center">
          <Send className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">
            Message sent!
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            We usually reply within a few hours on working days.
          </p>
        </div>
      ) : (
        <form action={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="name">
                Your name *
              </label>
              <input id="name" name="name" required className={field} placeholder="Priya Sharma" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="email">
                Email *
              </label>
              <input id="email" name="email" type="email" required className={field} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="message">
              Message *
            </label>
            <textarea id="message" name="message" required rows={5} className={field} placeholder="Tell us how we can help…" />
          </div>
          {status === "error" && (
            <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send Message"} <Send className="h-4 w-4" />
          </button>
        </form>
      )}
    </div>
  );
}
