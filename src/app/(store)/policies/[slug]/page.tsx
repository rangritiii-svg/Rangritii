import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/config";

type Section = { heading: string; body: string[] };
type Policy = { title: string; intro: string; sections: Section[] };

const POLICIES: Record<string, Policy> = {
  "cancellation-policy": {
    title: "Cancellation Policy",
    intro: "Plans badalte hain — hum samajhte hain. Simple rules:",
    sections: [
      {
        heading: "Customer cancellation",
        body: [
          "Booking request confirm hone se pehle kabhi bhi free cancel kar sakte ho.",
          "Confirm hone ke baad, event se kam se kam 48 hours pehle artist ko WhatsApp/call par bata dein.",
          "Rangritii par booking request free hai — koi advance Rangritii ko nahi diya jata, isliye platform refund ka sawaal hi nahi.",
          "Agar aapne artist ko koi advance diya hai, uska refund artist ki apni policy ke hisaab se hoga — confirm karte waqt puch lein.",
        ],
      },
      {
        heading: "Artist cancellation",
        body: [
          "Agar artist confirm karke cancel karti hai, toh hum aapko turant doosri available artist dhundhne mein help karenge.",
          "Baar-baar cancel karne wali artists ki profile suspend ho sakti hai.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    intro: "Aapka data aapka hai. Hum kya collect karte hain aur kyun:",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Booking details: naam, phone, address aur event info — sirf artist tak booking pahunchane ke liye.",
          "Account details agar sign up karo: email aur aapki bookings.",
          "Artist profiles: jo details artist khud publish ke liye deti hain (naam, city, portfolio, WhatsApp).",
        ],
      },
      {
        heading: "What we never do",
        body: [
          "Hum aapka personal data kisi ko bechte nahi.",
          "Aapka phone/address sirf usi artist ko dikhta hai jise aapne booking bheji hai.",
          "Data delete karwana ho toh " + SITE.email + " par likh do — 7 din mein ho jayega.",
        ],
      },
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    intro: "Short & human version:",
    sections: [
      {
        heading: "Platform ka role",
        body: [
          "Rangritii customers aur independent mehandi artists ko connect karta hai — service khud artist deti hai.",
          "Price, timing aur design ki final baat customer aur artist ke beech hoti hai; payment seedha artist ko.",
          "Hum profiles verify karte hain, par service quality ki final zimmedari artist ki hai. Koi dikkat ho toh humein zaroor batao — hum action lete hain.",
        ],
      },
      {
        heading: "Fair use",
        body: [
          "Fake bookings, spam ya galat contact details par account block ho sakta hai.",
          "Artists apne hi kaam ki photos portfolio mein daalein — doosron ke designs chori karna ban ka reason hai.",
          "Portfolio content Rangritii promotional use kar sakta hai (artist ke credit ke saath).",
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
