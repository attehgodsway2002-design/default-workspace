import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb, setMerchantTier, updateDb } from "@/lib/db";
import { getMerchantById } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

/**
 * Cancels a paid subscription immediately: the merchant drops to Starter, any
 * open subscription is marked cancelled and the slot is released. Paid invoices
 * stay on record for receipts and reconciliation.
 */
export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json(
      { ok: false, error: "Sign in as a merchant to cancel your subscription." },
      { status: 401 },
    );
  }

  const merchant = session.merchantId ? getMerchantById(session.merchantId) : undefined;
  if (!merchant) {
    return NextResponse.json(
      { ok: false, error: "We couldn't find your merchant account." },
      { status: 404 },
    );
  }

  if (merchant.tier === "starter") {
    return NextResponse.json({
      ok: true,
      alreadyCancelled: true,
      message: "You're already on Starter — nothing to cancel.",
    });
  }

  const previousSlotId = merchant.slotId;
  setMerchantTier(merchant.id, "starter");

  updateDb((db) => {
    // Release the paid slot so another merchant in the corridor can buy it.
    if (previousSlotId) {
      const slot = db.slots.find((item) => item.id === previousSlotId);
      if (slot && slot.merchantId === merchant.id) {
        slot.status = "available";
        slot.merchantId = undefined;
      }
    }
    for (const subscription of db.subscriptions) {
      if (subscription.merchantId === merchant.id && subscription.status !== "cancelled") {
        subscription.status = "cancelled";
      }
    }
  });

  const updated = getDb().merchants.find((item) => item.id === merchant.id);
  return NextResponse.json({
    ok: true,
    tier: updated?.tier ?? "starter",
    message: "Subscription cancelled. Your listing is now on Starter.",
  });
}
