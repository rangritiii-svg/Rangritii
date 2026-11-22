import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { getStyles } from "@/lib/data";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const styles = await getStyles();

  return (
    <div className="pb-safe flex min-h-screen flex-col">
      <Header styles={styles.map((s) => ({ name: s.name, slug: s.slug }))} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
      <BottomNav />
    </div>
  );
}
