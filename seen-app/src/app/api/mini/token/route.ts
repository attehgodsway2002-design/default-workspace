import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { consentFor } from "@/lib/db/queries";
import { issueMiniToken } from "@/lib/mini-auth";

export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    miniAppSlug: z.string().min(1).optional(),
    miniAppId: z.string().min(1).optional(),
  })
  .refine((value) => Boolean(value.miniAppSlug ?? value.miniAppId), {
    message: "A mini-app is required.",
  });

/**
 * Delegated identity handshake. Issues a one-hour HMAC token carrying only the
 * scopes the user granted — never wallet, PIN or card data.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to connect an app." }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid token request." },
      { status: 400 },
    );
  }

  const ref = parsed.data.miniAppSlug ?? parsed.data.miniAppId!;
  const app = getDb().miniApps.find((item) => item.slug === ref || item.id === ref);
  if (!app) {
    return NextResponse.json(
      { ok: false, error: "That mini-app is not a Seen partner." },
      { status: 404 },
    );
  }

  const user = getDb().users.find((item) => item.id === session.userId);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Your Seen session has expired — sign in again." },
      { status: 401 },
    );
  }

  const consent = consentFor(user.id, app.id);
  if (!consent) {
    return NextResponse.json(
      { ok: false, error: `Grant consent to ${app.name} before requesting an identity token.` },
      { status: 403 },
    );
  }

  const scopes = consent.scopes;
  const { token, expiresAt } = issueMiniToken({
    sub: user.id,
    app: app.slug,
    scopes,
    name: user.name,
    phone: scopes.includes("phone") ? user.phone : undefined,
    ghanapost: scopes.includes("address") ? user.ghanapost : undefined,
  });

  return NextResponse.json({
    ok: true,
    token,
    expiresAt,
    app: app.slug,
    scopes,
  });
}
