/**
 * Small presentation helpers shared by the merchant slice.
 * Pure functions only — safe to import from both server and client components.
 */
import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import type { EventType, Invoice, PlanStatus } from "@/lib/types";

type Tone = "primary" | "sun" | "outline" | "ghost";
type Size = "md" | "sm";

const LINK_BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const LINK_TONES: Record<Tone, string> = {
  primary: "bg-ink-900 text-white shadow-sm hover:bg-ink-800 active:bg-ink-950",
  sun: "bg-sun-500 text-white shadow-sm hover:bg-sun-600 active:bg-sun-700",
  outline: "border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50",
  ghost: "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
};

const LINK_SIZES: Record<Size, string> = {
  md: "h-10 px-4 text-sm",
  sm: "h-8 px-3 text-[13px]",
};

/** Matches the shared `Button` primitive for anchor-style actions. */
export function actionLink(tone: Tone = "primary", size: Size = "md"): string {
  return cn(LINK_BASE, LINK_TONES[tone], LINK_SIZES[size]);
}

export const CHANNEL_LABEL: Record<string, string> = {
  "mtn-momo": "MTN MoMo",
  "telecel-cash": "Telecel Cash",
  "at-money": "AT Money",
  card: "Visa / Mastercard",
  mobile_money: "Mobile money",
};

export function channelLabel(channel?: string): string {
  if (!channel) return "—";
  return CHANNEL_LABEL[channel] ?? titleCase(channel);
}

export const SOURCE_LABEL: Record<string, string> = {
  feed: "Seen feed",
  search: "Search",
  map: "Map",
  qr: "Till QR",
  direct: "Direct link",
  mini: "Mini-apps",
};

export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? titleCase(source);
}

export const EVENT_LABEL: Record<EventType, string> = {
  impression: "Impression",
  view: "Profile view",
  map_click: "Map click",
  phone_click: "Phone tap",
  direction_request: "Directions opened",
  qr_redemption: "QR redemption",
  mini_open: "Mini-app opened",
};

export const PRICE_BAND_LABEL: Record<number, string> = {
  1: "Budget friendly",
  2: "Mid-range",
  3: "Premium",
};

export function priceBandLabel(band: number): string {
  return PRICE_BAND_LABEL[band] ?? "Mid-range";
}

export function invoiceStatusTone(status: Invoice["status"]): "green" | "gold" | "clay" {
  if (status === "paid") return "green";
  if (status === "pending") return "gold";
  return "clay";
}

export function planStatusTone(status: PlanStatus): "green" | "sun" | "clay" | "neutral" {
  if (status === "active") return "green";
  if (status === "trialing") return "sun";
  if (status === "past_due") return "clay";
  return "neutral";
}

export function planStatusLabel(status: PlanStatus): string {
  if (status === "active") return "Active";
  if (status === "trialing") return "Trialing";
  if (status === "past_due") return "Past due";
  return "Cancelled";
}

/** "3 min ago" / "2 hours ago" / "4 days ago" — live events are recent. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - Date.parse(iso);
  if (!Number.isFinite(diff)) return "just now";
  const minutes = Math.max(0, Math.round(diff / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.max(1, Math.round(days / 30));
  return months === 1 ? "1 month ago" : `${months} months ago`;
}
