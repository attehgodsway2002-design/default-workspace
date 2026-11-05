import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { adminOverview, listCategories, listCorridors } from "@/lib/db/queries";
import { cedis, compact, relativeDays } from "@/lib/format";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stat,
} from "@/components/ui/card";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { TrendChart } from "@/components/charts";
import { OpsHeader } from "@/components/admin/ops-header";
import { EmptyState } from "@/components/admin/empty-state";
import { VerifyActions } from "@/components/admin/verify-actions";
import { MiniStatusBadge } from "@/components/admin/status-badges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Overview" };

export default function AdminOverviewPage() {
  const overview = adminOverview();
  const corridors = listCorridors();
  const categories = listCategories();
  const corridorName = new Map(corridors.map((c) => [c.id, c.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const trend = overview.invoicesTrend
    .slice(-6)
    .map((month) => ({
      day: `${month.month}-01`,
      value: month.collected,
      secondary: month.pending,
    }));
  const collected = trend.reduce((sum, month) => sum + month.value, 0);
  const pending = trend.reduce((sum, month) => sum + (month.secondary ?? 0), 0);
  const totalWaitlist = overview.corridors.reduce((sum, c) => sum + c.waitlist, 0);

  return (
    <div className="space-y-5">
      <OpsHeader />

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">Overview</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Everything the operator on duty needs: revenue, corridor occupancy, the verification
            queue and what the mini-app partners are doing inside Seen.
          </p>
        </div>
        <Badge tone="outline">{overview.merchants} storefronts onboarded</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat
          label="MRR"
          value={cedis(overview.mrr)}
          hint="GH₵99 Boost + GH₵249 Billboard, active subs only"
        />
        <Stat
          label="ARR"
          value={cedis(overview.arr)}
          hint="MRR × 12; the model has no annual prepay"
        />
        <Stat
          label="Paying merchants"
          value={overview.paying}
          hint="Verified listings on Boost or Billboard"
        />
        <Stat
          label="Free listings"
          value={overview.free}
          hint="Starter tier — the paid-conversion pipeline"
        />
        <Stat
          label="Pending verification"
          value={overview.pending}
          hint="Field visits owed before these go live"
        />
        <Stat
          label="Mini-app GMV"
          value={cedis(overview.takeRate.gmv)}
          hint="Partner sales processed inside Seen this month"
        />
        <Stat
          label="Seen's take"
          value={cedis(overview.takeRate.takeover)}
          hint="Weighted take across QuickBook, Accra Live and Nexus"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
            <CardDescription>
              Collected vs pending subscription invoices, last {trend.length} months.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-6">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Collected
                </div>
                <div className="metric mt-0.5 text-xl font-semibold text-ink-900">
                  {cedis(collected)}
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Still pending
                </div>
                <div className="metric mt-0.5 text-xl font-semibold text-[#A8442A]">
                  {cedis(pending)}
                </div>
              </div>
            </div>
            <TrendChart
              data={trend}
              height={200}
              label="Collected"
              secondaryLabel="Pending"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Corridor occupancy</CardTitle>
            <CardDescription>
              Sold slot share by corridor · {totalWaitlist} operators waiting across the estate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Corridor</TH>
                  <TH className="text-right">Listings</TH>
                  <TH className="text-right">Paying</TH>
                  <TH className="text-right">30-day impressions</TH>
                  <TH>Occupancy</TH>
                  <TH className="text-right">Waitlist</TH>
                </TR>
              </THead>
              <TBody>
                {overview.corridors.map((row) => {
                  const percent = Math.round(row.occupancy * 100);
                  return (
                    <TR key={row.corridor.id}>
                      <TD className="font-medium text-ink-900">{row.corridor.name}</TD>
                      <TD className="metric text-right">{row.listings}</TD>
                      <TD className="metric text-right">{row.paying}</TD>
                      <TD className="metric text-right">{compact(row.impressions)}</TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-50">
                            <div
                              className="h-full rounded-full bg-sun-500"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="metric text-[12px] text-ink-500">{percent}%</span>
                        </div>
                      </TD>
                      <TD className="metric text-right">{row.waitlist}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Verification queue</CardTitle>
          <CardDescription>
            {overview.verificationQueue.length === 0
              ? "Every submitted storefront has a decision on it."
              : `${overview.verificationQueue.length} storefront${
                  overview.verificationQueue.length === 1 ? "" : "s"
                } waiting on a GhanaPostGPS-confirmed field visit.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {overview.verificationQueue.length === 0 ? (
            <EmptyState
              title="Queue clear"
              detail="New sign-ups land here automatically once the merchant submits its GhanaPostGPS address and opening hours."
              action={
                <Link
                  href="/admin/merchants"
                  className="text-[13px] font-semibold text-sun-600 hover:text-sun-700"
                >
                  Browse all merchants
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-50">
              {overview.verificationQueue.map((merchant) => (
                <li
                  key={merchant.id}
                  className="flex flex-col gap-3 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <Link
                      href={`/admin/merchants/${merchant.id}`}
                      className="text-sm font-semibold text-ink-900 hover:text-sun-600"
                    >
                      {merchant.name}
                    </Link>
                    <div className="mt-0.5 text-[12px] text-ink-400">
                      {corridorName.get(merchant.corridorId)} ·{" "}
                      {categoryName.get(merchant.categoryId)} · {merchant.ghanapost}
                    </div>
                    <div className="text-[12px] text-ink-400">
                      Submitted {relativeDays(merchant.createdAt)} · {merchant.hours}
                    </div>
                  </div>
                  <VerifyActions merchantId={merchant.id} merchantName={merchant.name} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top merchants · 30-day impressions</CardTitle>
            <CardDescription>Who the feed is actually putting in front of Accra.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Merchant</TH>
                  <TH>Corridor</TH>
                  <TH>Tier</TH>
                  <TH className="text-right">Impressions</TH>
                  <TH className="text-right">Intent</TH>
                </TR>
              </THead>
              <TBody>
                {overview.topMerchants.map((row) => (
                  <TR key={row.merchant.id}>
                    <TD>
                      <Link
                        href={`/admin/merchants/${row.merchant.id}`}
                        className="font-medium text-ink-900 hover:text-sun-600"
                      >
                        {row.merchant.name}
                      </Link>
                    </TD>
                    <TD className="whitespace-nowrap text-[13px] text-ink-500">
                      {corridorName.get(row.merchant.corridorId)}
                    </TD>
                    <TD>
                      <TierBadge tier={row.merchant.tier} />
                    </TD>
                    <TD className="metric text-right">{compact(row.impressions)}</TD>
                    <TD className="metric text-right">{compact(row.intent)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
            {overview.topMerchants.length === 0 && (
              <EmptyState
                title="No impressions yet"
                detail="Impressions start accruing once verified storefronts appear in the feed."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle>Partner performance</CardTitle>
                <CardDescription>Monthly GMV, take rate and Seen's cut.</CardDescription>
              </div>
              <Link
                href="/admin/partners"
                className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-sun-600 hover:text-sun-700"
              >
                Manage
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Partner</TH>
                  <TH>Status</TH>
                  <TH className="text-right">Monthly GMV</TH>
                  <TH className="text-right">Take (bps)</TH>
                  <TH className="text-right">Seen take</TH>
                </TR>
              </THead>
              <TBody>
                {overview.miniApps.map((app) => (
                  <TR key={app.id}>
                    <TD>
                      <div className="font-medium text-ink-900">{app.name}</div>
                      <div className="text-[12px] text-ink-400">{app.partner}</div>
                    </TD>
                    <TD>
                      <MiniStatusBadge status={app.status} />
                    </TD>
                    <TD className="metric text-right">{cedis(app.monthlyGmvCedis)}</TD>
                    <TD className="metric text-right">{app.takeRateBps}</TD>
                    <TD className="metric text-right font-medium text-ink-900">
                      {cedis(app.takeCedis)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-ink-300">
        Figures are read from the live store, not a snapshot. Corridor impressions cover the last
        30 days across {corridors.filter((c) => c.live).length} live corridors.
      </p>
    </div>
  );
}
