"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { adminLogout } from "@/app/admin/login/actions";

export function AdminLogoutButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await adminLogout();
          router.push("/admin/login");
          router.refresh();
        })
      }
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-full bg-rani-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-rani-800 disabled:opacity-60"
    >
      <LogOut className="h-3.5 w-3.5" /> Logout
    </button>
  );
}
