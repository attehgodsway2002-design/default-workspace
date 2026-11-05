import "server-only";
import fs from "node:fs";
import path from "node:path";
import { buildSeed, type DailyMetric, type SeenDb } from "./seed";
import type { AnalyticsEvent, EventType, Merchant, Tier } from "@/lib/types";
import { today } from "@/lib/format";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "seen.json");
const ANALYTICS_FILE = path.join(DATA_DIR, "analytics.json");
const SCHEMA_VERSION = 3;

type Cache = { db?: SeenDb; analytics?: DailyMetric[] };
const globalCache = globalThis as unknown as { __seenStore?: Cache };
const cache: Cache = (globalCache.__seenStore ??= {});

function ensureDir() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    /* read-only filesystem — run fully in memory */
  }
}

function persist() {
  ensureDir();
  try {
    if (cache.db) fs.writeFileSync(DB_FILE, JSON.stringify(cache.db), "utf8");
    if (cache.analytics) fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(cache.analytics), "utf8");
  } catch {
    /* non-fatal: the in-memory copy remains authoritative for this process */
  }
}

/** Load (or build) the entity store. */
export function getDb(): SeenDb {
  if (process.env.NODE_ENV === "production") {
    throw new Error("The local JSON store is demo-only. Configure a production database adapter before launch.");
  }

  if (cache.db) return cache.db;

  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as SeenDb;
    if (parsed.version === SCHEMA_VERSION && parsed.merchants?.length) {
      cache.db = parsed;
      return parsed;
    }
  } catch {
    /* fall through to a fresh seed */
  }

  const seed = buildSeed();
  cache.db = seed.db;
  cache.analytics = seed.analytics;
  persist();
  return seed.db as SeenDb;
}

/** Daily aggregates (90 days × every storefront). */
export function getAnalytics(): DailyMetric[] {
  if (cache.analytics) return cache.analytics;
  getDb();
  if (cache.analytics) return cache.analytics;
  try {
    const parsed = JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8")) as DailyMetric[];
    cache.analytics = parsed;
    return parsed;
  } catch {
    const seed = buildSeed();
    cache.analytics = seed.analytics;
    persist();
    return seed.analytics;
  }
}

export function saveDb(db: SeenDb) {
  cache.db = db;
  persist();
}

export function updateDb(mutator: (db: SeenDb) => void): SeenDb {
  const db = getDb();
  mutator(db);
  persist();
  return db;
}

export function resetStore() {
  cache.db = undefined;
  cache.analytics = undefined;
  try {
    fs.rmSync(DB_FILE, { force: true });
    fs.rmSync(ANALYTICS_FILE, { force: true });
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------ event ingest */
const MAX_LIVE_EVENTS = 4000;

export function trackEvent(input: {
  merchantId: string;
  type: EventType;
  source: AnalyticsEvent["source"];
  sessionHash: string;
}) {
  const db = getDb();
  const at = new Date().toISOString();
  const event: AnalyticsEvent = {
    id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    merchantId: input.merchantId,
    type: input.type,
    at,
    day: today(),
    source: input.source,
    sessionHash: input.sessionHash,
  };
  db.liveEvents.unshift(event);
  if (db.liveEvents.length > MAX_LIVE_EVENTS) db.liveEvents.length = MAX_LIVE_EVENTS;
  persist();
  return event;
}

/* ------------------------------------------------------- merchant mutations */
export function setMerchantTier(
  merchantId: string,
  tier: Tier,
  opts: { channel?: string; reference?: string } = {},
): Merchant | undefined {
  const db = getDb();
  const merchant = db.merchants.find((m) => m.id === merchantId);
  if (!merchant) return undefined;

  merchant.tier = tier;
  if (tier === "starter") {
    merchant.slotId = undefined;
  } else if (!merchant.slotId) {
    const slot = db.slots.find(
      (s) =>
        s.corridorId === merchant.corridorId &&
        s.categoryId === merchant.categoryId &&
        s.tier === tier &&
        s.status !== "sold",
    );
    if (slot) {
      slot.status = "sold";
      slot.merchantId = merchant.id;
      merchant.slotId = slot.id;
    }
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 86_400_000);
  const existing = db.subscriptions.find((s) => s.merchantId === merchant.id);
  if (tier === "starter") {
    if (existing) existing.status = "cancelled";
  } else {
    const amount = tier === "billboard" ? 249 : 99;
    if (existing) {
      existing.tier = tier;
      existing.status = "active";
      existing.amountCedis = amount;
      existing.currentPeriodEnd = periodEnd.toISOString();
      existing.channel = (opts.channel as never) ?? existing.channel;
      existing.paystackRef = opts.reference ?? existing.paystackRef;
    } else {
      db.subscriptions.push({
        id: `sub-${merchant.slug}`,
        merchantId: merchant.id,
        tier,
        status: "active",
        amountCedis: amount,
        startedAt: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        channel: (opts.channel as never) ?? "mtn-momo",
        paystackRef: opts.reference,
      });
    }
    db.invoices.unshift({
      id: `inv-${Date.now()}`,
      merchantId: merchant.id,
      subscriptionId: `sub-${merchant.slug}`,
      amountCedis: amount,
      status: "paid",
      issuedAt: now.toISOString(),
      paidAt: now.toISOString(),
      reference: opts.reference ?? `SEEN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      channel: opts.channel ?? "mtn-momo",
      description: `${tier === "billboard" ? "Billboard" : "Boost"} subscription — ${now.toLocaleDateString(
        "en-GB",
        { month: "long", year: "numeric" },
      )}`,
    });
  }

  persist();
  return merchant;
}

export function verifyMerchant(merchantId: string, approve: boolean) {
  const db = getDb();
  const merchant = db.merchants.find((m) => m.id === merchantId);
  if (!merchant) return undefined;
  merchant.status = approve ? "verified" : "rejected";
  merchant.verifiedAt = approve ? new Date().toISOString() : merchant.verifiedAt;
  persist();
  return merchant;
}

export function addMerchant(
  input: Pick<
    Merchant,
    "name" | "slug" | "categoryId" | "corridorId" | "tagline" | "description" | "ghanapost" | "gps" | "phone" | "email" | "hours" | "priceBand"
  > & { ownerUserId?: string },
): Merchant {
  const db = getDb();
  const now = new Date().toISOString();
  const merchant: Merchant = {
    id: `m-${input.slug}`,
    slug: input.slug,
    name: input.name,
    categoryId: input.categoryId,
    corridorId: input.corridorId,
    tier: "starter",
    status: "pending",
    tagline: input.tagline,
    description: input.description,
    ghanapost: input.ghanapost,
    gps: input.gps,
    landmark: "",
    phone: input.phone,
    whatsapp: input.phone,
    email: input.email,
    hours: input.hours,
    priceBand: input.priceBand,
    rating: 0,
    reviewCount: 0,
    photos: [],
    panoramaUrl: "",
    amenities: [],
    verifiedAt: "",
    founding: false,
    ownerUserId: input.ownerUserId ?? `u-${input.slug}`,
    createdAt: now,
  };
  db.merchants.push(merchant);
  persist();
  return merchant;
}
