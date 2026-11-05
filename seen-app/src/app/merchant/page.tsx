import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, Eye, Phone, Navigation, QrCode } from "lucide-react";
import { getCategory, getPlan, metricsWithDelta, billingFor } from "@/lib/db/queries";
import { getDb } from "@/lib/db";
import { cedis, compact, pct } from "@/lib/format";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Card, CardContent, Stat } from "@/components/ui/card";
import { TrendChart } from "@/components/charts";
import { merchantContext } from "@/components/merchant/context";
import {
  ActivityFeed,
  DashboardPlanCard,
  FunnelCard,
  LockedAnalytics,
  RangeSwitcher,
  RoiPanel,
  SourceBreakdownCard,
} from "@/components/merchant/dashboard-parts";
import { actionLink } from "@/components/merchant/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your weekly visibility report: impressions, intent actions and QR redemptions.",
};

function parseRange(raw?: string): 7 | 30 | 90 {
  if (raw === "7") return 7;
  if (raw === "90") return 90;
  return 30;
}

export default async function MerchantDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { merchant } = await merchantContext();
  const params = await searchParams;
  const days = parseRange(params.range);

  const plan = getPlan(merchant.tier);
  const category = getCategory(merchant.categoryId);
  const billing = billingFor(merchant.id);
  const isStarter = merchant.tier === "starter";
  const metricsDelta = isStarter ? null : metricsWithDelta(merchant.id, days);
  const current = metricsDelta?.current;
  const previous = metricsDelta?.previous;
  const intentActions = current
    ? current.mapClicks + current.phoneClicks + current.directionRequests
    : 0;
  const previousIntent = previous
    ? previous.mapClicks + previous.phoneClicks + previous.directionRequests
    : 0;

  const recent = getDb()
    .liveEvents.filter((event) => event.merchantId === merchant.id)
    .slice(0, 6);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink-900 sm:text-xl">
            Performance
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            {isStarter
              ? "Your free listing is live. Upgrade to see what it turns into."
              : `What ${merchant.name} turned into over the last ${days} days.`}
          </p>
        </div>
        <RangeSwitcher current={days} />
      </div>

      {isStarter || !current || !previous ? (
        <LockedAnalytics merchantName={merchant.name} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat
              label="Impressions"
              value={compact(current.impressions)}
              delta={metricsDelta?.impressionsDelta}
              hint={`${compact(previous.impressions)} previous ${days}d`}
            />
            <Stat
              label="Profile views"
              value={compact(current.views)}
              delta={metricsDelta?.viewsDelta}
              hint={`${pct(current.ctr)} of impressions`}
            />
            <Stat
              label="Intent actions"
              value={compact(intentActions)}
              delta={metricsDelta?.intentDelta}
              hint={`Map, call & directions · ${compact(previousIntent)} prev`}
            />
            <Stat
              label="QR redemptions"
              value={compact(current.qrRedemptions)}
              delta={metricsDelta?.qrDelta}
              hint={`${pct(current.views ? current.qrRedemptions / current.views : 0)} of views`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="p-5">
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink-900">Impressions &amp; profile views</h3>
                  <span className="metric text-xs text-ink-400">
                    {compact(current.impressions)} impressions · {compact(current.views)} views
                  </span>
                </div>
                <p className="mb-4 text-[13px] text-ink-500">
                  Daily discovery in your corridor. The solid line is impressions; the dashed line is
                  profile views.
                </p>
                <TrendChart
                  data={current.byDay.map((day) => ({
                    day: day.day,
                    value: day.impressions,
                    secondary: day.views,
                  }))}
                  height={190}
                  label="Impressions"
                  secondaryLabel="Profile views"
                />
              </CardContent>
            </Card>
            <FunnelCard metrics={current} />
            <SourceBreakdownCard metrics={current} days={days} />
            <div className="lg:col-span-2">
              <RoiPanel metrics={current} category={category} plan={plan} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                <Eye className="h-3.5 w-3.5" aria-hidden /> View rate
              </div>
              <div className="metric mt-1 text-xl font-semibold text-ink-900">{pct(current.ctr)}</div>
              <p className="mt-0.5 text-xs text-ink-400">Impressions that opened your listing</p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                <Navigation className="h-3.5 w-3.5" aria-hidden /> Intent rate
              </div>
              <div className="metric mt-1 text-xl font-semibold text-ink-900">
                {pct(current.intentRate)}
              </div>
              <p className="mt-0.5 text-xs text-ink-400">Views that called, mapped or asked directions</p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
                <QrCode className="h-3.5 w-3.5" aria-hidden /> Unique sessions
              </div>
              <div className="metric mt-1 text-xl font-semibold text-ink-900">
                {compact(current.uniqueSessions)}
              </div>
              <p className="mt-0.5 text-xs text-ink-400">Distinct discovery sessions in the window</p>
            </div>
          </div>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <DashboardPlanCard merchant={merchant} billing={billing} plan={plan} />
        <div className="lg:col-span-2">
          <ActivityFeed events={recent} merchantSlug={merchant.slug} windowDays={days} />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Badge tone={merchant.status === "verified" ? "green" : "gold"}>
              {merchant.status === "verified" ? "Verified listing" : "Verification pending"}
            </Badge>
            <TierBadge tier={merchant.tier} />
            <span className="text-xs text-ink-400">
              {category?.name} · {cedis(category?.avgTicketCedis ?? 0)} average ticket
            </span>
          </div>
          <Link href="/merchant/storefront" className={actionLink("outline", "sm")}>
            Edit storefront
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </CardContent>
      </Card>

      <p className="flex items-center gap-1.5 pb-2 text-[11px] text-ink-400">
        <Phone className="h-3 w-3" aria-hidden />
        Direction actions always open Google Maps; Seen never competes on navigation.
      </p>
    </div>
  );
}
