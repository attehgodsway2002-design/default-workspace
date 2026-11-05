import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { updateDb } from "@/lib/db";
import { billingFor, getMerchantById, getPlans } from "@/lib/db/queries";
import { reference as newReference } from "@/lib/format";
import { CHANNELS, initializeTransaction, paystackLive } from "@/lib/paystack";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  tier: z.enum(["starter", "boost", "billboard"]),
  channel: z.enum(["mtn-momo", "telecel-cash", "at-money", "card"]),
});

/**
 * Starts a subscription payment. The amount always comes from the server-side
 * price list; the client only picks a tier and a channel.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "merchant") {
    return NextResponse.json(
      { ok: false, error: "Sign in as a merchant to change your plan." },
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

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Choose a valid plan and payment channel." },
      { status: 400 },
    );
  }

  const { tier, channel } = parsed.data;
  const plan = getPlans().find((item) => item.tier === tier);
  if (!plan) {
    return NextResponse.json({ ok: false, error: "That plan doesn't exist." }, { status: 400 });
  }
  if (plan.priceCedis <= 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Starter is free — cancel your paid plan instead of checking out.",
      },
      { status: 400 },
    );
  }
  if (!CHANNELS.some((item) => item.id === channel)) {
    return NextResponse.json(
      { ok: false, error: "Choose a supported mobile-money or card channel." },
      { status: 400 },
    );
  }

  const reference = newReference("SEEN");
  const origin = req.nextUrl.origin;
  const callbackUrl = `${origin}/paystack/callback`;
  const billing = billingFor(merchant.id);
  const requestedAt = new Date().toISOString();
  const invoice: Invoice = {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    merchantId: merchant.id,
    subscriptionId: billing.subscription?.id ?? `sub-${merchant.slug}`,
    amountCedis: plan.priceCedis,
    status: "pending",
    issuedAt: requestedAt,
    reference,
    channel,
    description: `${plan.name} plan — ${new Date(requestedAt).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    })}`,
  };

  // Persist the pending invoice first: the callback and the webhook reconcile
  // against this exact reference, never against a client-supplied amount.
  updateDb((db) => {
    db.invoices.unshift(invoice);
  });

  try {
    const result = await initializeTransaction({
      email: session.email,
      amountCedis: plan.priceCedis,
      reference,
      callbackUrl,
      metadata: {
        merchantId: merchant.id,
        tier,
        channel,
        invoiceId: invoice.id,
      },
      channels: [channel],
    });

    if (result.reference !== reference) {
      updateDb((db) => {
        const record = db.invoices.find((item) => item.id === invoice.id);
        if (record) record.reference = result.reference;
      });
    }

    return NextResponse.json({
      ok: true,
      url: result.authorizationUrl,
      reference: result.reference,
      demo: result.demo,
      live: paystackLive(),
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message.includes("Paystack")
        ? "Paystack didn't accept the payment. Try again in a moment."
        : "We couldn't start the payment. Check your connection and try again.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
