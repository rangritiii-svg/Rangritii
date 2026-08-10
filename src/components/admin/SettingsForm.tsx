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
    <form action={submit} className="space-y-5 rounded-3xl border border-cream-300 bg-white p-6">
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
          Yeh UPI customers ko payment page par aur artists ko commission bharne ke liye
          dikhega.
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
          Har booking ke final amount par yeh % commission banega. (Amount set hote waqt
          snapshot hota hai — baad mein % badalne se purani bookings par asar nahi.)
        </p>
      </div>

      {error && (
        <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-rani-700 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Settings"}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-700">
            <Check className="h-4 w-4" /> Saved!
          </span>
        )}
      </div>
    </form>
  );
}
