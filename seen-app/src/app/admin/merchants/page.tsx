import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import {
  allMerchants,
  getPlans,
  listCategories,
  listCorridors,
  metricsFor,
} from "@/lib/db/queries";
import { cedis, compact } from "@/lib/format";
import type { CategoryId, CorridorId, MerchantStatus, Tier } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, TierBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { OpsHeader } from "@/components/admin/ops-header";
import { EmptyState } from "@/components/admin/empty-state";
import { MerchantStatusBadge } from "@/components/admin/status-badges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Merchants" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

const STATUS_ORDER: Record<MerchantStatus, number> = {
  pending: 0,
  verified: 1,
  rejected: 2,
  paused: 3,
};

const TIER_ORDER: Record<Tier, number> = { billboard: 0, boost: 1, starter: 2 };

export default async function AdminMerchantsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = one(params.q).trim();
  const corridor = one(params.corridor);
  const category = one(params.category);
  const tier = one(params.tier);
  const status = one(params.status);

  const corridors = listCorridors();
  const categories = listCategories();
  const planPrice = new Map(getPlans().map((plan) => [plan.tier, plan.priceCedis]));
  const corridorName = new Map(corridors.map((c) => [c.id, c.name]));
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);

  const merchants = allMerchants()
    .filter((merchant) => {
      if (corridor && merchant.corridorId !== (corridor as CorridorId)) return false;
      if (category && merchant.categoryId !== (category as CategoryId)) return false;
      if (tier && merchant.tier !== (tier as Tier)) return false;
      if (status && merchant.status !== (status as MerchantStatus)) return false;
      if (tokens.length) {
        const haystack =
          `${merchant.name} ${merchant.slug} ${merchant.landmark} ${merchant.ghanapost}`.toLowerCase();
        if (!tokens.every((token) => haystack.includes(token))) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      if (byStatus !== 0) return byStatus;
      const byTier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      if (byTier !== 0) return byTier;
      return a.name.localeCompare(b.name);
    })
    .map((merchant) => ({
      merchant,
      metrics: metricsFor(merchant.id, 30),
    }));

  const filtered = tokens.length > 0 || corridor !== "" || category !== "" || tier !== "" || status !== "";
  const pendingCount = merchants.filter((row) => row.merchant.status === "pending").length;
  const payingCount = merchants.filter((row) => row.merchant.tier !== "starter").length;

  return (
    <div className="space-y-5">
      <OpsHeader />

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">Merchants</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Every storefront Seen has onboarded across Osu and East Legon. Search by name, landmark
            or GhanaPostGPS address, then narrow by corridor, category, tier or verification state.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="outline">{merchants.length} shown</Badge>
          <Badge tone="gold">{pendingCount} pending</Badge>
          <Badge tone="sun">{payingCount} paying</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <form method="get" action="/admin/merchants" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Label htmlFor="merchant-search">Search</Label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
                  aria-hidden
                />
                <Input
                  id="merchant-search"
                  name="q"
                  type="search"
                  defaultValue={q}
                  placeholder="Kente & Koffee, Oxford Street, GA-585…"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="filter-corridor">Corridor</Label>
              <Select id="filter-corridor" name="corridor" defaultValue={corridor}>
                <option value="">All corridors</option>
                {corridors.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="filter-category">Category</Label>
              <Select id="filter-category" name="category" defaultValue={category}>
                <option value="">All categories</option>
                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="filter-tier">Tier</Label>
              <Select id="filter-tier" name="tier" defaultValue={tier}>
                <option value="">All tiers</option>
                <option value="starter">Starter</option>
                <option value="boost">Boost</option>
                <option value="billboard">Billboard</option>
              </Select>
            </div>
            <div className="lg:col-span-2">
              <Label htmlFor="filter-status">Status</Label>
              <Select id="filter-status" name="status" defaultValue={status}>
                <option value="">All statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="paused">Paused</option>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-12">
              <Button type="submit" size="sm">
                Apply filters
              </Button>
              <Link
                href="/admin/merchants"
                className="text-[13px] font-semibold text-ink-400 hover:text-ink-700"
              >
                Reset
              </Link>
              {filtered && (
                <span className="ml-auto text-[12px] text-ink-400">
                  {merchants.length} match{merchants.length === 1 ? "" : "es"}
                </span>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2 sm:p-4">
          {merchants.length === 0 ? (
            <EmptyState
              title="No storefronts match that search"
              detail="Try a shorter search term, or reset the corridor and status filters."
              action={
                <Link
                  href="/admin/merchants"
                  className="text-[13px] font-semibold text-sun-600 hover:text-sun-700"
                >
                  Show every merchant
                </Link>
              }
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Merchant</TH>
                  <TH>Corridor</TH>
                  <TH className="hidden md:table-cell">Category</TH>
                  <TH>Tier</TH>
                  <TH>Status</TH>
                  <TH className="hidden lg:table-cell">GhanaPostGPS</TH>
                  <TH className="text-right">30-day impressions</TH>
                  <TH className="text-right">Plan / month</TH>
                </TR>
              </THead>
              <TBody>
                {merchants.map(({ merchant, metrics }) => {
                  const price = planPrice.get(merchant.tier) ?? 0;
                  return (
                    <TR key={merchant.id}>
                      <TD>
                        <Link
                          href={`/admin/merchants/${merchant.id}`}
                          className="font-medium text-ink-900 hover:text-sun-600"
                        >
                          {merchant.name}
                        </Link>
                        <div className="font-mono text-[11px] text-ink-300">{merchant.slug}</div>
                      </TD>
                      <TD className="whitespace-nowrap text-[13px] text-ink-500">
                        {corridorName.get(merchant.corridorId)}
                      </TD>
                      <TD className="hidden whitespace-nowrap text-[13px] text-ink-500 md:table-cell">
                        {categoryName.get(merchant.categoryId)}
                      </TD>
                      <TD>
                        <TierBadge tier={merchant.tier} />
                      </TD>
                      <TD>
                        <MerchantStatusBadge status={merchant.status} />
                      </TD>
                      <TD className="hidden lg:table-cell">
                        <span className="metric font-mono text-[12px] text-ink-600">
                          {merchant.ghanapost}
                        </span>
                      </TD>
                      <TD className="metric text-right">{compact(metrics.impressions)}</TD>
                      <TD className="metric whitespace-nowrap text-right font-medium text-ink-900">
                        {merchant.tier === "starter" ? (
                          <span className="text-ink-300">Free</span>
                        ) : (
                          cedis(price)
                        )}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-ink-300">
        Rows sort pending first, then Billboard, Boost and Starter. 30-day impressions are aggregated
        from the analytics store per storefront.
      </p>
    </div>
  );
}
