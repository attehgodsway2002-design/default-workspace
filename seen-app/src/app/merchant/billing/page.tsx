import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CreditCard, Download, ReceiptText, ShieldCheck } from "lucide-react";
import { billingFor, getPlan, getPlans } from "@/lib/db/queries";
import { cedis, cedisExact, longDate } from "@/lib/format";
import { CHANNELS, paystackFeeCedis, paystackLive } from "@/lib/paystack";
import { Badge, TierBadge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { merchantContext } from "@/components/merchant/context";
import { CancelPlan, PlanPicker } from "@/components/merchant/plan-controls";
import {
  actionLink,
  channelLabel,
  invoiceStatusTone,
  planStatusLabel,
  planStatusTone,
} from "@/components/merchant/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Billing",
  description: "Your Seen plan, invoices and mobile-money payments.",
};

export default async function MerchantBillingPage() {
  const { merchant } = await merchantContext();
  const billing = billingFor(merchant.id);
  const plan = getPlan(merchant.tier);
  const subscription = billing.subscription;
  const isStarter = merchant.tier === "starter";
  const plans = getPlans().map((item) => ({
    tier: item.tier,
    name: item.name,
    priceCedis: item.priceCedis,
    feeCedis: paystackFeeCedis(item.priceCedis),
    popular: Boolean(item.popular),
    features: item.features,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink-900 sm:text-xl">Billing</h2>
        <p className="text-sm text-ink-500">
          Your plan, invoices and mobile-money payments. All amounts in Ghana cedis; Paystack&apos;s
          1.95% fee is absorbed by Seen.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle>Current plan</CardTitle>
              <div className="flex items-center gap-2">
                <TierBadge tier={merchant.tier} />
                {subscription ? (
                  <Badge tone={planStatusTone(subscription.status)}>
                    {planStatusLabel(subscription.status)}
                  </Badge>
                ) : (
                  <Badge tone="outline">Free</Badge>
                )}
              </div>
            </div>
            <CardDescription>
              {isStarter
                ? "Starter keeps your verified listing live for free. No card is stored and nothing renews."
                : `${plan.name} buys ranked placement in your category and corridor, plus the full performance dashboard.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="metric text-3xl font-semibold text-ink-900">
                    {cedis(plan.priceCedis)}
                  </span>
                  <span className="text-sm text-ink-400">
                    {plan.priceCedis > 0 ? "/month" : "forever"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-ink-400">
                  {plan.priceCedis > 0
                    ? `Billed monthly · ${cedisExact(plan.priceCedis)} charged per cycle`
                    : "A verified listing, map pin and GhanaPostGPS address"}
                </p>
              </div>
              {merchant.slotId && (
                <div className="rounded-xl bg-ink-50 px-3 py-2">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                    Slot
                  </div>
                  <div className="mt-0.5 font-mono text-[11px] text-ink-700">{merchant.slotId}</div>
                </div>
              )}
            </div>

            <dl className="mt-5 grid gap-x-6 gap-y-3 text-[13px] sm:grid-cols-2">
              <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2">
                <dt className="text-ink-400">Payment channel</dt>
                <dd className="font-medium text-ink-800">
                  {subscription ? billing.channelLabel : "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2">
                <dt className="text-ink-400">Next charge</dt>
                <dd className="font-medium text-ink-800">
                  {billing.nextChargeDate ? longDate(billing.nextChargeDate) : "No renewal"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2">
                <dt className="text-ink-400">Days left in period</dt>
                <dd className="metric font-medium text-ink-800">
                  {typeof billing.daysLeft === "number" ? `${billing.daysLeft} days` : "—"}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2">
                <dt className="text-ink-400">Plan started</dt>
                <dd className="font-medium text-ink-800">
                  {subscription ? longDate(subscription.startedAt) : "—"}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="#change-plan" className={actionLink("primary", "sm")}>
                <CreditCard className="h-3.5 w-3.5" aria-hidden />
                {isStarter ? "Upgrade plan" : "Change plan"}
              </Link>
              <Link href="/pricing" className={actionLink("outline", "sm")}>
                Compare tiers
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment summary</CardTitle>
            <CardDescription>Everything settled through Paystack.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-xl bg-ink-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                Lifetime paid
              </div>
              <div className="metric mt-0.5 text-xl font-semibold text-ink-900">
                {cedis(billing.lifetimePaid)}
              </div>
            </div>
            <div className="rounded-xl bg-ink-50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                Outstanding
              </div>
              <div className="metric mt-0.5 text-xl font-semibold text-ink-900">
                {cedis(billing.outstanding)}
              </div>
            </div>
            <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Mobile money via MTN MoMo, Telecel Cash and AT Money, or card. Paystack settles T+1.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle>Invoices</CardTitle>
            <Badge tone="neutral">{billing.invoices.length} total</Badge>
          </div>
          <CardDescription>
            Newest first. Every paid invoice has a printable receipt with its Paystack reference.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {billing.invoices.length > 0 ? (
            <Table className="min-w-[760px]">
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Description</TH>
                  <TH className="text-right">Amount</TH>
                  <TH>Channel</TH>
                  <TH>Status</TH>
                  <TH>Reference</TH>
                  <TH className="text-right">Receipt</TH>
                </TR>
              </THead>
              <TBody>
                {billing.invoices.map((invoice) => (
                  <TR key={invoice.id}>
                    <TD className="whitespace-nowrap text-[13px]">{longDate(invoice.issuedAt)}</TD>
                    <TD className="min-w-[220px] text-[13px]">{invoice.description}</TD>
                    <TD className="whitespace-nowrap text-right text-[13px] font-medium text-ink-900">
                      {cedis(invoice.amountCedis)}
                    </TD>
                    <TD className="whitespace-nowrap text-[13px]">
                      {channelLabel(invoice.channel)}
                    </TD>
                    <TD>
                      <Badge tone={invoiceStatusTone(invoice.status)}>
                        {invoice.status === "paid"
                          ? "Paid"
                          : invoice.status === "pending"
                            ? "Pending"
                            : "Failed"}
                      </Badge>
                    </TD>
                    <TD className="whitespace-nowrap font-mono text-[11px] text-ink-500">
                      {invoice.reference}
                    </TD>
                    <TD className="whitespace-nowrap text-right">
                      <Link
                        href={`/merchant/billing/receipt/${invoice.id}`}
                        className="inline-flex items-center gap-1 text-[12px] font-medium text-ink-700 hover:text-sun-600"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden />
                        Download receipt
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          ) : (
            <div className="flex flex-col items-start gap-2 rounded-xl bg-ink-50 p-4">
              <span className="flex items-center gap-2 text-sm font-medium text-ink-800">
                <ReceiptText className="h-4 w-4" aria-hidden />
                No invoices yet
              </span>
              <p className="text-[13px] leading-relaxed text-ink-500">
                Starter is free, so there is nothing to bill. Invoices appear here the first time
                you upgrade and pay with mobile money or card.
              </p>
              <Link href="#change-plan" className={`${actionLink("outline", "sm")} mt-1`}>
                See paid plans
              </Link>
            </div>
          )}
          <p className="mt-3 text-[11px] text-ink-400">
            Amounts are shown in cedis. Paystack charges are in pesewas; Seen absorbs the 1.95% fee
            so you are never surcharged.
          </p>
        </CardContent>
      </Card>

      <Card id="change-plan" className="scroll-mt-24">
        <CardHeader>
          <CardTitle>Change plan</CardTitle>
          <CardDescription>
            Pick a tier and a channel. Upgrades take effect as soon as payment is approved;
            switching to Starter cancels paid placement immediately.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlanPicker
            plans={plans}
            channels={CHANNELS}
            currentTier={merchant.tier}
            demo={!paystackLive()}
          />
        </CardContent>
      </Card>

      {!isStarter && (
        <Card id="cancel-plan" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Cancel subscription</CardTitle>
            <CardDescription>
              Your storefront drops to Starter and paid placement stops. Paid invoices stay on
              record here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CancelPlan planName={plan.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
