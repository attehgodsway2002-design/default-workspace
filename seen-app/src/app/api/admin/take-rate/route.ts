import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";
import type { MiniApp } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  miniAppId: z.string().min(1, "A mini-app is required."),
  takeRateBps: z
    .number()
    .int("Take rate must be a whole number of basis points.")
    .min(0, "Take rate cannot be negative.")
    .max(1500, "Take rate is capped at 1,500 bps (15%) without a commercial exception."),
});

/** Persists a partner take rate (basis points of GMV) into the store. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Operator access required." }, { status: 403 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid take-rate update." },
      { status: 400 },
    );
  }

  const app = getDb().miniApps.find(
    (item) => item.id === parsed.data.miniAppId || item.slug === parsed.data.miniAppId,
  );
  if (!app) {
    return NextResponse.json(
      { ok: false, error: "That mini-app is not a Seen partner." },
      { status: 404 },
    );
  }

  let updated: MiniApp | undefined;
  updateDb((db) => {
    const target = db.miniApps.find((item) => item.id === app.id);
    if (target) {
      target.takeRateBps = parsed.data.takeRateBps;
      updated = target;
    }
  });

  revalidatePath("/admin/partners");
  revalidatePath("/admin");

  return NextResponse.json({
    ok: true,
    miniApp: updated
      ? {
          id: updated.id,
          name: updated.name,
          takeRateBps: updated.takeRateBps,
          takeCedis: Math.round((updated.monthlyGmvCedis * updated.takeRateBps) / 10_000),
        }
      : null,
  });
}
