"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { signIn, signUp } from "@/app/(store)/account/actions";

const field =
  "w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-rani-400";

export function AuthTabs() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
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
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border border-cream-300 bg-white p-6 sm:p-8">
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
