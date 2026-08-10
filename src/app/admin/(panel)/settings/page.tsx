import { IndianRupee } from "lucide-react";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getPlatformSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="flex items-center gap-2 font-display text-3xl font-semibold text-ink-900">
        <IndianRupee className="h-7 w-7 text-rani-700" /> Payment Settings
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Apna UPI ID, QR code aur commission rate yahan set karo. Yeh details customers
        (payment page par) aur artists (commission bharne ke liye) ko dikhengi.
      </p>
      <div className="mt-6">
        <SettingsForm settings={settings} />
      </div>
    </div>
  );
}
