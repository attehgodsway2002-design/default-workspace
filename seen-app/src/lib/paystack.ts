import "server-only";
import crypto from "node:crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}

export function paystackPublicKey(): string | null {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() || null;
}

/** True when real keys are configured; otherwise checkout runs in demo mode. */
export function paystackLive(): boolean {
  return Boolean(paystackSecret());
}

export type PaystackChannel = "mtn-momo" | "telecel-cash" | "at-money" | "card";

export interface InitResult {
  reference: string;
  authorizationUrl: string;
  demo: boolean;
  accessCode?: string;
}

interface InitializePayload {
  email: string;
  amountCedis: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
  channels?: PaystackChannel[];
}

/**
 * Initialise a Paystack transaction (mobile money or card).
 * Amounts are converted to pesewas — Paystack Ghana charges 1.95% flat with
 * settlement T+1; the fee is absorbed as a merchant cost, not passed on.
 */
export async function initializeTransaction(payload: InitializePayload): Promise<InitResult> {
  const secret = paystackSecret();
  const params = new URLSearchParams();
  params.set("callback_url", payload.callbackUrl);
  params.set("metadata", JSON.stringify(payload.metadata));

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PAYSTACK_SECRET_KEY must be configured in production.");
    }
    // Demo mode: route to Seen's own simulated MoMo approval screen.
    const url = new URL(payload.callbackUrl);
    const checkout = new URL("/paystack/checkout", url.origin);
    checkout.searchParams.set("reference", payload.reference);
    checkout.searchParams.set("email", payload.email);
    checkout.searchParams.set("amount", String(payload.amountCedis));
    checkout.searchParams.set("meta", JSON.stringify(payload.metadata));
    return { reference: payload.reference, authorizationUrl: checkout.toString(), demo: true };
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.email,
      amount: Math.round(payload.amountCedis * 100), // pesewas
      currency: "GHS",
      reference: payload.reference,
      callback_url: payload.callbackUrl,
      metadata: payload.metadata,
      channels: ["mobile_money", "card"],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Paystack initialise failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = (await res.json()) as {
    status: boolean;
    data?: { authorization_url: string; access_code: string; reference: string };
    message?: string;
  };
  if (!json.status || !json.data) {
    throw new Error(json.message ?? "Paystack rejected the transaction");
  }
  return {
    reference: json.data.reference,
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code,
    demo: false,
  };
}

export interface VerifiedTransaction {
  status: "success" | "failed" | "abandoned" | "pending";
  amountCedis: number;
  reference: string;
  channel?: string;
  paidAt?: string;
  customerEmail?: string;
  metadata?: Record<string, unknown>;
}

export async function verifyTransaction(reference: string): Promise<VerifiedTransaction | null> {
  const secret = paystackSecret();
  if (!secret) return null;
  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status: boolean;
    data?: {
      status: string;
      amount: number;
      reference: string;
      channel?: string;
      paid_at?: string;
      customer?: { email?: string };
      metadata?: Record<string, unknown>;
    };
  };
  if (!json.status || !json.data) return null;
  return {
    status: json.data.status as VerifiedTransaction["status"],
    amountCedis: json.data.amount / 100,
    reference: json.data.reference,
    channel: json.data.channel,
    paidAt: json.data.paid_at,
    customerEmail: json.data.customer?.email,
    metadata: json.data.metadata,
  };
}

/**
 * Paystack signs webhooks with HMAC-SHA512 of the raw request body using the
 * secret key. Never trust an unsigned webhook.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = paystackSecret();
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function paystackFeeCedis(amount: number): number {
  return Math.round(amount * 0.0195 * 100) / 100;
}

/** Human labels used across checkout, billing and invoices. */
export const CHANNELS: { id: PaystackChannel; label: string; note: string }[] = [
  { id: "mtn-momo", label: "MTN MoMo", note: "Most used in Accra" },
  { id: "telecel-cash", label: "Telecel Cash", note: "Formerly Vodafone Cash" },
  { id: "at-money", label: "AT Money", note: "AirtelTigo" },
  { id: "card", label: "Visa / Mastercard", note: "1.95% flat, settled T+1" },
];
