import { formatINR } from "@/lib/format";

/** The four stages of a Rangritii booking — a real sequence, so it is numbered. */
export function BookingSteps({
  tokenAmount,
  responseHours,
  artistName,
}: {
  tokenAmount: number;
  responseHours: number;
  artistName?: string;
}) {
  const who = artistName ? artistName.split(" ")[0] : "The artist";
  const steps = [
    {
      title: "Choose packages and your date",
      body: "You see the full price before you pay anything.",
    },
    {
      title: tokenAmount > 0 ? `Pay a ${formatINR(tokenAmount)} token` : "Send the request",
      body:
        tokenAmount > 0
          ? "Scan Rangritii's UPI QR and enter the UTR. It is adjusted in your total."
          : "Your request goes straight to the artist.",
    },
    {
      title: `${who} confirms within ${responseHours} hours`,
      body: "Her phone and WhatsApp unlock. If she can't make it, your token is refunded in full.",
    },
    {
      title: "Pay the balance after the mehandi",
      body: "On UPI or in cash to the artist, once the work is done.",
    },
  ];
  return (
    <ol className="mt-3 space-y-0">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
          {i < steps.length - 1 && (
            <span className="absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px bg-cream-300" aria-hidden />
          )}
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rani-50 text-sm font-semibold text-rani-800">
            {i + 1}
          </span>
          <div>
            <p className="text-[15px] font-semibold text-ink-900">{s.title}</p>
            <p className="text-sm text-ink-500">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
