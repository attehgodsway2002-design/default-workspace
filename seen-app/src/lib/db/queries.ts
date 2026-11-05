import "server-only";
import { getAnalytics, getDb } from "./index";
import type { DailyMetric } from "./seed";
import type {
  Category,
  CategoryId,
  Corridor,
  CorridorId,
  Invoice,
  Merchant,
  MerchantMetrics,
  MiniApp,
  MiniAppConsent,
  Slot,
  Subscription,
  Tier,
} from "@/lib/types";
import { addDays, daysBetween, today } from "@/lib/format";
import { distanceMetres } from "@/lib/ghana";

const TIER_WEIGHT: Record<Tier, number> = { billboard: 1000, boost: 500, starter: 0 };

/**
 * Ranking = paid tier + quality score. Paid never buys its way past a bad
 * listing: a 3.2-star merchant with no photos sits below a 4.8-star Boost.
 */
export function rankScore(m: Merchant): number {
  const quality =
    m.rating * 8 +
    Math.min(m.reviewCount, 300) / 12 +
    (m.panoramaUrl ? 6 : 0) +
    (m.photos.length >= 3 ? 4 : 0) +
    (m.founding ? 6 : 0) +
    (m.status === "verified" ? 15 : 0);
  return TIER_WEIGHT[m.tier] + quality;
}

export interface SearchParams {
  q?: string;
  corridorId?: CorridorId | "all";
  categoryId?: CategoryId | "all";
  tier?: Tier | "all";
  priceBand?: 1 | 2 | 3 | 0;
  openNow?: boolean;
  sort?: "relevance" | "rating" | "distance" | "reviews";
  from?: { lat: number; lng: number };
  limit?: number;
}

export interface SearchResult {
  merchant: Merchant;
  score: number;
  distanceMetres: number | null;
  highlights: string[];
}

export function listCorridors(): Corridor[] {
  return getDb().corridors;
}

export function liveCorridors(): Corridor[] {
  return getDb().corridors.filter((c) => c.live);
}

export function getCorridor(id: CorridorId): Corridor | undefined {
  return getDb().corridors.find((c) => c.id === id);
}

export function getCorridorBySlug(slug: string): Corridor | undefined {
  return getDb().corridors.find((c) => c.id === slug);
}

export function listCategories(): Category[] {
  return getDb().categories;
}

export function getCategory(id: CategoryId): Category | undefined {
  return getDb().categories.find((c) => c.id === id);
}

export function allMerchants(): Merchant[] {
  return getDb().merchants;
}

export function verifiedMerchants(): Merchant[] {
  return getDb().merchants.filter((m) => m.status === "verified");
}

export function getMerchantBySlug(slug: string): Merchant | undefined {
  return getDb().merchants.find((m) => m.slug === slug);
}

export function getMerchantById(id: string): Merchant | undefined {
  return getDb().merchants.find((m) => m.id === id);
}

export function getDemoMerchant(): Merchant {
  const db = getDb();
  return db.merchants.find((m) => m.slug === db.demoMerchantSlug) ?? db.merchants[0]!;
}

export function getPlans() {
  return getDb().plans;
}

export function getPlan(tier: Tier) {
  return getDb().plans.find((p) => p.tier === tier)!;
}

