import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@/lib/config";

type Section = { heading: string; body: string[] };
type Policy = { title: string; intro: string; sections: Section[] };

const POLICIES: Record<string, Policy> = {
  "shipping-policy": {
    title: "Shipping Policy",
    intro: "We ship across India with trusted courier partners.",
    sections: [
      {
        heading: "Timelines",
        body: [
          "Orders are dispatched within 24–48 working hours.",
          "Metro cities: 2–4 working days after dispatch. Rest of India: 4–7 working days.",
          "You will receive tracking details on WhatsApp/SMS once your order ships.",
        ],
      },
      {
        heading: "Charges",
        body: [
          `Free shipping on all orders above ₹${SITE.freeShippingAbove}.`,
          `Orders below ₹${SITE.freeShippingAbove} carry a flat ₹${SITE.shippingFee} shipping fee.`,
          "Cash on Delivery is available at no extra charge.",
        ],
      },
    ],
  },
  "refund-policy": {
    title: "Refund & Return Policy",
    intro: "Didn't love it? No stress — returns are easy.",
    sections: [
      {
        heading: "7-day easy returns",
        body: [
          "Raise a return/exchange request within 7 days of delivery via WhatsApp or email.",
          "Products must be unused, unwashed, with original tags intact.",
          "Party wear with detachable embellishments is eligible only for size exchange.",
        ],
      },
      {
        heading: "Refunds",
        body: [
          "Once the pickup passes quality check, refunds are processed within 5–7 working days.",
          "COD orders are refunded to your UPI/bank account; prepaid orders to the original payment method.",
        ],
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    intro: "Your data belongs to you. Here is exactly what we do with it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Order details: name, phone, email and delivery address — used only to fulfil your order.",
          "Account details if you sign up: email and the orders linked to your account.",
        ],
      },
      {
        heading: "What we never do",
        body: [
          "We never sell your personal data to anyone.",
          "We never store card/UPI details — payments (when enabled) are handled by secure payment gateways.",
          "You can ask us to delete your data anytime by writing to " + SITE.email + ".",
        ],
      },
    ],
  },
  "terms-of-service": {
    title: "Terms of Service",
    intro: "The short, human version of our terms.",
    sections: [
      {
        heading: "Orders & pricing",
        body: [
          "All prices are in INR and inclusive of taxes.",
          "We may cancel orders due to stock errors or unserviceable pincodes — you will be informed and refunded in full.",
          "Product colours may vary slightly due to screen settings and photography lighting.",
        ],
      },
      {
        heading: "Fair use",
        body: [
          "Content on this site (images, text, designs) belongs to Rangritii and cannot be reused without permission.",
          "Abusive or fraudulent activity (fake COD orders, chargebacks) may lead to blocked service.",
        ],
      },
    ],
  },
  "size-guide": {
    title: "Size Guide",
    intro: "Measure a well-fitting kurta of yours and match it below (all in inches).",
    sections: [
      {
        heading: "Standard sizes",
        body: [
          "S — Bust 36 · Waist 32 · Hip 38",
          "M — Bust 38 · Waist 34 · Hip 40",
          "L — Bust 40 · Waist 36 · Hip 42",
          "XL — Bust 42 · Waist 38 · Hip 44",
          "XXL — Bust 44 · Waist 40 · Hip 46",
        ],
      },
      {
        heading: "Curve (plus) sizes",
        body: [
          "3XL — Bust 46 · Waist 42 · Hip 48",
          "4XL — Bust 48 · Waist 44 · Hip 50",
          "5XL — Bust 50 · Waist 46 · Hip 52",
          "Between sizes? Size up for a relaxed fit, or WhatsApp us — we love helping you find the right fit.",
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
