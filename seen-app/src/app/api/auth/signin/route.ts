import { NextResponse, type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { clearSession, homeFor, resolveUser, safeNextPath, sessionFor, setSession } from "@/lib/auth";

/** Demo sign-in. Production swaps this for a phone OTP or Supabase magic link. */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { ok: false, error: "Production sign-in is not configured." },
      { status: 503 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  let email = "";
  let next = "";

  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => ({}))) as { email?: string; next?: string };
    email = body.email ?? "";
    next = body.next ?? "";
  } else {
    const form = await req.formData();
    email = String(form.get("email") ?? "");
    next = String(form.get("next") ?? "");
  }

  if (!email || !email.includes("@")) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  const user = resolveUser(email);
  const session = sessionFor(user);
  await setSession(session);

  const destination = safeNextPath(next) ?? homeFor(session);
  if (contentType.includes("application/json")) {
    return NextResponse.json({ ok: true, redirect: destination, role: session.role });
  }
  return redirect(destination);
}

export async function DELETE() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
