import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { verifyMerchant } from "@/lib/db";
import { getMerchantById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  merchantId: z.string().min(1, "A merchant id is required."),
  approve: z.boolean(),
});

/** Approve or reject a storefront from the ops verification queue. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Operator access required." }, { status: 403 });
  }

  const body: unknown = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid verification request." },
      { status: 400 },
    );
  }

  const merchant = getMerchantById(parsed.data.merchantId);
  if (!merchant) {
    return NextResponse.json(
      { ok: false, error: "That merchant is not in the store." },
      { status: 404 },
    );
  }

  const updated = verifyMerchant(merchant.id, parsed.data.approve);
  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "Verification could not be recorded." },
      { status: 500 },
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/merchants");
  revalidatePath(`/admin/merchants/${merchant.id}`);
  revalidatePath("/discover");
  revalidatePath("/business/" + merchant.slug);

  return NextResponse.json({
    ok: true,
    merchant: { id: updated.id, name: updated.name, status: updated.status },
  });
}
