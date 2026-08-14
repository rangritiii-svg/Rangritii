"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateSettingsAction } from "@/app/admin/actions";
import { ImageListInput } from "@/components/ImageListInput";
import type { PlatformSettings } from "@/lib/types";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";
const label = "mb-1.5 block text-xs font-semibold text-ink-700";

export function SettingsForm({ settings }: { settings: PlatformSettings }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await updateSettingsAction(formData);
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form action={submit} className="space-y-8 rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
      {/* ── Section 1: Contact & Support Info ── */}
      <div className="space-y-5">
        <h2 className="border-b border-cream-200 pb-3 text-lg font-bold text-ink-900">
          Contact Us & Support Details
        </h2>
        <p className="text-xs text-ink-500">
          These details appear on the website&apos;s Contact Us page, footer, and WhatsApp float button.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="set-phone">Display Phone / Call Number</label>
            <input
              id="set-phone"
              name="contactPhone"
              defaultValue={settings.contactPhone}
              className={field}
              placeholder="+91 99250 26318"
            />
            <p className="mt-1 text-[11px] text-ink-500">Shown in the Call Us link and on the Contact page.</p>
          </div>

          <div>
            <label className={label} htmlFor="set-whatsapp">WhatsApp Number (with country code)</label>
            <input
              id="set-whatsapp"
              name="contactWhatsapp"
              defaultValue={settings.contactWhatsapp}
              className={field}
              placeholder="919925026318"
            />
            <p className="mt-1 text-[11px] text-ink-500">Used for the direct wa.me chat link (digits only).</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label} htmlFor="set-email">Support Email Address</label>
            <input
              id="set-email"
              name="contactEmail"
              type="email"
              defaultValue={settings.contactEmail}
              className={field}
              placeholder="rangritii21@gmail.com"
            />
            <p className="mt-1 text-[11px] text-ink-500">Used for the Email Us link.</p>
          </div>

          <div>
            <label className={label} htmlFor="set-hours">Call / Working Hours</label>
            <input
              id="set-hours"
              name="contactHours"
              defaultValue={settings.contactHours}
              className={field}
              placeholder="Mon–Sat, 10am–7pm"
            />
            <p className="mt-1 text-[11px] text-ink-500">Shown on the contact card, below the call details.</p>
          </div>
        </div>
      </div>

      {/* ── Section 2: Payment & Commission ── */}
      <div className="space-y-5 border-t border-cream-200 pt-6">
        <h2 className="border-b border-cream-200 pb-3 text-lg font-bold text-ink-900">
          Payment & Commission Settings
        </h2>

        <div>
          <label className={label} htmlFor="set-upi">Platform (admin) UPI ID</label>
          <input
            id="set-upi"
            name="upiId"
            defaultValue={settings.upiId}
            className={field}
            placeholder="rangritii@okhdfcbank"
          />
          <p className="mt-1.5 text-xs text-ink-500">
            This UPI ID is shown to customers on the payment page and to artists for paying commission.
          </p>
        </div>

        <ImageListInput
          name="upiQr"
          label="Platform UPI QR code (image)"
          initial={settings.upiQr ? [settings.upiQr] : []}
          single
        />

        <div>
          <label className={label} htmlFor="set-comm">Commission (%)</label>
          <input
            id="set-comm"
            name="commissionPercent"
            type="number"
            min="0"
            max="50"
            step="0.5"
            required
            defaultValue={settings.commissionPercent}
            className={field}
          />
          <p className="mt-1.5 text-xs text-ink-500">
            This percentage is charged as commission on each booking&apos;s final amount.
          </p>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-rani-700 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Settings Saved Successfully!
          </span>
        )}
      </div>
    </form>
  );
}