/* --------------------------------------------------------------- discovery */
export function searchMerchants(params: SearchParams = {}): SearchResult[] {
  const {
    q = "",
    corridorId = "all",
    categoryId = "all",
    tier = "all",
    priceBand = 0,
    sort = "relevance",
    from,
    limit = 60,
  } = params;

  const term = q.trim().toLowerCase();
  const results: SearchResult[] = [];

  for (const merchant of getDb().merchants) {
    if (merchant.status !== "verified") continue;
    if (corridorId !== "all" && merchant.corridorId !== corridorId) continue;
    if (categoryId !== "all" && merchant.categoryId !== categoryId) continue;
    if (tier !== "all" && merchant.tier !== tier) continue;
    if (priceBand && merchant.priceBand !== priceBand) continue;

    const category = getCategory(merchant.categoryId);
    const corridor = getCorridor(merchant.corridorId);
    const haystack = [
      merchant.name,
      merchant.tagline,
      merchant.description,
      merchant.landmark,
      merchant.ghanapost,
      merchant.hours,
      category?.name ?? "",
      corridor?.name ?? "",
      ...merchant.amenities,
    ]
      .join(" ")
      .toLowerCase();

    let textScore = 0;
    const highlights: string[] = [];
    if (term) {
      if (!haystack.includes(term)) {
        // token-wise match so "jollof osu" behaves sensibly
        const tokens = term.split(/\s+/).filter(Boolean);
        const matched = tokens.filter((t) => haystack.includes(t));
        if (matched.length === 0) continue;
        textScore += matched.length * 12;
      } else {
        textScore += 40;
      }
      if (merchant.name.toLowerCase().includes(term)) {
        textScore += 60;
        highlights.push("Name match");
      }
      if (merchant.tagline.toLowerCase().includes(term)) {
        textScore += 18;
        highlights.push("In description");
      }
    }

    const distance = from
      ? Math.round(distanceMetres(from, merchant.gps))
      : null;

    let score = rankScore(merchant) + textScore;
    if (sort === "distance" && distance !== null) score = -distance + rankScore(merchant) / 1000;
    if (sort === "rating") score = merchant.rating * 100 + merchant.tier === "starter" ? merchant.rating * 100 : score;
    if (sort === "reviews") score = merchant.reviewCount;
    if (merchant.tier !== "starter") highlights.push(merchant.tier === "billboard" ? "Billboard" : "Boost");

    results.push({ merchant, score, distanceMetres: distance, highlights });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

/** Which category does the corridor lead with on the home feed? */
export function corridorHighlights(corridorId: CorridorId) {
  return getDb()
    .merchants.filter((m) => m.corridorId === corridorId && m.status === "verified" && m.tier === "billboard")
    .sort((a, b) => rankScore(b) - rankScore(a))
    .slice(0, 3);
}

/* --------------------------------------------------------------- analytics */
function emptyMetrics(merchantId: string, days: number): MerchantMetrics {
  return {
    merchantId,
    days,
    impressions: 0,
    views: 0,
    mapClicks: 0,
    phoneClicks: 0,
    directionRequests: 0,
    qrRedemptions: 0,
    ctr: 0,
    intentRate: 0,
    byDay: [],
    bySource: [],
    uniqueSessions: 0,
  };
}

function windowRows(merchantId: string, startDay: string, endDay: string): DailyMetric[] {
  return getAnalytics().filter(
    (r) => r.merchantId === merchantId && r.day >= startDay && r.day <= endDay,
  );
}

function liveRows(merchantId: string, startDay: string, endDay: string): DailyMetric[] {
  const buckets = new Map<string, DailyMetric>();
  const db = getDb();
  for (const ev of db.liveEvents) {
    if (ev.merchantId !== merchantId) continue;
    if (ev.day < startDay || ev.day > endDay) continue;
    let row = buckets.get(ev.day);
    if (!row) {
      row = {
        merchantId,
        day: ev.day,
        impressions: 0,
        views: 0,
        mapClicks: 0,
        phoneClicks: 0,
        directionRequests: 0,
        qrRedemptions: 0,
        uniques: 0,
        sources: {},
      };
      buckets.set(ev.day, row);
    }
    switch (ev.type) {
      case "impression":
        row.impressions += 1;
        break;
      case "view":
        row.views += 1;
        break;
      case "map_click":
        row.mapClicks += 1;
        break;
      case "phone_click":
        row.phoneClicks += 1;
        break;
      case "direction_request":
        row.directionRequests += 1;
        break;
      case "qr_redemption":
        row.qrRedemptions += 1;
        break;
      default:
        break;
    }
    row.uniques += 1;
    row.sources[ev.source] = (row.sources[ev.source] ?? 0) + 1;
  }
  return [...buckets.values()];
}

export function metricsFor(merchantId: string, days = 30): MerchantMetrics {
  const end = today();
  const start = addDays(end, -(days - 1));
  const rows = [...windowRows(merchantId, start, end), ...liveRows(merchantId, start, end)];
  const out = emptyMetrics(merchantId, days);
  const byDay = new Map<string, { day: string; impressions: number; views: number; intent: number }>();
  const sources = new Map<string, number>();

  for (const row of rows) {
    out.impressions += row.impressions;
    out.views += row.views;
    out.mapClicks += row.mapClicks;
    out.phoneClicks += row.phoneClicks;
    out.directionRequests += row.directionRequests;
    out.qrRedemptions += row.qrRedemptions;
    out.uniqueSessions += row.uniques;
    const bucket = byDay.get(row.day) ?? { day: row.day, impressions: 0, views: 0, intent: 0 };
    bucket.impressions += row.impressions;
    bucket.views += row.views;
    bucket.intent += row.mapClicks + row.phoneClicks + row.directionRequests;
    byDay.set(row.day, bucket);
    for (const [source, count] of Object.entries(row.sources)) {
      sources.set(source, (sources.get(source) ?? 0) + count);
    }
  }

  out.ctr = out.impressions ? out.views / out.impressions : 0;
  out.intentRate = out.views ? (out.mapClicks + out.phoneClicks + out.directionRequests) / out.views : 0;
  // Charts show complete days only — today is still accumulating and would
  // otherwise render as a misleading cliff on the right edge of every trend.
  out.byDay = [...byDay.values()]
    .filter((row) => row.day !== end)
    .sort((a, b) => a.day.localeCompare(b.day));
  out.bySource = [...sources.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
  return out;
}

export interface MetricsDelta {
  current: MerchantMetrics;
  previous: MerchantMetrics;
  impressionsDelta: number;
  viewsDelta: number;
  intentDelta: number;
  qrDelta: number;
}

export function metricsWithDelta(merchantId: string, days = 30): MetricsDelta {
  const current = metricsFor(merchantId, days);
  const end = addDays(today(), -days);
  const start = addDays(end, -(days - 1));
  const rows = [...windowRows(merchantId, start, end), ...liveRows(merchantId, start, end)];
  const previous = emptyMetrics(merchantId, days);
  for (const row of rows) {
    previous.impressions += row.impressions;
    previous.views += row.views;
    previous.mapClicks += row.mapClicks;
    previous.phoneClicks += row.phoneClicks;
    previous.directionRequests += row.directionRequests;
    previous.qrRedemptions += row.qrRedemptions;
    previous.uniqueSessions += row.uniques;
  }
  const delta = (a: number, b: number) => (b ? (a - b) / b : 0);
  return {
    current,
    previous,
    impressionsDelta: delta(current.impressions, previous.impressions),
    viewsDelta: delta(current.views, previous.views),
    intentDelta: delta(current.mapClicks + current.phoneClicks + current.directionRequests, previous.mapClicks + previous.phoneClicks + previous.directionRequests),
    qrDelta: delta(current.qrRedemptions, previous.qrRedemptions),
  };
}

/** Every storefront's 30-day impressions — used for corridor and admin rollups. */
export function corridorMetrics(corridorId: CorridorId, days = 30) {
  const merchants = getDb().merchants.filter((m) => m.corridorId === corridorId);
  let impressions = 0;
  let views = 0;
  let intent = 0;
  for (const merchant of merchants) {
    const m = metricsFor(merchant.id, days);
    impressions += m.impressions;
    views += m.views;
    intent += m.mapClicks + m.phoneClicks + m.directionRequests;
  }
  return { impressions, views, intent, merchants: merchants.length };
}

/* ------------------------------------------------------------------ slots */
export function slotInventory(corridorId: CorridorId) {
  const db = getDb();
  const corridor = getCorridor(corridorId)!;
  return db.categories.map((category) => {
    const billboards = db.slots
      .filter((s) => s.corridorId === corridorId && s.categoryId === category.id && s.tier === "billboard")
      .sort((a, b) => a.position - b.position);
    const boosts = db.slots
      .filter((s) => s.corridorId === corridorId && s.categoryId === category.id && s.tier === "boost")
      .sort((a, b) => a.position - b.position);
    return { category, billboards, boosts };
  });
}

export function allSlots(): Slot[] {
  return getDb().slots;
}

export function nextAvailableSlot(
  corridorId: CorridorId,
  categoryId: CategoryId,
  tier: "boost" | "billboard",
): Slot | undefined {
  return getDb()
    .slots.filter(
      (s) => s.corridorId === corridorId && s.categoryId === categoryId && s.tier === tier && s.status !== "sold",
    )
    .sort((a, b) => a.position - b.position)[0];
}

/* ---------------------------------------------------------------- billing */
export interface BillingView {
  subscription?: Subscription;
  invoices: Invoice[];
  nextChargeDate?: string;
  daysLeft?: number;
  lifetimePaid: number;
  outstanding: number;
  channelLabel: string;
}

const CHANNEL_LABEL: Record<string, string> = {
  "mtn-momo": "MTN MoMo",
  "telecel-cash": "Telecel Cash",
  "at-money": "AT Money",
  card: "Visa / Mastercard",
};

export function billingFor(merchantId: string): BillingView {
  const db = getDb();
  const subscription = db.subscriptions
    .filter((s) => s.merchantId === merchantId)
    .sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt))[0];
  const invoices = db.invoices
    .filter((i) => i.merchantId === merchantId)
    .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
  const lifetimePaid = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.amountCedis, 0);
  const outstanding = invoices.filter((i) => i.status === "pending").reduce((sum, i) => sum + i.amountCedis, 0);
  const nextChargeDate = subscription?.currentPeriodEnd;
  return {
    subscription,
    invoices,
    nextChargeDate,
    daysLeft: nextChargeDate ? Math.max(0, daysBetween(today(), nextChargeDate.slice(0, 10))) : undefined,
    lifetimePaid,
    outstanding,
    channelLabel: subscription?.channel ? CHANNEL_LABEL[subscription.channel] ?? subscription.channel : "—",
  };
}

