import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getDb, trackEvent } from "@/lib/db";

const Body = z.object({
  merchantId: z.string().min(1).max(120),
  type: z.enum([
    "impression",
    "view",
    "map_click",
    "phone_click",
    "direction_request",
    "qr_redemption",
    "mini_open",
  ]),
  source: z.enum(["feed", "search", "map", "qr", "mini", "direct"]).default("direct"),
});

const COOKIE = "seen_vid";

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

/**
 * Analytics beacon. Impressions are de-duplicated per visitor per merchant per
 * day so a merchant's dashboard is not inflated by a single reflective scroll.
 */
export async function POST(req: NextRequest) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid event" }, { status: 400 });
  }
  const { merchantId, type, source } = parsed.data;

  const db = getDb();
  const merchant = db.merchants.find((m) => m.id === merchantId);
  if (!merchant || merchant.status !== "verified") {
    return NextResponse.json({ ok: false, error: "Unknown merchant" }, { status: 404 });
  }

  let visitorId = req.cookies.get(COOKIE)?.value;
  const isNewVisitor = !visitorId;
  if (!visitorId) visitorId = crypto.randomUUID();

  const sessionHash = hash(visitorId);
  const dedupeKey = `${merchantId}:${sessionHash}:${type}`;
  const today = new Date().toISOString().slice(0, 10);
  const duplicate = db.liveEvents.some(
    (event) => `${event.merchantId}:${event.sessionHash}:${event.type}` === dedupeKey && event.day === today,
  );

  if (!duplicate) {
    trackEvent({ merchantId, type, source, sessionHash });
  }

  const response = NextResponse.json({ ok: true, deduped: duplicate });
  if (isNewVisitor) {
    response.cookies.set(COOKIE, visitorId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "seen-analytics" });
}
