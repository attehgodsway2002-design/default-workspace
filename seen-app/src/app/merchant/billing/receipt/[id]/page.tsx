import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, BadgeCheck } from "lucide-react";
import { getDb } from "@/lib/db";
import { getPlan, getPlans } from "@/lib/db/queries";
import { cedis, cedisExact, longDate } from "@/lib/format";
import { paystackFeeCedis } from "@/lib/paystack";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { merchantContext } from "@/components/merchant/context";
import { PrintReceiptButton } from "@/components/merchant/receipt-actions";
import { actionLink, channelLabel, invoiceStatusTone } from "@/components/merchant/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Receipt",
  description: "A printable Seen subscription receipt.",
};

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { merchant } = await merchantContext();
  const invoice = getDb().invoices.find(
    (item) => item.id === id && item.merchantId === merchant.id,
  );
  if (!invoice) notFound();

  const plan =
    getPlans().find((item) => item.tier !== "starter" && item.priceCedis === invoice.amountCedis) ??
    getPlan(merchant.tier);
  const fee = paystackFeeCedis(invoice.amountCedis);
  const paid = invoice.status === "paid";

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link href="/merchant/billing" className={actionLink("ghost", "sm")}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Back to billing
        </Link>
        <PrintReceiptButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card print:rounded-none print:border-0 print:shadow-none">
        <div className="kente-strip h-1.5 w-full print:hidden" aria-hidden />
        <div className="p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Logo />
              <p className="mt-3 text-[11px] leading-relaxed text-ink-400">
                Seen — local discovery and paid visibility
                <br />
                Accra, Ghana · seen.gh
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                {paid ? "Payment receipt" : "Invoice"}
              </p>
              <p className="metric mt-1 font-mono text-sm font-semibold text-ink-900">
                {invoice.reference}
              </p>
              <div className="mt-2 flex justify-end">
                <Badge tone={invoiceStatusTone(invoice.status)}>
                  {paid ? "Paid" : invoice.status === "pending" ? "Pending" : "Failed"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 border-t border-ink-100 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Billed to
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-900">{merchant.name}</p>
              <p className="text-[12px] text-ink-500">{merchant.email}</p>
              <p className="text-[12px] text-ink-500">{merchant.phone}</p>
              <p className="text-[12px] font-mono text-ink-500">{merchant.ghanapost}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Issued
              </p>
              <p className="mt-1 text-[13px] text-ink-800">{longDate(invoice.issuedAt)}</p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                {paid ? "Paid" : "Payment due"}
              </p>
              <p className="text-[13px] text-ink-800">
                {invoice.paidAt ? longDate(invoice.paidAt) : "Not paid yet"}
              </p>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Channel
              </p>
              <p className="text-[13px] text-ink-800">{channelLabel(invoice.channel)}</p>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="px-1 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                    Description
                  </th>
                  <th className="px-1 py-2 text-right text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-1 py-3 text-[13px] text-ink-700">{invoice.description}</td>
                  <td className="metric px-1 py-3 text-right text-[13px] font-medium text-ink-900">
                    {cedisExact(invoice.amountCedis)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-ink-100">
                  <td className="px-1 py-3 text-[13px] font-semibold text-ink-900">
                    {paid ? "Total paid" : "Total due"}
                  </td>
                  <td className="metric px-1 py-3 text-right text-base font-semibold text-ink-900">
                    {cedisExact(invoice.amountCedis)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-5 rounded-xl bg-ink-50 p-4 text-[11px] leading-relaxed text-ink-500">
            <p>
              Card and mobile-money payments are processed by Paystack. Paystack&apos;s 1.95% fee
              on this invoice is {cedisExact(fee)}, absorbed by Seen — the amount above is exactly
              what was charged.
            </p>
            <p className="mt-2">
              {paid
                ? `This receipt covers the ${plan.name} plan for ${merchant.name}. Keep it for your records; VAT and company details are sent with the monthly statement.`
                : "This invoice is not paid yet. Open Billing and start a new mobile-money payment to settle it."}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <BadgeCheck className="h-3.5 w-3.5 text-[#1E6B4F]" aria-hidden />
              Verified Seen merchant
            </span>
            <span>Invoice {invoice.id}</span>
          </div>
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-2 pb-2">
        <Link href="/merchant/billing" className={actionLink("outline", "sm")}>
          Back to billing
        </Link>
        <Link href={`/business/${merchant.slug}`} className={actionLink("ghost", "sm")}>
          View your listing
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <span className="ml-auto self-center text-[11px] text-ink-400">
          Amount {cedis(invoice.amountCedis)} · {paid ? "settled" : "pending"}
        </span>
      </div>
    </div>
  );
}