/* --------------------------------------------------------------- mini apps */
export function listMiniApps(): MiniApp[] {
  return [...getDb().miniApps];
}

export function getMiniApp(slug: string): MiniApp | undefined {
  return getDb().miniApps.find((m) => m.slug === slug);
}

export function consentsFor(userId: string): MiniAppConsent[] {
  return getDb().consents.filter((c) => c.userId === userId && !c.revokedAt);
}

export function consentFor(userId: string, miniAppId: string): MiniAppConsent | undefined {
  return getDb().consents.find(
    (c) => c.userId === userId && c.miniAppId === miniAppId && !c.revokedAt,
  );
}

export function bookingsFor(userId: string) {
  const db = getDb();
  return db.bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    .map((b) => ({ ...b, merchant: getMerchantById(b.merchantId) }));
}

export function ordersFor(userId: string) {
  return getDb()
    .ticketOrders.filter((o) => o.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/* ------------------------------------------------------------------- admin */
export interface AdminOverview {
  merchants: number;
  verified: number;
  pending: number;
  paying: number;
  free: number;
  mrr: number;
  arr: number;
  newLast30: number;
  churnRisk: number;
  corridors: {
    corridor: Corridor;
    listings: number;
    paying: number;
    impressions: number;
    views: number;
    occupancy: number;
    waitlist: number;
  }[];
  revenueByTier: { tier: Tier; amount: number; merchants: number }[];
  invoicesTrend: { month: string; collected: number; pending: number }[];
  miniApps: (MiniApp & { takeCedis: number })[];
  verificationQueue: Merchant[];
  topMerchants: { merchant: Merchant; impressions: number; intent: number }[];
  takeRate: { gmv: number; takeover: number };
}

export function adminOverview(): AdminOverview {
  const db = getDb();
  const paying = db.merchants.filter((m) => m.tier !== "starter" && m.status === "verified");
  const activeSubs = db.subscriptions.filter((s) => s.status === "active" || s.status === "past_due");
  const mrr = activeSubs.reduce((sum, s) => sum + s.amountCedis, 0);

  const corridors = db.corridors
    .filter((c) => c.live)
    .map((corridor) => {
      const listings = db.merchants.filter((m) => m.corridorId === corridor.id && m.status === "verified");
      const slots = db.slots.filter((s) => s.corridorId === corridor.id);
      const sold = slots.filter((s) => s.status === "sold");
      const metrics = corridorMetrics(corridor.id, 30);
      return {
        corridor,
        listings: listings.length,
        paying: listings.filter((m) => m.tier !== "starter").length,
        impressions: metrics.impressions,
        views: metrics.views,
        occupancy: slots.length ? sold.length / slots.length : 0,
        waitlist: slots.reduce((sum, s) => sum + s.waitlist, 0),
      };
    });

  const tiers: Tier[] = ["starter", "boost", "billboard"];
  const revenueByTier = tiers.map((tier) => ({
    tier,
    amount: activeSubs.filter((s) => s.tier === tier).reduce((sum, s) => sum + s.amountCedis, 0),
    merchants: db.merchants.filter((m) => m.tier === tier).length,
  }));

  const months = new Map<string, { collected: number; pending: number }>();
  for (const invoice of db.invoices) {
    const month = invoice.issuedAt.slice(0, 7);
    const bucket = months.get(month) ?? { collected: 0, pending: 0 };
    if (invoice.status === "paid") bucket.collected += invoice.amountCedis;
    if (invoice.status === "pending") bucket.pending += invoice.amountCedis;
    months.set(month, bucket);
  }
  const invoicesTrend = [...months.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, v]) => ({ month, ...v }));

  const miniApps = db.miniApps.map((app) => ({
    ...app,
    takeCedis: Math.round((app.monthlyGmvCedis * app.takeRateBps) / 10_000),
  }));

  const topMerchants = db.merchants
    .filter((m) => m.status === "verified")
    .map((merchant) => {
      const m = metricsFor(merchant.id, 30);
      return {
        merchant,
        impressions: m.impressions,
        intent: m.mapClicks + m.phoneClicks + m.directionRequests,
      };
    })
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 6);

  const gmv = db.miniApps.reduce((sum, a) => sum + a.monthlyGmvCedis, 0);
  const takeover = db.miniApps.reduce(
    (sum, a) => sum + Math.round((a.monthlyGmvCedis * a.takeRateBps) / 10_000),
    0,
  );

  const thirtyDaysAgo = addDays(today(), -30);

  return {
    merchants: db.merchants.length,
    verified: db.merchants.filter((m) => m.status === "verified").length,
    pending: db.merchants.filter((m) => m.status === "pending").length,
    paying: paying.length,
    free: db.merchants.filter((m) => m.tier === "starter").length,
    mrr,
    arr: mrr * 12,
    newLast30: db.merchants.filter((m) => m.createdAt.slice(0, 10) >= thirtyDaysAgo).length,
    churnRisk: db.subscriptions.filter((s) => s.status === "past_due").length,
    corridors,
    revenueByTier,
    invoicesTrend,
    miniApps,
    verificationQueue: db.merchants.filter((m) => m.status === "pending"),
    topMerchants,
    takeRate: { gmv, takeover },
  };
}

