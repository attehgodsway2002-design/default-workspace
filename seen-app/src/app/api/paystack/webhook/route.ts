import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getPlan } from "@/lib/db/queries";
import { verifyWebhookSignature } from "@/lib/paystack";
import { settlePayment } from "@/components/merchant/payments";
import type { Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PaystackEvent {
  event?: string;
  data?: {
    reference?: string;
    amount?: number;
    channel?: string;
    paid_at?: string;
    metadata?: { merchantId?: string; tier?: string; channel?: string } | string;
  };
}

/**
 * Paystack webhook. The raw body is signed with HMAC-SHA512 (x-paystack-signature);
 * unsigned or tampered events are rejected before anything is read, and a 200 is
 * returned quickly for valid events so Paystack doesn't retry.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ ok: true, received: true, reconciled: false });
  }

  if (event.event !== "charge.success") {
    return NextResponse.json({ ok: true, received: true, reconciled: false });
  }

  const data = event.data ?? {};
  const rawMetadata = data.metadata;
  const metadata =
    typeof rawMetadata === "string"
      ? (() => {
          try {
            return JSON.parse(rawMetadata) as { merchantId?: string; tier?: string; channel?: string };
          } catch {
            return {};
          }
        })()
      : (rawMetadata ?? {});

  const reference = data.reference ?? "";
  const merchantId = typeof metadata.merchantId === "string" ? metadata.merchantId : "";
  const metadataTier =
    typeof metadata.tier === "string" && ["boost", "billboard"].includes(metadata.tier)
      ? (metadata.tier as Tier)
      : null;

  if (!reference) {
    return NextResponse.json({ ok: true, received: true, reconciled: false });
  }

  const merchant = merchantId ? getDb().merchants.find((item) => item.id === merchantId) : undefined;
  const metadataPlan = metadataTier ? getPlan(metadataTier) : undefined;

  // Cross-check the charged amount against the server-side price list in
  // pesewas. A mismatched charge must never silently upgrade a merchant.
  if (
    merchant &&
    metadataPlan &&
    typeof data.amount === "number" &&
    data.amount === metadataPlan.priceCedis * 100
  ) {
    const channel =
      typeof metadata.channel === "string"
        ? metadata.channel
        : typeof data.channel === "string"
          ? data.channel
          : undefined;
    const result = settlePayment({
      reference,
      tier: metadataTier,
      channel,
      amountCedis: data.amount / 100,
      paidAt: data.paid_at,
    });
    return NextResponse.json({
      ok: true,
      received: true,
      reconciled: result.ok,
    });
  }

  // The charge succeeded but couldn't be matched to our invoice/price records.
  // Return 200 so Paystack stops retrying; the pending invoice stays visible in
  // Billing for manual reconciliation against this reference.
  return NextResponse.json({ ok: true, received: true, reconciled: false });
}
