import "server-only";
import crypto from "node:crypto";
import type { MiniScope } from "@/lib/types";

const DEV_SECRET = "seen-mini-consent-secret-rotate-in-production";
const TTL_SECONDS = 60 * 60; // delegated tokens live for one hour

export interface MiniTokenPayload {
  sub: string; // Seen user id
  app: string; // mini-app slug
  scopes: MiniScope[];
  name: string;
  phone?: string;
  ghanapost?: string;
  iat: number;
  exp: number;
}

function sign(body: string): string {
  const secret = process.env.SEEN_MINI_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SEEN_MINI_SECRET must be configured in production.");
  }
  return crypto.createHmac("sha256", secret || DEV_SECRET).update(body).digest("base64url");
}

/**
 * Issues the delegated identity token a partner receives. This is the OAuth
 * style contract: scoped claims, short TTL, no wallet or card credentials.
 */
export function issueMiniToken(
  claims: Omit<MiniTokenPayload, "iat" | "exp">,
): { token: string; expiresAt: string } {
  const iat = Math.floor(Date.now() / 1000);
  const payload: MiniTokenPayload = { ...claims, iat, exp: iat + TTL_SECONDS };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return {
    token: `${body}.${sign(body)}`,
    expiresAt: new Date((iat + TTL_SECONDS) * 1000).toISOString(),
  };
}

export function verifyMiniToken(token: string | null | undefined): MiniTokenPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  if (expected.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as MiniTokenPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export const SCOPE_COPY: Record<MiniScope, { label: string; detail: string; required: boolean }> = {
  identity: {
    label: "Your name",
    detail: "So the partner can address you and attach bookings to your Seen profile.",
    required: true,
  },
  phone: {
    label: "Verified phone number",
    detail: "Used for appointment reminders and ticket codes. Never shared for marketing.",
    required: true,
  },
  address: {
    label: "GhanaPostGPS address",
    detail: "So a delivery or technician knows exactly where to go — GA-585-7449, not 'near Koala'.",
    required: false,
  },
  payments: {
    label: "Payment authorisation",
    detail: "One-tap mobile money charge up to GH₵500 per transaction. You approve every payment.",
    required: false,
  },
  booking: {
    label: "Booking history with this partner",
    detail: "Your appointments with this partner, so rescheduling works without a phone call.",
    required: false,
  },
};
