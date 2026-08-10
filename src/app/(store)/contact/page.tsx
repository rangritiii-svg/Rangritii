"use client";

import { useState, useTransition } from "react";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { SITE } from "@/lib/config";
import { sendMessage } from "./actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

export default function ContactPage() {
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink-900">Contact Us</h1>
      <p className="mt-2 max-w-lg text-ink-500">
        Question about sizing, an order, or a style? We answer fast — WhatsApp is quickest.
      </p>

      <div className="mt-9 grid gap-8 md:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <a
            href={`https://wa.me/${SITE.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-cream-300 bg-white p-5 transition hover:border-rani-300"
          >
            <span className="rounded-xl bg-[#25d366]/10 p-3 text-[#1da851]">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">WhatsApp</p>
              <p className="text-sm text-ink-500">{SITE.phone}</p>
            </div>
          </a>
          <a
            href={`tel:${SITE.phone.replace(/\s/g, "")}`}
            className="flex items-center gap-4 rounded-2xl border border-cream-300 bg-white p-5 transition hover:border-rani-300"
          >
            <span className="rounded-xl bg-rani-50 p-3 text-rani-700">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">Call us</p>
              <p className="text-sm text-ink-500">Mon–Sat, 10am–7pm</p>
            </div>
          </a>
          <a
            href={`mailto:${SITE.email}`}
            className="flex items-center gap-4 rounded-2xl border border-cream-300 bg-white p-5 transition hover:border-rani-300"
          >
            <span className="rounded-xl bg-marigold-50 p-3 text-marigold-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">Email</p>
              <p className="text-sm text-ink-500">{SITE.email}</p>
            </div>
          </a>
        </div>

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
      </div>
    </div>
  );
}
