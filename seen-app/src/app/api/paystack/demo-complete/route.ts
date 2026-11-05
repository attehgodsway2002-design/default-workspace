import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDb, updateDb } from "@/lib/db";
import { getDemoMerchant, getMerchantById } from "@/lib/db/queries";
import { CHANNELS, paystackLive } from "@/lib/paystack";
import { settlePayment, tierForInvoice } from "@/components/merchant/payments";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reference: z.string().trim().min(4).max(80),
  meta: z
    .object({
      merchantId: z.string().trim().max(120).optional(),
      tier: z.enum(["starter", "boost", "billboard"]).optional(),
    })
    .optional(),
  channel: z.enum(["mtn-momo", "telecel-cash", "at-money", "card"]).optional(),
});

/**
 * Demo-only approval endpoint used by Seen's simulated mobile-money screen when
 * Paystack keys are absent. It can never run against live keys, and it settles
 * the pending invoice created by /api/subscription/init — never a URL amount.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return new NextResponse(null, { status: 404 });
  }

  if (paystackLive()) {
    return NextResponse.json(
      {
        ok: false,
        error: "Simulated payments are disabled because Paystack is live on this deployment.",
      },
      { status: 400 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "A valid payment reference is required." },
      { status: 400 },
    );
  }

  const { reference, meta, channel } = parsed.data;
  if (channel && !CHANNELS.some((item) => item.id === channel)) {
    return NextResponse.json(
      { ok: false, error: "Choose a supported mobile-money or card channel." },
      { status: 400 },
    );
  }

  const invoice = getDb().invoices.find((item) => item.reference === reference);
  if (!invoice) {
    return NextResponse.json(
      { ok: false, error: "We couldn't find a payment for that reference. Start again from Billing." },
      { status: 404 },
    );
  }

  if (meta?.merchantId && meta.merchantId !== invoice.merchantId) {
    return NextResponse.json(
      { ok: false, error: "This payment reference doesn't belong to your account." },
      { status: 403 },
    );
  }

  // Only the signed-in merchant this invoice belongs to can approve the demo
  // prompt — a hand-crafted POST can't upgrade someone else's storefront.
  const session = await getSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json(
      { ok: false, error: "Sign in as the merchant paying this invoice." },
      { status: 401 },
    );
  }
  const sessionMerchantId = session.merchantId ?? getDemoMerchant()?.id;
  if (!sessionMerchantId || invoice.merchantId !== sessionMerchantId) {
    return NextResponse.json(
      { ok: false, error: "This payment reference doesn't belong to your account." },
      { status: 403 },
    );
  }

  if (invoice.status === "paid") {
    const merchant = getMerchantById(invoice.merchantId);
    return NextResponse.json({
      ok: true,
      alreadyPaid: true,
      tier: merchant?.tier ?? tierForInvoice(invoice),
      reference: invoice.reference,
    });
  }

  if (invoice.status !== "pending") {
    return NextResponse.json(
      { ok: false, error: "That invoice can't be paid. Start a new payment from Billing." },
      { status: 409 },
    );
  }

  const invoiceTier = tierForInvoice(invoice);
  if (!invoiceTier) {
    return NextResponse.json(
      { ok: false, error: "We couldn't match this invoice to a plan price. Start a new payment." },
      { status: 409 },
    );
  }
  if (meta?.tier && meta.tier !== invoiceTier) {
    return NextResponse.json(
      { ok: false, error: "The selected plan doesn't match this invoice." },
      { status: 400 },
    );
  }

  const result = settlePayment({
    reference: invoice.reference,
    tier: invoiceTier,
    channel: channel ?? invoice.channel,
    amountCedis: invoice.amountCedis,
  });

  if (!result.ok || !result.merchant || !result.invoice) {
    return NextResponse.json(
      { ok: false, error: "We couldn't complete this payment. Start again from Billing." },
      { status: 409 },
    );
  }

  // Record the channel the payer approved on the simulated screen.
  if (channel) {
    updateDb((db) => {
      const record = db.invoices.find((item) => item.id === result.invoice!.id);
      if (record) record.channel = channel;
    });
  }

  return NextResponse.json({
    ok: true,
    tier: result.tier,
    merchantId: result.merchant.id,
    reference: result.invoice.reference,
    paidAt: result.invoice.paidAt,
  });
}
