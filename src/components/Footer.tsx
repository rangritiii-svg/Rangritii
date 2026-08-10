import Link from "next/link";
import { Instagram, Facebook, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/config";

const shopLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/shop?filter=new", label: "New Arrivals" },
  { href: "/shop?filter=bestsellers", label: "Bestsellers" },
  { href: "/shop?category=party-wear", label: "Party Wear" },
  { href: "/shop?category=plus-size", label: "Plus Size" },
];

const serviceLinks = [
  { href: "/policies/shipping-policy", label: "Shipping Policy" },
  { href: "/policies/refund-policy", label: "Refund & Returns" },
  { href: "/policies/privacy-policy", label: "Privacy Policy" },
  { href: "/policies/terms-of-service", label: "Terms of Service" },
  { href: "/policies/size-guide", label: "Size Guide" },
];

export function Footer() {
  return (
    <footer className="mt-16 bg-rani-900 text-cream-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-semibold text-white">Rangritii</p>
          <p className="mt-1 font-display italic text-marigold-200">{SITE.tagline}</p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream-200/90">
            {SITE.description}
          </p>
          <div className="mt-5 flex gap-3">
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="rounded-full border border-cream-100/25 p-2.5 transition hover:border-marigold-300 hover:text-marigold-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={SITE.facebook}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="rounded-full border border-cream-100/25 p-2.5 transition hover:border-marigold-300 hover:text-marigold-300"
            >
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-marigold-300">Shop</p>
          <ul className="mt-4 space-y-2.5">
            {shopLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-cream-200/90 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-marigold-300">
            Customer Care
          </p>
          <ul className="mt-4 space-y-2.5">
            {serviceLinks.map((l) => (
              <li key={l.label}>
                <Link href={l.href} className="text-sm text-cream-200/90 transition hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-marigold-300">
            Get in Touch
          </p>
          <ul className="mt-4 space-y-3 text-sm text-cream-200/90">
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 shrink-0 text-marigold-300" />
              <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="hover:text-white">
                {SITE.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 shrink-0 text-marigold-300" />
              <a href={`mailto:${SITE.email}`} className="hover:text-white">
                {SITE.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 shrink-0 translate-y-0.5 text-marigold-300" />
              <span>Shipping across India 🇮🇳</span>
            </li>
          </ul>
          <p className="mt-5 rounded-xl bg-white/5 px-4 py-3 text-xs leading-relaxed text-cream-200/80">
            Cash on Delivery available · Free shipping on orders above ₹{SITE.freeShippingAbove}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-cream-200/70">
        © {new Date().getFullYear()} {SITE.name}. Crafted with rang & pyaar.
      </div>
    </footer>
  );
}
