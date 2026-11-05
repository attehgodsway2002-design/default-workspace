import Link from "next/link";
import {
  AppWindow,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Eye,
  Inbox,
  Lock,
  MapPin,
  MousePointerClick,
  Navigation,
  Phone,
  QrCode,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AnalyticsEvent, Category, Merchant, MerchantMetrics, Plan } from "@/lib/types";
import type { BillingView } from "@/lib/db/queries";
import { Badge, TierBadge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Funnel, BarList } from "@/components/charts";
import { cedis, compact, longDate, pct } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  actionLink,
  channelLabel,
  EVENT_LABEL,
  relativeTime,
  sourceLabel,
} from "./ui";

const RANGES = [
  { days: 7 as const, label: "7 days" },
  { days: 30 as const, label: "30 days" },
  { days: 90 as const, label: "90 days" },
];

export function RangeSwitcher({ current }: { current: 7 | 30 | 90 }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <nav aria-label="Performance date range" className="inline-flex rounded-xl border border-ink-200 bg-white p-1 shadow-sm">
        {RANGES.map((range) => {
          const active = range.days === current;
          const href = range.days === 30 ? "/merchant" : `/merchant?range=${range.days}`;
          return (
            <Link
              key={range.days}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-ink-900 text-white shadow-sm"
                  : "text-ink-500 hover:bg-ink-50 hover:text-ink-800",
              )}
            >
              {range.label}
            </Link>
          );
        })}
      </nav>
      <span className="text-xs text-ink-400">vs previous {current} days</span>
    </div>
  );
}

const STARTER_UNLOCKS = [
  "Impressions, profile views and intent actions",
  "Map, phone and direction taps by source",
  "QR redemptions scanned at your till",
  "The monthly “what this is worth” estimate in cedis",
  "Weekly WhatsApp performance digest",
];

