import { getDb, setMerchantTier, updateDb } from "@/lib/db";
import { getPlan, getPlans } from "@/lib/db/queries";
import type { Invoice, Merchant, Tier } from "@/lib/types";

/**
 * Billing reconciliation shared by the Paystack callback page, the demo
 * approval endpoint and the signed webhook. One payment reference settles one
 * invoice exactly once, and the amount is always re-derived from the price list
 * rather than trusted from the request.
 */

export function tierForInvoice(invoice: Invoice): Tier | null {
  if (invoice.amountCedis <= 0) return null;
  const plan = getPlans().find(
    (p) => p.tier !== "starter" && p.priceCedis === invoice.amountCedis,
  );
  return plan?.tier ?? null;
}

export interface SettleInput {
  reference: string;
  tier?: Tier | null;
  channel?: string;
  paidAt?: string;
  amountCedis?: number;
}

export interface SettleResult {
  ok: boolean;
  reason?: string;
  merchant?: Merchant;
  invoice?: Invoice;
  tier?: Tier;
}

export function settlePayment(input: SettleInput): SettleResult {
  const db = getDb();
  const invoice = db.invoices.find((i) => i.reference === input.reference);
  if (!invoice) return { ok: false, reason: "unknown-reference" };
  if (invoice.status === "failed") return { ok: false, reason: "invoice-failed" };

  const merchant = db.merchants.find((m) => m.id === invoice.merchantId);
  if (!merchant) return { ok: false, reason: "unknown-merchant" };

  const tier = input.tier ?? tierForInvoice(invoice);
  if (!tier || tier === "starter") return { ok: false, reason: "unknown-plan" };

  const plan = getPlan(tier);
  if (!plan) return { ok: false, reason: "unknown-plan" };
  if (invoice.amountCedis !== plan.priceCedis) return { ok: false, reason: "amount-mismatch" };
  if (typeof input.amountCedis === "number" && Math.round(input.amountCedis) !== plan.priceCedis) {
    return { ok: false, reason: "amount-mismatch" };
  }

  const channel = input.channel ?? invoice.channel;
  const paidAt = input.paidAt ?? new Date().toISOString();
  const alreadySettled = invoice.status === "paid" && merchant.tier === tier;

  if (!alreadySettled) {
    setMerchantTier(merchant.id, tier, { channel, reference: invoice.reference });
  }

  // setMerchantTier writes a fresh paid receipt row for the reference. The init
  // endpoint already created the invoice this payment belongs to, so keep that
  // single row and drop the generated duplicate.
  const store = updateDb((next) => {
    const target = next.invoices.find((i) => i.id === invoice.id);
    next.invoices = next.invoices.filter(
      (i) => i.reference !== invoice.reference || i.id === invoice.id,
    );
    if (target) {
      target.status = "paid";
      target.paidAt = target.paidAt ?? paidAt;
      if (channel) target.channel = channel;
    }
  });

  const settledInvoice = store.invoices.find((i) => i.id === invoice.id);
  const settledMerchant = store.merchants.find((m) => m.id === merchant.id);
  if (!settledInvoice || !settledMerchant) return { ok: false, reason: "settle-failed" };

  return { ok: true, merchant: settledMerchant, invoice: settledInvoice, tier };
}
