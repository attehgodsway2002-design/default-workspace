import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  slotId: z.string().min(1, "A slot id is required."),
});

/** Records demand: increments the waitlist count on an available slot. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Operator access required." }, { status: 403 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid waitlist request." },
      { status: 400 },
    );
  }

  const existing = getDb().slots.find((slot) => slot.id === parsed.data.slotId);
  if (!existing) {
    return NextResponse.json(
      { ok: false, error: "That slot is not in the inventory." },
      { status: 404 },
    );
  }
  if (existing.status === "sold") {
    return NextResponse.json(
      { ok: false, error: "That slot is already sold — waitlist demand is tracked on open slots." },
      { status: 409 },
    );
  }

  let waitlist = existing.waitlist;
  updateDb((db) => {
    const slot = db.slots.find((item) => item.id === parsed.data.slotId);
    if (slot) {
      slot.waitlist += 1;
      waitlist = slot.waitlist;
    }
  });

  revalidatePath("/admin/slots");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true, slotId: parsed.data.slotId, waitlist });
}
