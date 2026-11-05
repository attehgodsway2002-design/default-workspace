/**
 * Seen — domain types.
 * These mirror the Postgres schema in src/lib/db/schema.sql one-to-one so the
 * local JSON store and the Supabase adapter are interchangeable.
 */

export type Tier = "starter" | "boost" | "billboard";
export type MerchantStatus = "pending" | "verified" | "rejected" | "paused";
export type SlotStatus = "sold" | "available" | "waitlist";
export type PlanStatus = "active" | "trialing" | "past_due" | "cancelled";

export type CorridorId = "osu" | "east-legon" | "kumasi-adum";
export type CategoryId =
  | "food"
  | "beauty"
  | "repair"
  | "health"
  | "fitness"
  | "professional";

export type EventType =
  | "impression"
  | "view"
  | "map_click"
  | "phone_click"
  | "direction_request"
  | "qr_redemption"
  | "mini_open";

export interface Corridor {
  id: CorridorId;
  name: string;
  city: string;
  gpsPrefix: string;
  center: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  targetStorefronts: number;
  live: boolean;
  launchMonth: string;
}

export interface Category {
  id: CategoryId;
  name: string;
  slug: string;
  blurb: string;
  icon: string;
  avgTicketCedis: number;
}

export interface Merchant {
  id: string;
  slug: string;
  name: string;
  categoryId: CategoryId;
  corridorId: CorridorId;
  tier: Tier;
  status: MerchantStatus;
  tagline: string;
  description: string;
  ghanapost: string;
  gps: { lat: number; lng: number };
  landmark: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  priceBand: 1 | 2 | 3;
  rating: number;
  reviewCount: number;
  photos: string[];
  panoramaUrl: string;
  amenities: string[];
  verifiedAt: string;
  founding: boolean;
  slotId?: string;
  ownerUserId: string;
  createdAt: string;
}

export interface Slot {
  id: string;
  corridorId: CorridorId;
  categoryId: CategoryId;
  tier: Extract<Tier, "boost" | "billboard">;
  position: number;
  priceCedis: number;
  status: SlotStatus;
  merchantId?: string;
  termMonths: number;
  waitlist: number;
}

export interface Plan {
  tier: Tier;
  name: string;
  priceCedis: number;
  cadence: "month";
  slotsPerCategory: number;
  features: string[];
  cta: string;
  popular?: boolean;
}

export interface AnalyticsEvent {
  id: string;
  merchantId: string;
  type: EventType;
  at: string;
  day: string; // YYYY-MM-DD (UTC) — pre-indexed for fast aggregation
  source: "feed" | "search" | "map" | "qr" | "mini" | "direct";
  sessionHash: string;
}

export interface Subscription {
  id: string;
  merchantId: string;
  tier: Tier;
  status: PlanStatus;
  amountCedis: number;
  startedAt: string;
  currentPeriodEnd: string;
  paystackRef?: string;
  channel?: "mtn-momo" | "telecel-cash" | "at-money" | "card";
  trialEndsAt?: string;
}

export interface Invoice {
  id: string;
  merchantId: string;
  subscriptionId: string;
  amountCedis: number;
  status: "paid" | "pending" | "failed";
  issuedAt: string;
  paidAt?: string;
  reference: string;
  channel?: string;
  description: string;
}

export interface MiniApp {
  id: string;
  slug: string;
  name: string;
  partner: string;
  category: "booking" | "ticketing" | "bills" | "delivery";
  status: "live" | "pilot" | "loi";
  blurb: string;
  takeRateBps: number;
  monthlyTransactions: number;
  monthlyGmvCedis: number;
  scopes: MiniScope[];
  accent: string;
  launchedAt?: string;
}

export type MiniScope =
  | "identity"
  | "phone"
  | "address"
  | "payments"
  | "booking";

export interface MiniAppConsent {
  id: string;
  userId: string;
  miniAppId: string;
  scopes: MiniScope[];
  grantedAt: string;
  revokedAt?: string;
}

export interface MiniSession {
  token: string;
  userId: string;
  miniAppId: string;
  scopes: MiniScope[];
  expiresAt: string;
}

export interface Booking {
  id: string;
  miniAppId: string;
  userId: string;
  merchantId: string;
  service: string;
  priceCedis: number;
  startsAt: string;
  status: "confirmed" | "cancelled" | "completed";
  reference: string;
  createdAt: string;
}

export interface TicketOrder {
  id: string;
  miniAppId: string;
  userId: string;
  eventName: string;
  quantity: number;
  totalCedis: number;
  status: "paid" | "pending";
  reference: string;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  ghanapost?: string;
  role: "consumer" | "merchant" | "admin";
  merchantId?: string;
  createdAt: string;
}

export interface Session {
  userId: string;
  role: "consumer" | "merchant" | "admin";
  email: string;
  name: string;
  merchantId?: string;
}

/** Aggregated merchant performance for a window. */
export interface MerchantMetrics {
  merchantId: string;
  days: number;
  impressions: number;
  views: number;
  mapClicks: number;
  phoneClicks: number;
  directionRequests: number;
  qrRedemptions: number;
  ctr: number; // views / impressions
  intentRate: number; // (map+phone+direction) / views
  byDay: { day: string; impressions: number; views: number; intent: number }[];
  bySource: { source: string; count: number }[];
  uniqueSessions: number;
}

export interface SlotMap {
  corridor: Corridor;
  categories: { category: Category; billboards: Slot[]; boosts: Slot[] }[];
}
