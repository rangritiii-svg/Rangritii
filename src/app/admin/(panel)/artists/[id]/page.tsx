import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { ApprovalToggle } from "@/components/admin/ApprovalToggle";
import { getArtistById, getStyles } from "@/lib/data";
import { formatDate, formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

/** Read-only review of an artist profile, so it can be checked before approval
 *  (the public page 404s until the profile is approved). */
export default async function AdminArtistReview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [artist, styles] = await Promise.all([getArtistById(id), getStyles()]);
  if (!artist) notFound();
  const styleNames = artist.styles.map((s) => styles.find((x) => x.slug === s)?.name ?? s);

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4 border-b border-cream-200 py-2.5 last:border-0">
      <dt className="text-ink-500">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value || "—"}</dd>
    </div>
  );

  return (
    <div>
      <Link href="/admin/artists" className="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-rani-700">
        <ArrowLeft className="h-4 w-4" /> All artists
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={artist.profileImage || "/art/artist-1-profile.jpg"} alt="" className="h-20 w-20 rounded-2xl object-cover object-top" />
          <div>
            <h1 className="font-display text-3xl text-ink-900">{artist.name}</h1>
            <p className="text-sm text-ink-500">
              {artist.area ? `${artist.area}, ` : ""}
              {artist.city} — joined {formatDate(artist.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApprovalToggle artistId={artist.id} isApproved={artist.isApproved} />
          <Link href={`/admin/artists/${artist.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full border border-cream-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:border-rani-300">
            <Pencil className="h-4 w-4" /> Edit
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <dl className="rounded-3xl border border-cream-300 bg-white p-5 text-sm">
          {row("Status", artist.isApproved ? "Live" : "Waiting for approval")}
          {row("WhatsApp", artist.whatsapp)}
          {row("Experience", `${artist.experienceYears} years`)}
          {row("Styles", styleNames.join(", "))}
          {row("Payout UPI", artist.upiId)}
          {row("Login linked", artist.userId ? "Yes" : "No (added by admin)")}
        </dl>
        <div className="rounded-3xl border border-cream-300 bg-white p-5 text-sm">
          <p className="font-semibold text-ink-900">Packages</p>
          {artist.packages.length ? (
            <ul className="mt-2">
              {artist.packages.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-cream-200 py-2 last:border-0">
                  <span>{p.name}</span>
                  <span className="font-medium">{formatINR(p.price)} {p.unit === "per_person" ? "/ person" : "/ event"}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-ink-500">No packages yet — customers will see a price range only.</p>
          )}
          {artist.upiQr && (
            <>
              <p className="mt-4 font-semibold text-ink-900">Payout QR</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={artist.upiQr} alt="Artist UPI QR" className="mt-2 h-32 w-32 rounded-xl object-contain" />
            </>
          )}
        </div>
      </div>

      {artist.bio && <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-ink-700">{artist.bio}</p>}

      <h2 className="mt-8 font-display text-xl text-ink-900">Portfolio ({artist.portfolioImages.length})</h2>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {artist.portfolioImages.map((src, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img key={src + i} src={src} alt={`Design ${i + 1}`} className="aspect-square w-full rounded-2xl object-cover" />
        ))}
      </div>
    </div>
  );
}
