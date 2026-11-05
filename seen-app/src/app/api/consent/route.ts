import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";
import { SCOPE_COPY } from "@/lib/mini-auth";
import type { MiniApp, MiniAppConsent, MiniScope } from "@/lib/types";

export const dynamic = "force-dynamic";

const scopeValues = ["identity", "phone", "address", "payments", "booking"] as const;

const consentSchema = z.object({
  miniAppId: z.string().min(1, "A mini-app is required."),
  scopes: z.array(z.enum(scopeValues)).min(1, "Choose at least one scope."),
});

const revokeSchema = z.object({
  action: z.literal("revoke"),
  miniAppId: z.string().min(1, "A mini-app is required."),
});

function findApp(ref: string): MiniApp | undefined {
  return getDb().miniApps.find((app) => app.id === ref || app.slug === ref);
}

function revokeFor(userId: string, ref: string) {
  const now = new Date().toISOString();
  const app = findApp(ref);
  const appId = app?.id ?? ref;
  let revoked = 0;

  updateDb((db) => {
    for (const consent of db.consents) {
      if (consent.userId === userId && consent.miniAppId === appId && !consent.revokedAt) {
        consent.revokedAt = now;
        revoked += 1;
      }
    }
  });

  revalidatePath("/mini");
  if (app) revalidatePath(`/mini/${app.slug}`);

  return NextResponse.json({ ok: true, revoked });
}

/** Grant (or upsert) scoped consent for a mini-app. Required scopes are always on. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to grant consent." }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);

  const revokeParsed = revokeSchema.safeParse(body);
  if (revokeParsed.success) {
    return revokeFor(session.userId, revokeParsed.data.miniAppId);
  }

  const parsed = consentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid consent request." },
      { status: 400 },
    );
  }

  const app = findApp(parsed.data.miniAppId);
  if (!app) {
    return NextResponse.json(
      { ok: false, error: "That mini-app is not a Seen partner." },
      { status: 404 },
    );
  }

  const unsupported = parsed.data.scopes.filter((scope) => !app.scopes.includes(scope));
  if (unsupported.length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `${app.name} does not request ${unsupported
          .map((scope) => SCOPE_COPY[scope].label)
          .join(", ")}.`,
      },
      { status: 400 },
    );
  }

  // Optional scopes follow the client; required scopes are always granted.
  const scopes: MiniScope[] = app.scopes.filter(
    (scope) => parsed.data.scopes.includes(scope) || SCOPE_COPY[scope].required,
  );
  const now = new Date().toISOString();
  let consent: MiniAppConsent | undefined;

  updateDb((db) => {
    const existing = db.consents.find(
      (item) =>
        item.userId === session.userId && item.miniAppId === app.id && !item.revokedAt,
    );
    if (existing) {
      existing.scopes = scopes;
      existing.grantedAt = now;
      consent = existing;
      return;
    }
    const created: MiniAppConsent = {
      id: `consent-${session.userId}-${app.id}-${Date.now()}`,
      userId: session.userId,
      miniAppId: app.id,
      scopes,
      grantedAt: now,
    };
    db.consents.push(created);
    consent = created;
  });

  if (!consent) {
    return NextResponse.json(
      { ok: false, error: "Consent could not be saved." },
      { status: 500 },
    );
  }

  revalidatePath("/mini");
  revalidatePath(`/mini/${app.slug}`);

  return NextResponse.json({ ok: true, consent });
}

/** Revoke consent for a mini-app (`?miniAppId=` or a JSON body). */
export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to revoke consent." }, { status: 401 });
  }

  let ref =
    req.nextUrl.searchParams.get("miniAppId") ??
    req.nextUrl.searchParams.get("miniAppSlug") ??
    "";

  if (!ref) {
    const body: unknown = await req.json().catch(() => null);
    if (body && typeof body === "object" && "miniAppId" in body) {
      const candidate = (body as { miniAppId?: unknown }).miniAppId;
      if (typeof candidate === "string") ref = candidate;
    }
  }

  if (!ref) {
    return NextResponse.json(
      { ok: false, error: "Which mini-app should be revoked?" },
      { status: 400 },
    );
  }

  return revokeFor(session.userId, ref);
}
