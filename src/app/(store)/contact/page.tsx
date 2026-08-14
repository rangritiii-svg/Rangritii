import { Mail, MessageCircle, Phone } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { getPlatformSettings } from "@/lib/data";

export const revalidate = 0; // Dynamic rendering to fetch latest settings

export default async function ContactPage() {
  const settings = await getPlatformSettings();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink-900">Contact Us</h1>
      <p className="mt-2 max-w-lg text-ink-500">
        Need help with a booking, have a question about an artist, or are you an
        artist yourself? We answer fast — WhatsApp is quickest.
      </p>

      <div className="mt-9 grid gap-8 md:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <a
            href={`https://wa.me/${settings.contactWhatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-cream-300 bg-white p-5 transition hover:border-rani-300"
          >
            <span className="rounded-xl bg-[#25d366]/10 p-3 text-[#1da851]">
              <MessageCircle className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">WhatsApp</p>
              <p className="text-sm text-ink-500">
                {settings.contactPhone || `+${settings.contactWhatsapp}`}
              </p>
            </div>
          </a>
          <a
            href={`tel:${settings.contactPhone.replace(/\s/g, "")}`}
            className="flex items-center gap-4 rounded-2xl border border-cream-300 bg-white p-5 transition hover:border-rani-300"
          >
            <span className="rounded-xl bg-rani-50 p-3 text-rani-700">
              <Phone className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">Call us</p>
              <p className="text-sm text-ink-500">{settings.contactHours}</p>
            </div>
          </a>
          <a
            href={`mailto:${settings.contactEmail}`}
            className="flex items-center gap-4 rounded-2xl border border-cream-300 bg-white p-5 transition hover:border-rani-300"
          >
            <span className="rounded-xl bg-marigold-50 p-3 text-marigold-600">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink-900">Email</p>
              <p className="text-sm text-ink-500">{settings.contactEmail}</p>
            </div>
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
