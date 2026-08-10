import { AnnouncementBar } from "@/components/AnnouncementBar";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { WhatsAppFloat } from "@/components/WhatsAppFloat";
import { getCategories } from "@/lib/data";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementBar />
      <Header categories={categories.map((c) => ({ name: c.name, slug: c.slug }))} />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
}
