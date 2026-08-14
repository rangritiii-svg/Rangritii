import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { deleteArtistAction } from "@/app/admin/actions";
import { ApprovalToggle } from "@/components/admin/ApprovalToggle";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { getArtists } from "@/lib/data";
import { priceRange } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminArtistsPage() {
  const artists = await getArtists({ includeUnapproved: true });
  const sorted = [...artists].sort(
    (a, b) => Number(a.isApproved) - Number(b.isApproved)
  );
  const pendingCount = artists.filter((a) => !a.isApproved).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          Artists <span className="text-lg text-ink-500">({artists.length})</span>
        </h1>
        <Link
          href="/admin/artists/new"
          className="inline-flex items-center gap-2 rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800"
        >
          <Plus className="h-4 w-4" /> Add artist
        </Link>
      </div>

      {pendingCount > 0 && (
        <p className="mt-4 rounded-2xl border border-marigold-200 bg-marigold-50 px-5 py-3.5 text-sm font-medium text-marigold-800">
          ⏳ {pendingCount} artist{pendingCount > 1 ? "s" : ""} approval ka wait kar rahi
          hain — list mein sabse upar hain.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-3xl border border-cream-300 bg-white">
        <table className="w-full min-w-175 text-left text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
              <th className="px-5 py-3.5">Artist</th>
              <th className="px-5 py-3.5">City</th>
              <th className="px-5 py-3.5">Experience</th>
              <th className="px-5 py-3.5">Price range</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a) => (
              <tr key={a.id} className="border-b border-cream-100 last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.profileImage || "/art/artist-1-profile.jpg"}
                      alt=""
                      className="h-14 w-11 rounded-lg object-cover object-top"
                    />
                    <div>
                      <p className="font-semibold text-ink-900">{a.name}</p>
                      <p className="text-xs text-ink-500">/{a.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-ink-700">{a.city}</td>
                <td className="px-5 py-3 text-ink-700">{a.experienceYears} yrs</td>
                <td className="px-5 py-3 text-ink-700">{priceRange(a.priceMin, a.priceMax)}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                      a.isApproved
                        ? "bg-green-100 text-green-800"
                        : "bg-marigold-100 text-marigold-800"
                    }`}
                  >
                    {a.isApproved ? "Live" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="inline-flex items-center gap-1.5">
                    <ApprovalToggle artistId={a.id} isApproved={a.isApproved} />
                    <Link
                      href={`/admin/artists/${a.id}/edit`}
                      className="rounded-lg p-2 text-ink-500 transition hover:bg-cream-200 hover:text-rani-700"
                      aria-label={`Edit ${a.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <DeleteButton label={a.name} onDelete={deleteArtistAction.bind(null, a.id)} />
                  </div>
                </td>
              </tr>
            ))}
            {artists.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-ink-500">
                  No artists yet — add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
