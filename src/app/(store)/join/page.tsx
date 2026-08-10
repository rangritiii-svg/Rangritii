import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Database, IndianRupee, Megaphone, Users } from "lucide-react";
import { AuthTabs } from "@/components/AuthTabs";
import { JoinForm } from "@/components/JoinForm";
import { isSupabaseConfigured } from "@/lib/config";
import { getArtistByUserId, getStyles } from "@/lib/data";

export const metadata: Metadata = { title: "Join as Artist" };
export const dynamic = "force-dynamic";

const PERKS = [
  { icon: Users, title: "Naye customers", text: "Aapke sheher ki brides & families seedha aap tak." },
  { icon: IndianRupee, title: "Zero commission", text: "Booking free, payment 100% aapka — koi cut nahi." },
  { icon: Megaphone, title: "Free portfolio page", text: "Apne designs ka professional online portfolio." },
  { icon: BadgeCheck, title: "Verified badge", text: "Approval ke baad trust badge — zyada bookings." },
];

export default async function JoinPage() {
  const styles = await getStyles();

  let content: React.ReactNode;

  if (!isSupabaseConfigured()) {
    content = (
      <div className="rounded-3xl border border-cream-300 bg-white p-8 text-center">
        <Database className="mx-auto h-12 w-12 text-ink-300" />
        <h2 className="mt-4 font-display text-2xl font-semibold text-ink-900">
          Demo mode chal raha hai
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Artist registration ke liye database (Supabase) connect hona zaroori hai.
          Demo mein admin panel se artists add karke dekh sakte ho.
        </p>
        <Link
          href="/admin/login"
          className="mt-5 inline-block rounded-full bg-rani-700 px-6 py-3 text-sm font-bold text-white hover:bg-rani-800"
        >
          Admin Panel Demo
        </Link>
      </div>
    );
  } else {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      content = (
        <div>
          <p className="mb-5 rounded-2xl border border-marigold-200 bg-marigold-50 px-5 py-4 text-sm text-marigold-800">
            <strong>Step 1:</strong> Google se ya email se account banao/login karo —
            phir artist profile ka form khulega.
          </p>
          <AuthTabs next="/join" />
        </div>
      );
    } else {
      const existing = await getArtistByUserId(user.id);
      if (existing) redirect("/account");
      content = (
        <div className="rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
          <p className="mb-5 rounded-2xl border border-marigold-200 bg-marigold-50 px-5 py-4 text-sm text-marigold-800">
            <strong>Step 2:</strong> Apni artist profile bharo. Approval 24–48 hours mein
            ho jata hai.
          </p>
          <JoinForm styles={styles} />
        </div>
      );
    }
  }

  return (
    <div>
      <section className="texture-dots bg-cream-100 py-14 text-center">
        <div className="mx-auto max-w-3xl px-4">
          <p className="text-xs font-bold uppercase tracking-widest text-marigold-600">
            For mehandi artists
          </p>
          <h1 className="mt-3 font-display text-4xl font-semibold text-ink-900 sm:text-5xl">
            Apna hunar, aapki pehchaan
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-ink-500">
            Rangritii par free profile banao, apne best designs dikhao, aur apne sheher
            se seedhi bookings pao — bina kisi commission ke.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 sm:px-6">
        {PERKS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-3xl border border-cream-300 bg-white p-6">
            <span className="inline-flex rounded-2xl bg-rani-50 p-3 text-rani-700">
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-3 font-display text-lg font-semibold text-ink-900">{title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{text}</p>
          </div>
        ))}
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6">{content}</section>
    </div>
  );
}
