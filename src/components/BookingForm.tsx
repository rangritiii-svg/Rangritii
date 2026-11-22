"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ChevronLeft, Minus, Plus } from "lucide-react";
import { placeBooking } from "@/app/(store)/book/actions";
import { formatEventDate, formatINR } from "@/lib/format";
import { EVENT_TYPES, type ArtistPackage } from "@/lib/types";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-[16px] outline-none transition focus:border-rani-400";
const label = "mb-1.5 block text-sm font-medium text-ink-700";

type Details = {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  eventDate: string;
  eventType: string;
  notes: string;
};

export const PAY_PHONE_KEY = "rt_pay_phone";

export function BookingForm({
  artistId,
  artistName,
  artistCity,
  packages,
  tokenAmount,
  priceHint,
}: {
  artistId: string;
  artistName: string;
  artistCity: string;
  packages: ArtistPackage[];
  tokenAmount: number;
  /** Shown when the artist has not listed packages, e.g. "₹400 – ₹5,000". */
  priceHint?: string;
}) {
  const router = useRouter();
  const hasPackages = packages.length > 0;
  const [step, setStep] = useState<1 | 2 | 3>(hasPackages ? 1 : 2);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [d, setD] = useState<Details>({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: artistCity,
    eventDate: "",
    eventType: EVENT_TYPES[0],
    notes: "",
  });
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  const lines = packages.filter((p) => (qty[p.id] ?? 0) > 0).map((p) => ({ ...p, qty: qty[p.id] }));
  const total = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const token = total > 0 ? Math.min(tokenAmount, total) : tokenAmount;
  const balance = Math.max(0, total - token);

  const set = (k: keyof Details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setD((prev) => ({ ...prev, [k]: e.target.value }));

  const detailsProblem = useMemo(() => {
    if (!d.customerName.trim()) return "Enter your name.";
    if (!/^[6-9]\d{9}$/.test(d.phone.replace(/\D/g, "").slice(-10))) return "Enter a 10-digit mobile number.";
    if (!d.eventDate) return "Pick the mehandi date.";
    if (d.address.trim().length < 8) return "Enter the full address where the mehandi will be done.";
    if (!d.city.trim()) return "Enter your city.";
    return "";
  }, [d]);

  function next() {
    setError("");
    if (step === 1) {
      if (lines.length === 0) return setError("Choose at least one package.");
      setStep(2);
    } else if (step === 2) {
      if (detailsProblem) return setError(detailsProblem);
      setStep(3);
    } else {
      submit();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function back() {
    setError("");
    if (step === 3) setStep(2);
    else if (step === 2 && hasPackages) setStep(1);
    else router.back();
  }

  function submit() {
    startTransition(async () => {
      const result = await placeBooking(
        artistId,
        { ...d, phone: d.phone.replace(/\D/g, "").slice(-10) },
        lines.map((l) => ({ packageId: l.id, qty: l.qty }))
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      try {
        sessionStorage.setItem(PAY_PHONE_KEY, d.phone.replace(/\D/g, "").slice(-10));
      } catch {
        /* storage blocked — the pay page will just ask for the phone */
      }
      if (result.token > 0) {
        router.push(`/pay?number=${encodeURIComponent(result.bookingNumber)}`);
      } else {
        const sp = new URLSearchParams({ number: result.bookingNumber, artist: result.artistName });
        router.push(`/booking-confirmed?${sp.toString()}`);
      }
    });
  }

  const stepNames = hasPackages ? ["Packages", "Your details", "Review"] : ["Your details", "Review"];
  const stepIndex = hasPackages ? step - 1 : step - 2;

  return (
    <div className="pb-28">
      {/* progress */}
      <ol className="flex gap-2" aria-label="Booking steps">
        {stepNames.map((n, i) => (
          <li key={n} className="flex-1">
            <span className={`block h-1 rounded-full ${i <= stepIndex ? "bg-rani-700" : "bg-cream-300"}`} />
            <span className={`mt-1.5 block text-xs font-medium ${i === stepIndex ? "text-rani-800" : "text-ink-500"}`}>
              {n}
            </span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="mt-6">
          <h2 className="text-[20px] font-semibold text-ink-900">What would you like?</h2>
          <p className="mt-1 text-[15px] text-ink-500">Add how many people need each package.</p>
          <ul className="mt-4 space-y-3">
            {packages.map((p) => {
              const n = qty[p.id] ?? 0;
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 rounded-2xl border bg-white p-4 ${n ? "border-rani-400" : "border-cream-300"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-medium text-ink-900">{p.name}</p>
                    <p className="text-sm text-stain-700">
                      {formatINR(p.price)} <span className="text-ink-500">{p.unit === "per_person" ? "per person" : "per event"}</span>
                    </p>
                  </div>
                  {n === 0 ? (
                    <button
                      type="button"
                      onClick={() => setQty((q) => ({ ...q, [p.id]: 1 }))}
                      className="rounded-full border-2 border-rani-700 px-5 py-2 text-[15px] font-semibold text-rani-700"
                    >
                      Add
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 rounded-full bg-rani-700 text-white">
                      <button
                        type="button"
                        aria-label={`One less ${p.name}`}
                        onClick={() => setQty((q) => ({ ...q, [p.id]: Math.max(0, n - 1) }))}
                        className="grid h-10 w-10 place-items-center"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-6 text-center text-[16px] font-semibold" aria-live="polite">{n}</span>
                      <button
                        type="button"
                        aria-label={`One more ${p.name}`}
                        onClick={() => setQty((q) => ({ ...q, [p.id]: Math.min(p.unit === "per_event" ? 1 : 50, n + 1) }))}
                        className="grid h-10 w-10 place-items-center"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6 space-y-4">
          <h2 className="text-[20px] font-semibold text-ink-900">When and where?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="eventDate">Mehandi date</label>
              <input id="eventDate" type="date" min={minDate} value={d.eventDate} onChange={set("eventDate")} className={field} />
            </div>
            <div>
              <label className={label} htmlFor="eventType">Occasion</label>
              <select id="eventType" value={d.eventType} onChange={set("eventType")} className={field}>
                {EVENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={label} htmlFor="address">Address where the mehandi will be done</label>
            <textarea id="address" rows={3} value={d.address} onChange={set("address")} className={field} placeholder="House no., street, landmark" autoComplete="street-address" />
          </div>
          <div>
            <label className={label} htmlFor="city">City</label>
            <input id="city" value={d.city} onChange={set("city")} className={field} autoComplete="address-level2" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="customerName">Your name</label>
              <input id="customerName" value={d.customerName} onChange={set("customerName")} className={field} autoComplete="name" />
            </div>
            <div>
              <label className={label} htmlFor="phone">Mobile number</label>
              <input id="phone" type="tel" inputMode="numeric" value={d.phone} onChange={set("phone")} className={field} placeholder="98765 43210" autoComplete="tel" />
            </div>
          </div>
          <div>
            <label className={label} htmlFor="email">Email <span className="font-normal text-ink-500">(optional)</span></label>
            <input id="email" type="email" value={d.email} onChange={set("email")} className={field} autoComplete="email" />
          </div>
          <div>
            <label className={label} htmlFor="notes">Anything the artist should know? <span className="font-normal text-ink-500">(optional)</span></label>
            <textarea id="notes" rows={2} value={d.notes} onChange={set("notes")} className={field} placeholder="Preferred time, design ideas, how far up the arm" />
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6">
          <h2 className="text-[20px] font-semibold text-ink-900">Check and book</h2>
          <div className="mt-4 rounded-2xl border border-cream-300 bg-white">
            <dl className="divide-y divide-cream-200 text-[15px]">
              <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-500">Artist</dt><dd className="text-right font-medium">{artistName}</dd></div>
              <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-500">Date</dt><dd className="text-right font-medium">{formatEventDate(d.eventDate)}<span className="block font-normal text-ink-500">{d.eventType}</span></dd></div>
              <div className="flex justify-between gap-4 px-4 py-3"><dt className="text-ink-500">Where</dt><dd className="text-right">{d.address}, {d.city}</dd></div>
            </dl>
          </div>

          <div className="mt-4 rounded-2xl border border-cream-300 bg-white p-4">
            {lines.length > 0 && (
              <ul className="space-y-1.5 text-[15px] text-ink-700">
                {lines.map((l) => (
                  <li key={l.id} className="flex justify-between gap-3">
                    <span>{l.name} × {l.qty}</span>
                    <span>{formatINR(l.price * l.qty)}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="mt-3 space-y-1.5 border-t border-cream-200 pt-3 text-[15px]">
              {total > 0 && (
                <div className="flex justify-between"><dt className="font-semibold text-ink-900">Total</dt><dd className="font-semibold">{formatINR(total)}</dd></div>
              )}
              {!hasPackages && (
                <div className="flex justify-between gap-4">
                  <dt className="font-semibold text-ink-900">Price</dt>
                  <dd className="text-right font-semibold">
                    {priceHint || "Price on request"}
                    <span className="block text-sm font-normal text-ink-500">Exact price is confirmed by the artist</span>
                  </dd>
                </div>
              )}
              {token > 0 && (
                <div className="flex justify-between text-stain-700"><dt className="font-semibold">Pay now (token)</dt><dd className="font-semibold">{formatINR(token)}</dd></div>
              )}
              {total > 0 && (
                <div className="flex justify-between text-ink-500"><dt>Pay after the mehandi</dt><dd>{formatINR(balance)}</dd></div>
              )}
            </dl>
          </div>
          <p className="mt-3 text-sm text-ink-500">
            {token > 0
              ? `Your request reaches ${artistName.split(" ")[0]} once the token is received. If she can't take it, the token is refunded in full.${
                  hasPackages ? "" : " The token is adjusted in the price she confirms."
                }`
              : `${artistName.split(" ")[0]} will confirm the price with you.`}
          </p>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-[15px] font-medium text-rani-800">
          {error}
        </p>
      )}

      {/* sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-white px-4 pb-[calc(var(--sab)+0.75rem)] pt-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button type="button" onClick={back} className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-cream-300 text-ink-700" aria-label="Back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 text-sm leading-tight text-ink-500">
            {total > 0 ? (
              <>Total <span className="block text-[17px] font-semibold text-ink-900">{formatINR(total)}</span></>
            ) : (
              <span>{step === 1 ? "Add a package" : ""}</span>
            )}
          </div>
          <button
            type="button"
            onClick={next}
            disabled={pending}
            className="shrink-0 rounded-full bg-rani-700 px-6 py-3.5 text-[16px] font-semibold text-white active:bg-rani-800 disabled:opacity-60"
          >
            {step < 3 ? "Continue" : pending ? "Booking…" : token > 0 ? `Book & pay ${formatINR(token)}` : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
