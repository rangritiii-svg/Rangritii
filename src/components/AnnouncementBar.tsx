import { SITE } from "@/lib/config";

const messages = [
  `Free shipping on orders above ₹${SITE.freeShippingAbove}`,
  "Cash on Delivery available across India",
  "New drops every week — fresh rang, fresh styles",
  "Easy 7-day returns on all orders",
];

export function AnnouncementBar() {
  const line = messages.map((m) => `${m}  ✦  `).join("");
  return (
    <div className="overflow-hidden bg-rani-800 py-2 text-cream-100">
      <div className="animate-marquee flex w-max whitespace-nowrap text-xs font-medium tracking-wide">
        <span>{line}</span>
        <span aria-hidden>{line}</span>
      </div>
    </div>
  );
}
