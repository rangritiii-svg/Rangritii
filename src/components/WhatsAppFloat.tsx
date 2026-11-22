import { SITE } from "@/lib/config";
import { getPlatformSettings } from "@/lib/data";
import { WhatsAppButton } from "./WhatsAppButton";

export async function WhatsAppFloat() {
  const settings = await getPlatformSettings();
  return <WhatsAppButton number={settings.contactWhatsapp || SITE.whatsapp} />;
}
