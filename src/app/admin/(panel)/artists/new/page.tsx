import { AdminArtistForm } from "@/components/admin/AdminArtistForm";
import { getStyles } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function NewArtistPage() {
  const styles = await getStyles();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-semibold text-ink-900">Add artist</h1>
      <div className="mt-6">
        <AdminArtistForm styles={styles} />
      </div>
    </div>
  );
}
