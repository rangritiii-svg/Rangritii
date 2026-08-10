import { notFound } from "next/navigation";
import { AdminArtistForm } from "@/components/admin/AdminArtistForm";
import { getArtistById, getStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [artist, styles] = await Promise.all([getArtistById(id), getStyles()]);
  if (!artist) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Edit artist</h1>
      <p className="mt-1 text-sm text-ink-500">{artist.name}</p>
      <div className="mt-6">
        <AdminArtistForm styles={styles} artist={artist} />
      </div>
    </div>
  );
}
