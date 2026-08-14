export function AnnouncementBar() {
  const messages = [
    "Booking requests are completely FREE",
    "Verified mehandi artists — browse portfolios and choose",
    "From bridal to party, every style available",
    "Artist? Register for free and get bookings",
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
