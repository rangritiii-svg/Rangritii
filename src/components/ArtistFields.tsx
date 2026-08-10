"use client";

import type { Artist, Style } from "@/lib/types";
import { ImageListInput } from "./ImageListInput";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";
const label = "mb-1.5 block text-xs font-semibold text-ink-700";

/** Shared artist-profile fields used by /join, account editing and the admin form. */
export function ArtistFields({
  styles,
  artist,
}: {
  styles: Style[];
  artist?: Artist | null;
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label} htmlFor="af-name">Artist name *</label>
          <input id="af-name" name="name" required defaultValue={artist?.name} className={field} placeholder="Meera Rathore" />
        </div>
        <div>
          <label className={label} htmlFor="af-whatsapp">WhatsApp number</label>
          <input
            id="af-whatsapp"
            name="whatsapp"
            type="tel"
            defaultValue={artist?.whatsapp?.replace(/^91(\d{10})$/, "$1")}
            className={field}
            placeholder="98765 43210"
          />
        </div>
        <div>
          <label className={label} htmlFor="af-city">City *</label>
          <input id="af-city" name="city" required defaultValue={artist?.city} className={field} placeholder="Jaipur" />
        </div>
        <div>
          <label className={label} htmlFor="af-area">Area / locality</label>
          <input id="af-area" name="area" defaultValue={artist?.area} className={field} placeholder="Vaishali Nagar" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="af-exp">Experience (years) *</label>
          <input id="af-exp" name="experienceYears" type="number" min="0" max="60" required defaultValue={artist?.experienceYears ?? 1} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="af-pmin">Price from (₹)</label>
          <input id="af-pmin" name="priceMin" type="number" min="0" step="50" defaultValue={artist?.priceMin ?? 500} className={field} placeholder="500" />
        </div>
        <div>
          <label className={label} htmlFor="af-pmax">Price upto (₹)</label>
          <input id="af-pmax" name="priceMax" type="number" min="0" step="50" defaultValue={artist?.priceMax ?? 5000} className={field} placeholder="15000" />
        </div>
      </div>

      <div>
        <p className={label}>Styles aap karti ho * (jitne apply hote hain chuno)</p>
        <div className="flex flex-wrap gap-3">
          {styles.map((s) => (
            <label
              key={s.slug}
              className="flex cursor-pointer items-center gap-2 rounded-full border border-cream-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 transition has-checked:border-rani-700 has-checked:bg-rani-50 has-checked:text-rani-800"
            >
              <input
                type="checkbox"
                name="styles"
                value={s.slug}
                defaultChecked={artist?.styles.includes(s.slug)}
                className="h-4 w-4 accent-rani-700"
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className={label} htmlFor="af-bio">About / bio</label>
        <textarea
          id="af-bio"
          name="bio"
          rows={4}
          defaultValue={artist?.bio}
          className={field}
          placeholder="Apne experience, specialities aur service ke baare mein batao — customers yahi padh ke book karti hain."
        />
      </div>

      <ImageListInput
        name="profileImage"
        label="Profile photo (aapki ya aapke best design ki)"
        initial={artist?.profileImage ? [artist.profileImage] : []}
        single
      />

      <ImageListInput
        name="portfolioImages"
        label="Portfolio photos (apne best designs — 4 se 12 photos)"
        initial={artist?.portfolioImages ?? []}
        max={12}
      />

      <div className="rounded-2xl border border-marigold-200 bg-marigold-50/50 p-5">
        <p className="text-sm font-bold text-ink-900">💰 Payment details (UPI)</p>
        <p className="mt-1 text-xs text-ink-500">
          Customers isi UPI par aapko payment karengi, aur admin isi par aapka payout
          bhejega. QR code aapke UPI app (GPay/PhonePe/Paytm) se download karke upload
          karo.
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <label className={label} htmlFor="af-upi">Your UPI ID</label>
            <input
              id="af-upi"
              name="upiId"
              defaultValue={artist?.upiId}
              className={field}
              placeholder="yourname@okhdfcbank"
            />
          </div>
          <ImageListInput
            name="upiQr"
            label="Your UPI QR code (image)"
            initial={artist?.upiQr ? [artist.upiQr] : []}
            single
          />
        </div>
      </div>
    </>
  );
}
