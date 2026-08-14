"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { signIn, signUp } from "@/app/(store)/account/actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function GoogleButton({ next }: { next: string }) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loginWithGoogle() {
    setError("");
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (oauthError) {
        setError(
          oauthError.message.toLowerCase().includes("provider")
            ? "Google login isn't enabled yet — please log in with email/password."
            : oauthError.message
        );
        setLoading(false);
      }
      // on success the browser redirects to Google
    } catch {
      setError("Couldn't start Google login — try email/password instead.");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={loginWithGoogle}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-cream-300 bg-white py-3.5 text-sm font-bold text-ink-900 transition hover:border-rani-300 hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
      >
        <GoogleIcon />
        {loading ? "Opening Google…" : "Continue with Google"}
      </button>
      {error && (
        <p className="mt-3 rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
          {error}
        </p>
      )}
    </div>
  );
}

function AuthTabsInner({ next = "/account" }: { next?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState(
    searchParams.get("auth_error") ? "Google login didn't complete — please try again." : ""
  );
  const [info, setInfo] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setError("");
    setInfo("");
    startTransition(async () => {
      const result = tab === "login" ? await signIn(formData) : await signUp(formData);
      if (!result.ok) {
        setError(result.error);
      } else if (result.message) {
        setInfo(result.message);
        setTab("login");
      } else {
        router.push(next);
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
      {supabaseConfigured && (
        <>
          <GoogleButton next={next} />
          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-cream-300" />
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              or with email
            </span>
            <span className="h-px flex-1 bg-cream-300" />
          </div>
        </>
      )}

      <div className="flex rounded-full bg-cream-200 p-1">
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setError("");
            }}
            className={`flex-1 rounded-full py-2.5 text-sm font-bold capitalize transition ${
              tab === t ? "bg-rani-700 text-white" : "text-ink-700"
            }`}
          >
            {t === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={submit} className="mt-6 space-y-4">
        {tab === "register" && (
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="fullName">
              Full name
            </label>
            <input id="fullName" name="fullName" required className={field} placeholder="Priya Sharma" />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="auth-email">
            Email
          </label>
          <input id="auth-email" name="email" type="email" required className={field} placeholder="you@example.com" />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-ink-700" htmlFor="auth-password">
            Password
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            required
            minLength={tab === "register" ? 8 : undefined}
            className={field}
            placeholder={tab === "register" ? "Minimum 8 characters" : "Your password"}
          />
        </div>

        {error && (
          <p className="rounded-xl border border-rani-200 bg-rani-50 px-4 py-3 text-sm font-medium text-rani-800">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-rani-700 py-3.5 text-sm font-bold text-white transition hover:bg-rani-800 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Please wait…" : tab === "login" ? "Log in" : "Create account"}
        </button>
      </form>
    </div>
  );
}

export function AuthTabs({ next }: { next?: string }) {
  return (
    <Suspense fallback={null}>
      <AuthTabsInner next={next} />
    </Suspense>
  );
}
