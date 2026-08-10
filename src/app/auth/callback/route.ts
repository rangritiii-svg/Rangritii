import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** OAuth (Google) callback: exchanges the code for a session, then redirects. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/account";
  // only allow same-site relative paths
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/account";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }
  return NextResponse.redirect(new URL("/account?auth_error=1", url.origin));
}
