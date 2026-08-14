import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/config";

type Section = { heading: string; body: string[] };
type Policy = { title: string; intro: string; sections: Section[] };

const POLICIES: Record<string, Policy> = {
  "cancellation-policy": {
    title: "Cancellation Policy",
    intro: "Plans change — we get it. Here are the simple rules:",
    sections: [
      {
        heading: "Customer cancellation",
        body: [
          "You can cancel free of charge any time before your booking request is confirmed.",
          "After confirmation, please let the artist know on WhatsApp or by call at least 48 hours before the event.",
          "Booking requests on Rangritii are free — no advance is ever paid to Rangritii, so there is nothing for the platform to refund.",
          "If you paid the artist an advance, its refund follows the artist's own policy — do ask about it when confirming.",
        ],
      },
      {
        heading: "Artist cancellation",
        body: [
          "If an artist cancels after confirming, we'll immediately help you find another available artist.",
          "Artists who cancel repeatedly may have their profiles suspended.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    intro: "Your data is yours. Here's what we collect and why:",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Booking details: your name, phone, address and event info — used only to deliver your booking to the artist.",
          "Account details if you sign up: your email and your bookings.",
          "Artist profiles: the details artists themselves share for publishing (name, city, portfolio, WhatsApp).",
        ],
      },
      {
        heading: "What we never do",
        body: [
          "We never sell your personal data to anyone.",
          "Your phone/address is visible only to the artist you sent a booking to.",
          "Want your data deleted? Write to " + SITE.email + " — it's done within 7 days.",
        ],
      },
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    intro: "Short & human version:",
    sections: [
      {
        heading: "The platform's role",
        body: [
          "Rangritii connects customers with independent mehandi artists — the service itself is provided by the artist.",
          "The final price, timing and design are agreed between the customer and the artist; payment goes directly to the artist.",
          "We verify profiles, but final responsibility for service quality rests with the artist. If anything goes wrong, do tell us — we take action.",
        ],
      },
      {
        heading: "Fair use",
        body: [
          "Fake bookings, spam or false contact details can get an account blocked.",
          "Artists should only upload photos of their own work — stealing others' designs is grounds for a ban.",
          "Rangritii may use portfolio content for promotion (with credit to the artist).",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  return { title: policy ? policy.title : "Policy" };
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink-900">{policy.title}</h1>
      <p className="mt-3 text-ink-500">{policy.intro}</p>
      <div className="mt-8 space-y-6">
        {policy.sections.map((s) => (
          <section key={s.heading} className="rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
            <h2 className="font-display text-xl font-semibold text-ink-900">{s.heading}</h2>
            <ul className="mt-4 space-y-2.5">
              {s.body.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-ink-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-marigold-500" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="mt-8 text-sm text-ink-500">
        Questions? Reach us at {SITE.email} or WhatsApp {SITE.phone}.
      </p>
    </div>
  );
}
