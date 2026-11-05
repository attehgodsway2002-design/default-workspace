import { NextResponse, type NextRequest } from "next/server";
import { findUserByEmail, homeFor, safeNextPath, sessionFor, setSession } from "@/lib/auth";

/**
 * One-click demo entry, used by the seeded demo links and by automated
 * screenshots of the authenticated surfaces. Disabled by setting
 * SEEN_DEMO_LOGIN=disabled (do this in any real deployment).
 */
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  if (process.env.SEEN_DEMO_LOGIN === "disabled") {
    return NextResponse.redirect(new URL("/signin", req.url));
  }

  const url = new URL(req.url);
  const as = (url.searchParams.get("as") ?? "consumer").toLowerCase();
  const accounts: Record<string, string> = {
    consumer: "ama@example.gh",
    merchant: "kofi@kenteandkoffee.gh",
    admin: "ops@seen.gh",
  };
  const email = accounts[as] ?? accounts.consumer!;
  const user = findUserByEmail(email);
  if (!user) {
    return NextResponse.json({ ok: false, error: "Demo account missing — reseed the store." }, { status: 500 });
  }

  const session = sessionFor(user);
  await setSession(session);

  const requested = url.searchParams.get("next");
  const destination = safeNextPath(requested) ?? homeFor(session);
  return NextResponse.redirect(new URL(destination, url.origin));
}
