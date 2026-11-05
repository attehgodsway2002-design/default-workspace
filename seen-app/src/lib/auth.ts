import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { createSupabaseServerClient, supabaseConfigured } from "@/lib/supabase/server";
import type { Session, User } from "@/lib/types";

const COOKIE = "seen_session";
const DEV_SECRET = "seen-dev-session-secret-rotate-in-production";
const MAX_AGE = 60 * 60 * 24 * 7;

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function signature(payload: string): string {
  const secret = process.env.SEEN_SESSION_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("SEEN_SESSION_SECRET must be configured in production.");
  }
  return crypto.createHmac("sha256", secret || DEV_SECRET).update(payload).digest("base64url");
}

export function createSessionToken(session: Session): string {
  const body = b64url(JSON.stringify(session));
  return `${body}.${signature(body)}`;
}

export function readSessionToken(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = signature(body);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Session;
  } catch {
    return null;
  }
}

/** Session for the current request (server components and route handlers). */
export async function getSession(): Promise<Session | null> {
  if (supabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    let profile: { id: string; role: string } | null = null;
    try {
      const { data: row } = await supabase
        .from("users")
        .select("id, role")
        .eq("auth_id", data.user.id)
        .maybeSingle();
      profile = row;
    } catch {
      // The auth session can exist before the application profile is provisioned.
    }

    const role = ["consumer", "merchant", "admin"].includes(profile?.role ?? "")
      ? (profile!.role as Session["role"])
      : "consumer";
    let merchantId: string | undefined;
    if (role === "merchant" && profile) {
      try {
        const { data: merchant } = await supabase
          .from("merchants")
          .select("id")
          .eq("owner_id", profile.id)
          .maybeSingle();
        merchantId = merchant?.id;
      } catch {
        // Merchant profile provisioning is handled separately from authentication.
      }
    }

    const email = data.user.email ?? "";
    const name =
      (typeof data.user.user_metadata?.name === "string" && data.user.user_metadata.name) ||
      email.split("@")[0] ||
      "Seen user";
    return { userId: profile?.id ?? data.user.id, email, name, role, merchantId };
  }

  if (process.env.NODE_ENV === "production") return null;
  const jar = await cookies();
  return readSessionToken(jar.get(COOKIE)?.value);
}

export async function setSession(session: Session) {
  const secureCookie = process.env.NODE_ENV === "production";
  if (secureCookie) {
    throw new Error("Production sessions must be managed by Supabase Auth.");
  }
  const jar = await cookies();
  jar.set(COOKIE, createSessionToken(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookie,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete(COOKIE);
}

export function findUserByEmail(email: string): User | undefined {
  return getDb().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

/** Demo sign-in: resolves a seeded user, or creates a consumer profile. */
export function resolveUser(email: string): User {
  const existing = findUserByEmail(email);
  if (existing) return existing;
  const db = getDb();
  const user: User = {
    id: `u-${crypto.randomUUID().slice(0, 8)}`,
    email: email.trim().toLowerCase(),
    name: email.split("@")[0]!.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    phone: "024 000 0000",
    role: "consumer",
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  return user;
}

export function sessionFor(user: User): Session {
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    merchantId: user.merchantId,
  };
}


export function safeNextPath(value: string | null | undefined): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return null;
  }
  try {
    const url = new URL(value, "https://seen.invalid");
    return url.origin === "https://seen.invalid"
      ? `${url.pathname}${url.search}${url.hash}`
      : null;
  } catch {
    return null;
  }
}
export function demoUsers(): Pick<User, "email" | "name" | "role" | "merchantId">[] {
  return getDb().users.map(({ email, name, role, merchantId }) => ({
    email,
    name,
    role,
    merchantId,
  }));
}

export function currentUser(session: Session): User | undefined {
  return getDb().users.find((u) => u.id === session.userId);
}

/** Where each role lands after sign-in. */
export function homeFor(session: Session): string {
  if (session.role === "admin") return "/admin";
  if (session.role === "merchant") return "/merchant";
  return "/discover";
}
