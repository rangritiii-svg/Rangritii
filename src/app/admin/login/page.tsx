"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { adminLogin } from "./actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isDemo = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  function submit(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await adminLogin(formData);
      if (result.ok) {
        router.push(searchParams.get("next") || "/admin");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center">
        <span className="inline-flex rounded-2xl bg-rani-700 p-4 text-white">
          <ShieldCheck className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-900">
          Admin Login
        </h1>
        <p className="mt-1.5 text-sm text-ink-500">Rangritii store management</p>
      </div>

      <form
        action={submit}
        className="mt-8 space-y-4 rounded-3xl border border-cream-300 bg-white p-6 sm:p-8"
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="email">
            Email
          </label>
          <input id="email" name="email" type="email" required className={field} placeholder="admin@rangritii.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="password">
            Password
          </label>
          <input id="password" name="password" type="password" required className={field} placeholder="••••••••" />
        </div>

        {error && (
          <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rani-700 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>

        {isDemo && (
          <p className="rounded-xl bg-cream-100 px-4 py-3 text-xs leading-relaxed text-ink-500">
            <strong>Demo mode:</strong> use <code className="font-bold">admin@rangritii.com</code>{" "}
            / <code className="font-bold">rangritii123</code> (configurable via
            DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD env vars).
          </p>
        )}
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        <Link href="/" className="font-semibold text-rani-700 hover:underline">
          ← Back to store
        </Link>
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream-100 px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
