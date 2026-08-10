export function AnnouncementBar() {
  const messages = [
    "Booking requests bilkul FREE hain",
    "Verified mehandi artists — portfolio dekh ke chuno",
    "Bridal se party tak, har style available",
    "Artist? Free mein register karo aur bookings pao",
  ];
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
