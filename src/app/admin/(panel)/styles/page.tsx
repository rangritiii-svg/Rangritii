import { deleteStyleAction } from "@/app/admin/actions";
import { DeleteButton } from "@/components/admin/DeleteButton";
import { StyleForm } from "@/components/admin/StyleForm";
import { getArtists, getStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminStylesPage() {
  const [styles, artists] = await Promise.all([
    getStyles(),
    getArtists({ includeUnapproved: true }),
  ]);
  const countFor = (slug: string) =>
    artists.filter((a) => a.styles.includes(slug)).length;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink-900">Styles</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="overflow-x-auto rounded-3xl border border-cream-300 bg-white">
          <table className="w-full min-w-120 text-left text-sm">
            <thead>
              <tr className="border-b border-cream-200 text-xs uppercase tracking-wider text-ink-500">
                <th className="px-5 py-3.5">Style</th>
                <th className="px-5 py-3.5">Slug</th>
                <th className="px-5 py-3.5 text-right">Artists</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {styles.map((s) => (
                <tr key={s.id} className="border-b border-cream-100 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {s.image && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={s.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      )}
                      <span className="font-semibold text-ink-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-500">/{s.slug}</td>
                  <td className="px-5 py-3 text-right text-ink-700">{countFor(s.slug)}</td>
                  <td className="px-5 py-3 text-right">
                    {countFor(s.slug) === 0 ? (
                      <DeleteButton
                        label={s.name}
                        onDelete={deleteStyleAction.bind(null, s.id)}
                      />
                    ) : (
                      <span className="text-xs text-ink-300">in use</span>
                    )}
                  </td>
                </tr>
              ))}
              {styles.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-ink-500">
                    No styles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <StyleForm />
      </div>
    </div>
  );
}
