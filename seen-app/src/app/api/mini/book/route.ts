import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";
import { consentFor, getMerchantById } from "@/lib/db/queries";
import { reference } from "@/lib/format";
import type { Booking } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  miniAppSlug: z.string().min(1).default("quickbook"),
  merchantId: z.string().min(1, "Choose a merchant."),
  service: z.string().min(2, "Choose a service.").max(120),
  priceCedis: z.number().int().positive().max(5_000),
  startsAt: z.string().datetime("Choose a valid appointment time."),
});

/**
 * QuickBook writes the booking; the partner collects payment on the existing
 * MoMo rail and Seen records its take at month end. Nothing is charged in-app.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to book an appointment." }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid booking request." },
      { status: 400 },
    );
  }

  const db = getDb();
  const app = db.miniApps.find(
    (item) => item.slug === parsed.data.miniAppSlug || item.id === parsed.data.miniAppSlug,
  );
  if (!app) {
    return NextResponse.json(
      { ok: false, error: "That mini-app is not a Seen partner." },
      { status: 404 },
    );
  }
  if (app.category !== "booking") {
    return NextResponse.json(
      { ok: false, error: `${app.name} does not take bookings through this endpoint.` },
      { status: 400 },
    );
  }

  const merchant = getMerchantById(parsed.data.merchantId);
  if (!merchant) {
    return NextResponse.json(
      { ok: false, error: "That merchant is no longer listed on Seen." },
      { status: 404 },
    );
  }
  if (merchant.status !== "verified") {
    return NextResponse.json(
      { ok: false, error: "That merchant is not verified yet — bookings open after verification." },
      { status: 409 },
    );
  }

  const consent = consentFor(session.userId, app.id);
  if (!consent || !consent.scopes.includes("booking")) {
    return NextResponse.json(
      { ok: false, error: "Grant the booking scope to QuickBook before booking." },
      { status: 403 },
    );
  }

  const startsAtMs = Date.parse(parsed.data.startsAt);
  if (!Number.isFinite(startsAtMs)) {
    return NextResponse.json(
      { ok: false, error: "Choose a valid appointment time." },
      { status: 400 },
    );
  }
  if (startsAtMs < Date.now() + 5 * 60_000) {
    return NextResponse.json(
      { ok: false, error: "Pick a slot at least five minutes from now." },
      { status: 400 },
    );
  }

  const booking: Booking = {
    id: `bk-${randomUUID().slice(0, 8)}`,
    miniAppId: app.id,
    userId: session.userId,
    merchantId: merchant.id,
    service: parsed.data.service,
    priceCedis: parsed.data.priceCedis,
    startsAt: new Date(startsAtMs).toISOString(),
    status: "confirmed",
    reference: reference("QB"),
    createdAt: new Date().toISOString(),
  };

  updateDb((store) => {
    store.bookings.unshift(booking);
  });

  revalidatePath("/mini");
  revalidatePath(`/mini/${app.slug}`);
  revalidatePath("/admin");

  const takeCedis = Math.round((booking.priceCedis * app.takeRateBps) / 10_000);

  return NextResponse.json({
    ok: true,
    booking,
    take: {
      bps: app.takeRateBps,
      cedis: takeCedis,
      note: "Payment is collected by the partner at the appointment; Seen bills its take monthly.",
    },
  });
}
