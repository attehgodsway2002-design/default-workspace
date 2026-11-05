import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.redirect(new URL("/signin?error=auth_not_configured", url.origin));
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/signin?error=missing_code", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/signin?error=verification_failed", url.origin));
  }

  const nextPath = safeNextPath(url.searchParams.get("next")) ?? "/discover";
  const destination =
    process.env.NODE_ENV === "production" && nextPath !== "/onboarding"
      ? "/auth/complete"
      : nextPath;
  return NextResponse.redirect(new URL(destination, url.origin));
}
