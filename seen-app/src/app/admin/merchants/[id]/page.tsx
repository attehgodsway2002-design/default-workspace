import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Star } from "lucide-react";
import {
  allSlots,
  billingFor,
  getCategory,
  getCorridor,
  getMerchantById,
  metricsFor,
} from "@/lib/db/queries";
import { cedis, compact, longDate, pct, relativeDays } from "@/lib/format";
import { prettyPhone } from "@/lib/ghana";
import type { Invoice } from "@/lib/types";
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
import { Funnel, TrendChart } from "@/components/charts";
import { OpsHeader } from "@/components/admin/ops-header";
import { EmptyState } from "@/components/admin/empty-state";
import { VerifyActions } from "@/components/admin/verify-actions";
import { MerchantStatusBadge } from "@/components/admin/status-badges";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const merchant = getMerchantById(id);
  return { title: merchant ? merchant.name : "Merchant" };
}

function InvoiceStatus({ status }: { status: Invoice["status"] }) {
  if (status === "paid") return <Badge tone="green">Paid</Badge>;
  if (status === "pending") return <Badge tone="gold">Pending</Badge>;
  return <Badge tone="clay">Failed</Badge>;
}

export default async function AdminMerchantPage({ params }: PageProps) {
  const { id } = await params;
  const merchant = getMerchantById(id);
  if (!merchant) notFound();

  const corridor = getCorridor(merchant.corridorId);
  const category = getCategory(merchant.categoryId);
  const metrics = metricsFor(merchant.id, 30);
  const sixtyDay = metricsFor(merchant.id, 60);
  const billing = billingFor(merchant.id);
  const slot = merchant.slotId ? allSlots().find((s) => s.id === merchant.slotId) : undefined;

  const intent = metrics.mapClicks + metrics.phoneClicks + metrics.directionRequests;
  const trend = sixtyDay.byDay.map((day) => ({
    day: day.day,
    value: day.impressions,
    secondary: day.views,
  }));

  return (
    <div className="space-y-5">
      <OpsHeader />

      <div>
        <Link
          href="/admin/merchants"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-400 hover:text-ink-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          All merchants
        </Link>
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">
                  {merchant.name}
                </h1>
                <TierBadge tier={merchant.tier} />
                <MerchantStatusBadge status={merchant.status} />
                {merchant.founding && <Badge tone="gold">Founding merchant</Badge>}
              </div>
              <p className="mt-1 font-mono text-[12px] text-ink-300">{merchant.slug}</p>
              <p className="mt-2 max-w-2xl text-sm text-ink-500">{merchant.tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#E0A526] text-[#E0A526]" aria-hidden />
                  <span className="metric font-semibold text-ink-800">
                    {merchant.rating.toFixed(1)}
                  </span>
                  <span className="text-ink-400">({merchant.reviewCount} reviews)</span>
                </span>
                <span>{corridor?.name ?? merchant.corridorId}</span>
                <span>{category?.name ?? merchant.categoryId}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-ink-300" aria-hidden />
                  <span className="metric font-mono text-[12px]">{merchant.ghanapost}</span>
                </span>
                <span>{prettyPhone(merchant.phone)}</span>
              </div>
              <div className="mt-2 text-[12px] text-ink-400">
                {merchant.landmark} · {merchant.hours} · price band{" "}
                {merchant.priceBand === 1 ? "Budget" : merchant.priceBand === 2 ? "Mid" : "Premium"}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
              <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-3.5 text-[12px]">
                <div className="font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Verification
                </div>
                <div className="mt-1 text-ink-700">
                  {merchant.verifiedAt
                    ? `Verified ${longDate(merchant.verifiedAt)}`
                    : "Awaiting Seen field verification"}
                </div>
                <div className="mt-2 font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Paid slot
                </div>
                <div className="mt-1 text-ink-700">
                  {slot
                    ? `${slot.tier === "billboard" ? "Billboard" : "Boost"} #${slot.position} · ${cedis(
                        slot.priceCedis,
                      )}/mo`
                    : "No paid slot — Starter listing"}
                </div>
                <div className="mt-2 font-semibold uppercase tracking-[0.08em] text-ink-400">
                  Onboarded
                </div>
                <div className="mt-1 text-ink-700">{relativeDays(merchant.createdAt)}</div>
              </div>
              {merchant.status === "pending" && (
                <div className="w-full rounded-xl border border-[#FBF1DA] bg-[#FBF1DA]/50 p-3.5 lg:max-w-xs">
                  <div className="text-[12px] font-semibold text-[#8a6314]">
                    Field verification required
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-500">
                    Confirm the storefront exists at this GhanaPostGPS address before approving.
                  </p>
                  <div className="mt-2.5">
                    <VerifyActions merchantId={merchant.id} merchantName={merchant.name} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat
          label="30-day impressions"
          value={compact(metrics.impressions)}
          hint="Feed, search and map placements"
        />
        <Stat
          label="Listing views"
          value={compact(metrics.views)}
          hint={`${pct(metrics.ctr)} of impressions`}
        />
        <Stat label="Map clicks" value={compact(metrics.mapClicks)} hint="Taps on the map pin" />
        <Stat
          label="Phone clicks"
          value={compact(metrics.phoneClicks)}
          hint="tel: taps from the listing"
        />
        <Stat
          label="Direction requests"
          value={compact(metrics.directionRequests)}
          hint="Handed off to Google Maps"
        />
        <Stat
          label="QR redemptions"
          value={compact(metrics.qrRedemptions)}
          hint="In-store scans of the Seen QR"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Impressions · 60 days</CardTitle>
            <CardDescription>
              Impressions against listing views. Intent rate {pct(metrics.intentRate)} over 30 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TrendChart data={trend} height={200} label="Impressions" secondaryLabel="Views" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Funnel · 30 days</CardTitle>
            <CardDescription>How discovery turns into a shop visit.</CardDescription>
          </CardHeader>
          <CardContent>
            <Funnel
              steps={[
                { label: "Impressions", value: metrics.impressions },
                { label: "Listing views", value: metrics.views },
                { label: "Intent actions", value: intent },
                { label: "QR redemptions", value: metrics.qrRedemptions },
              ]}
            />
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-ink-400">
              <span>
                Unique sessions{" "}
                <span className="metric font-semibold text-ink-700">
                  {compact(metrics.uniqueSessions)}
                </span>
              </span>
              <span>
                Views per impression{" "}
                <span className="metric font-semibold text-ink-700">{pct(metrics.ctr)}</span>
              </span>
              <span>
                Intent per view{" "}
                <span className="metric font-semibold text-ink-700">{pct(metrics.intentRate)}</span>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <CardTitle>Billing summary</CardTitle>
            <CardDescription>Subscription state from the billing store.</CardDescription>
          </CardHeader>
          <CardContent>
            {billing.subscription ? (
              <dl className="space-y-2.5 text-[13px]">
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-ink-400">Plan</dt>
                  <dd>
                    <TierBadge tier={billing.subscription.tier} />
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-ink-400">Status</dt>
                  <dd className="font-medium capitalize text-ink-800">
                    {billing.subscription.status.replace("_", " ")}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-ink-400">Monthly charge</dt>
                  <dd className="metric font-semibold text-ink-900">
                    {cedis(billing.subscription.amountCedis)}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-ink-400">Channel</dt>
                  <dd className="text-ink-700">{billing.channelLabel}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-ink-400">Next charge</dt>
                  <dd className="text-ink-700">
                    {billing.nextChargeDate ? longDate(billing.nextChargeDate) : "—"}
                    {typeof billing.daysLeft === "number" && (
                      <span className="text-ink-400"> · {billing.daysLeft}d</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-2 border-t border-ink-50 pt-2.5">
                  <dt className="text-ink-400">Lifetime paid</dt>
                  <dd className="metric font-semibold text-ink-900">{cedis(billing.lifetimePaid)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <dt className="text-ink-400">Outstanding</dt>
                  <dd className="metric font-semibold text-[#A8442A]">
                    {cedis(billing.outstanding)}
                  </dd>
                </div>
              </dl>
            ) : (
              <EmptyState
                title="No paid plan"
                detail="This storefront is on the free Starter tier. The sales team pitches Boost (GH₵99) or Billboard (GH₵249) in the corridor."
              />
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>
              {billing.invoices.length === 0
                ? "No invoices — Starter listings are not billed."
                : `${billing.invoices.length} invoices on record for this merchant.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {billing.invoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                detail="An invoice is raised the moment this merchant takes a paid slot. Starter storefronts stay at GH₵0."
              />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Issued</TH>
                    <TH>Description</TH>
                    <TH className="text-right">Amount</TH>
                    <TH>Status</TH>
                    <TH>Reference</TH>
                    <TH className="hidden md:table-cell">Channel</TH>
                  </TR>
                </THead>
                <TBody>
                  {billing.invoices.map((invoice) => (
                    <TR key={invoice.id}>
                      <TD className="whitespace-nowrap text-[13px]">
                        {longDate(invoice.issuedAt)}
                      </TD>
                      <TD className="text-[13px]">{invoice.description}</TD>
                      <TD className="metric text-right font-medium text-ink-900">
                        {cedis(invoice.amountCedis)}
                      </TD>
                      <TD>
                        <InvoiceStatus status={invoice.status} />
                      </TD>
                      <TD className="font-mono text-[11px] text-ink-400">{invoice.reference}</TD>
                      <TD className="hidden text-[13px] text-ink-500 md:table-cell">
                        {invoice.channel ?? "—"}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-ink-300">
        Metrics aggregate the seeded analytics store and any live events for this storefront. Slot
        pricing reflects the corridor ladder, not a per-merchant discount.
      </p>
    </div>
  );
}