export function LockedAnalytics({ merchantName }: { merchantName: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="kente-strip h-1 w-full" aria-hidden />
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-white">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-ink-900">Performance is a Boost feature</h2>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-500">
              {merchantName} is live and verified on Starter. We don&apos;t invent numbers for plans
              that don&apos;t include analytics — here is exactly what unlocks when you upgrade.
            </p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {STARTER_UNLOCKS.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-ink-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1E6B4F]" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/pricing" className={actionLink("primary")}>
                Compare plans
              </Link>
              <Link href="/merchant/billing" className={actionLink("outline")}>
                Upgrade in Billing
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
            <p className="mt-3 text-xs text-ink-400">
              Starter always keeps: your verified listing, GhanaPostGPS address, phone, hours and
              directions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function RoiPanel({
  metrics,
  category,
  plan,
}: {
  metrics: MerchantMetrics;
  category?: Category;
  plan: Plan;
}) {
  const intentActions = metrics.mapClicks + metrics.phoneClicks + metrics.directionRequests;
  const ticket = category?.avgTicketCedis ?? 0;
  // Only till QR redemptions are counted as verified visits. Intent actions are
  // shown for context but deliberately excluded from the return calculation —
  // a map tap is not a purchase, and inflating this number is how visibility
  // products lose a merchant's trust in month two.
  const verifiedVisits = metrics.qrRedemptions;
  const gross = ticket * verifiedVisits;
  const profit = gross * 0.6;
  const multiple = plan.priceCedis > 0 ? profit / plan.priceCedis : 0;
  const hasActivity = gross > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-sun-100 text-sun-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
          </span>
          <CardTitle>What this is worth</CardTitle>
        </div>
        <CardDescription>
          Your last {metrics.days} days, converted into cedis at the Accra {category?.name.toLowerCase() ?? "category"} average ticket.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasActivity ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <dl className="divide-y divide-ink-50">
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-ink-500">
                    {compact(verifiedVisits)} till QR redemptions × {cedis(ticket)} average ticket
                  </dt>
                  <dd className="metric shrink-0 text-sm font-medium text-ink-800">{cedis(gross)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-ink-500">
                    {compact(intentActions)} intent actions — not counted
                  </dt>
                  <dd className="metric shrink-0 text-sm font-medium text-ink-400">excluded</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-ink-500">Gross revenue from verified visits</dt>
                  <dd className="metric shrink-0 text-sm font-semibold text-ink-900">{cedis(gross)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-ink-500">Estimated gross profit at a 60% margin</dt>
                  <dd className="metric shrink-0 text-base font-semibold text-ink-900">{cedis(profit)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 py-2.5">
                  <dt className="text-[13px] text-ink-500">Your {plan.name} plan</dt>
                  <dd className="metric shrink-0 text-sm font-medium text-ink-700">
                    {cedis(plan.priceCedis)}/mo
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-[11px] leading-relaxed text-ink-400">
                Conservative estimate: only till QR redemptions count as verified visits, priced at
                the {category?.name ?? "category"} average ticket of {cedis(ticket)} and a 60% gross
                margin. Map opens, calls and direction requests are intent, not a purchase, so they
                stay out of the return figure.
              </p>
            </div>
            <div className="flex flex-col justify-center rounded-2xl bg-[#E7F3EC] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-[#1E6B4F]">
                Return on visibility
              </div>
              <div className="metric mt-1 text-3xl font-semibold text-[#1E6B4F]">
                {multiple.toFixed(1)}×
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-[#1E6B4F]/80">
                Gross profit divided by your {plan.name} plan. Before repeat visits and referrals.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-xl bg-ink-50 p-4">
            <p className="text-sm font-medium text-ink-800">No attributed activity in this window yet.</p>
            <p className="text-[13px] leading-relaxed text-ink-500">
              The estimate appears as soon as shoppers tap through, ask for directions or scan the
              QR code on your counter. A complete storefront converts more of the impressions you
              already get.
            </p>
            <Link href="/merchant/storefront" className={`${actionLink("outline", "sm")} mt-1`}>
              Improve your storefront
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const EVENT_ICON: Record<AnalyticsEvent["type"], LucideIcon> = {
  impression: Eye,
  view: MousePointerClick,
  map_click: MapPin,
  phone_click: Phone,
  direction_request: Navigation,
  qr_redemption: QrCode,
  mini_open: AppWindow,
};

export function ActivityFeed({
  events,
  merchantSlug,
  windowDays,
}: {
  events: AnalyticsEvent[];
  merchantSlug: string;
  windowDays: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          The last few live events for your listing. Aggregates above cover {windowDays} days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <ul className="divide-y divide-ink-50">
            {events.map((event) => {
              const Icon = EVENT_ICON[event.type] ?? Eye;
              return (
                <li key={event.id} className="flex items-center gap-3 py-2.5">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink-50 text-ink-500">
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink-800">
                      {EVENT_LABEL[event.type] ?? event.type}
                    </span>
                    <span className="block truncate text-[11px] text-ink-400">
                      via {sourceLabel(event.source)}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] text-ink-400">{relativeTime(event.at)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-2 rounded-xl bg-ink-50 p-4">
            <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
              <Inbox className="h-4 w-4" aria-hidden />
              No live events yet
            </span>
            <p className="text-[13px] leading-relaxed text-ink-500">
              As shoppers find you in the feed, search and at the till, their actions stream in here
              in real time.
            </p>
            <Link href={`/business/${merchantSlug}`} className={`${actionLink("outline", "sm")} mt-1`}>
              View your public listing
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardPlanCard({
  merchant,
  billing,
  plan,
}: {
  merchant: Merchant;
  billing: BillingView;
  plan: Plan;
}) {
  const subscribed = merchant.tier !== "starter" && billing.subscription;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Your plan</CardTitle>
          <TierBadge tier={merchant.tier} />
        </div>
        <CardDescription>
          {subscribed
            ? `${plan.name} · ${cedis(plan.priceCedis)}/month, billed monthly.`
            : "Free listing — ranked placement and analytics are paid features."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span className="metric text-2xl font-semibold text-ink-900">{cedis(plan.priceCedis)}</span>
          <span className="text-sm text-ink-400">/month</span>
        </div>
        <dl className="mt-4 space-y-2 text-[13px]">
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink-400">Slot ID</dt>
            <dd className="truncate font-mono text-[11px] text-ink-700">
              {merchant.slotId ?? "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink-400">Next charge</dt>
            <dd className="font-medium text-ink-800">
              {billing.nextChargeDate ? longDate(billing.nextChargeDate) : "No card on file"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink-400">Days remaining</dt>
            <dd className="metric font-medium text-ink-800">
              {typeof billing.daysLeft === "number" ? `${billing.daysLeft} days` : "—"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <dt className="text-ink-400">Paid with</dt>
            <dd className="font-medium text-ink-800">{billing.channelLabel}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/merchant/billing" className={actionLink("primary", "sm")}>
            <CreditCard className="h-3.5 w-3.5" aria-hidden />
            {merchant.tier === "starter" ? "Upgrade plan" : "Manage billing"}
          </Link>
          {typeof billing.outstanding === "number" && billing.outstanding > 0 && (
            <Badge tone="gold">{cedis(billing.outstanding)} pending</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function SourceBreakdownCard({
  metrics,
  days,
}: {
  metrics: MerchantMetrics;
  days: number;
}) {
  const total = metrics.bySource.reduce((sum, item) => sum + item.count, 0);
  const items = metrics.bySource.map((item) => ({
    label: sourceLabel(item.source),
    value: item.count,
    hint: total ? pct(item.count / total, 0) : undefined,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where they found you</CardTitle>
        <CardDescription>Impressions by surface, last {days} days.</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <BarList items={items} />
        ) : (
          <p className="py-6 text-center text-sm text-ink-400">
            No impressions recorded in this window yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function FunnelCard({ metrics }: { metrics: MerchantMetrics }) {
  const intentActions = metrics.mapClicks + metrics.phoneClicks + metrics.directionRequests;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel</CardTitle>
        <CardDescription>Where attention turns into a visit or a sale.</CardDescription>
      </CardHeader>
      <CardContent>
        <Funnel
          steps={[
            { label: "Impressions", value: metrics.impressions },
            { label: "Profile views", value: metrics.views },
            { label: "Intent actions", value: intentActions },
            { label: "QR redemptions", value: metrics.qrRedemptions },
          ]}
        />
      </CardContent>
    </Card>
  );
}
