import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";
import { consentFor } from "@/lib/db/queries";
import { reference } from "@/lib/format";
import type { TicketOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  miniAppSlug: z.string().min(1).default("accra-live"),
  eventName: z.string().min(2, "Choose an event.").max(140),
  quantity: z.number().int().min(1, "At least one ticket.").max(10, "Ten tickets per order."),
  priceCedis: z.number().int().positive().max(5_000),
});

/** Issues a paid ticket order; Seen's 800 bps take is settled before payout. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to buy a ticket." }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid ticket request." },
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
  if (app.category !== "ticketing") {
    return NextResponse.json(
      { ok: false, error: `${app.name} does not issue tickets through this endpoint.` },
      { status: 400 },
    );
  }

  const consent = consentFor(session.userId, app.id);
  if (!consent || !consent.scopes.includes("payments")) {
    return NextResponse.json(
      { ok: false, error: "Grant the payments scope to Accra Live before checkout." },
      { status: 403 },
    );
  }

  const totalCedis = parsed.data.quantity * parsed.data.priceCedis;
  const order: TicketOrder = {
    id: `tk-${randomUUID().slice(0, 8)}`,
    miniAppId: app.id,
    userId: session.userId,
    eventName: parsed.data.eventName,
    quantity: parsed.data.quantity,
    totalCedis,
    status: "paid",
    reference: reference("AL"),
    createdAt: new Date().toISOString(),
  };

  updateDb((store) => {
    store.ticketOrders.unshift(order);
  });

  revalidatePath("/mini");
  revalidatePath(`/mini/${app.slug}`);
  revalidatePath("/admin");

  const takeCedis = Math.round((totalCedis * app.takeRateBps) / 10_000);

  return NextResponse.json({
    ok: true,
    order,
    take: {
      bps: app.takeRateBps,
      cedis: takeCedis,
      note: "Seen keeps its take and settles the balance to the promoter.",
    },
  });
}
