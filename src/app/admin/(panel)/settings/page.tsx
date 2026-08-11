import { SlidersHorizontal } from "lucide-react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getPlatformSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2.5 font-display text-3xl font-semibold text-ink-900">
        <SlidersHorizontal className="h-7 w-7 text-rani-700" /> Platform Settings
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Apne store ke Contact Details (WhatsApp, Call hours, Email) aur Payment Settings (UPI ID, QR code, Commission rate) yahan se control & update karo.
      </p>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
