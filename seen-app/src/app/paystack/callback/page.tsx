import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { billingFor, getCorridor, getPlan } from "@/lib/db/queries";
import { cedisExact, longDate } from "@/lib/format";
import { paystackLive, verifyTransaction } from "@/lib/paystack";
import { Card, CardContent } from "@/components/ui/card";
import { actionLink, channelLabel } from "@/components/merchant/ui";
import { settlePayment, type SettleResult } from "@/components/merchant/payments";
import type { Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Payment status",
  description: "Confirm the result of your Seen subscription payment.",
};

function tierFromMetadata(metadata: Record<string, unknown> | undefined): Tier | null {
  const tier = metadata?.tier;
  return tier === "boost" || tier === "billboard" ? tier : null;
}

export default async function PaystackCallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string; demo?: string }>;
}) {
  const params = await searchParams;
  const reference = (params.reference ?? params.trxref ?? "").trim();
  const demoFlag = params.demo === "1";
  const live = paystackLive();
  const session = await getSession();
  const signedInMerchant = session?.role === "merchant";

  let settled: SettleResult | null = null;
  let failure: { title: string; message: string } | null = null;

  if (!reference) {
    failure = {
      title: "No payment reference",
      message:
        "This page needs the reference Paystack sent back with your payment. Open Billing to check your invoices.",
    };
  } else if (live) {
    const verified = await verifyTransaction(reference);
    if (!verified) {
      failure = {
        title: "We couldn't verify this payment",
        message:
          "Paystack didn't return a transaction for this reference. Nothing on your account has changed — wait a moment and try again, or check Billing.",
      };
    } else if (verified.status !== "success") {
      failure = {
        title: "Payment not completed",
        message: `Paystack reports this transaction as “${verified.status}”. You haven't been charged a completed payment, so no plan change was applied.`,
      };
    } else {
      const metadata = verified.metadata ?? {};
      const metadataMerchantId =
        typeof metadata.merchantId === "string" ? metadata.merchantId : undefined;
      const invoice = getDb().invoices.find((item) => item.reference === reference);
      if (!invoice) {
        failure = {
          title: "Payment received, but not reconciled",
          message:
            "Paystack confirmed the charge, but we couldn't match it to an invoice on this account. Keep this reference — our team reconciles it against your billing record and you won't be charged twice.",
        };
      } else if (metadataMerchantId && metadataMerchantId !== invoice.merchantId) {
        failure = {
          title: "Payment received, but not reconciled",
          message:
            "The Paystack metadata doesn't match this invoice's merchant. Nothing was changed automatically — keep the reference and check Billing.",
        };
      } else {
        const result = settlePayment({
          reference,
          tier: tierFromMetadata(metadata),
          amountCedis: verified.amountCedis,
          paidAt: verified.paidAt,
        });
        if (result.ok) {
          settled = result;
        } else {
          failure = {
            title: "Payment received, but not reconciled",
            message:
              "Paystack confirmed the charge, but the invoice amount didn't match the current plan price, so no plan change was applied. Keep this reference and check Billing.",
          };
        }
      }
    }
  } else if (!demoFlag) {
    failure = {
      title: "We couldn't verify this payment",
      message:
        "Paystack isn't configured on this deployment, so the accepted confirmation is Seen's own demo approval screen. Start a plan change from Billing to pay with mobile money.",
    };
  } else {
    const invoice = getDb().invoices.find((item) => item.reference === reference);
    if (!invoice) {
      failure = {
        title: "We couldn't find that payment",
        message:
          "No invoice matches this demo reference. It may have been from an earlier data reset — start a new payment from Billing.",
      };
    } else {
      const ownsInvoice =
        signedInMerchant &&
        (session?.merchantId ?? undefined) === invoice.merchantId;
      if (!ownsInvoice) {
        failure = {
          title: "Sign in to finish",
          message:
            "This payment belongs to a merchant account. Sign in with that merchant's email to complete the upgrade and see the receipt.",
        };
      } else {
        const result = settlePayment({
          reference,
          channel: invoice.channel,
          paidAt: invoice.paidAt,
        });
        if (result.ok) {
          settled = result;
        } else {
          failure = {
            title: "That payment couldn't be completed",
            message:
              "The invoice or plan price didn't reconcile. Start a new payment from Billing — you haven't been charged.",
          };
        }
      }
    }
  }

  if (settled?.merchant && settled.invoice && settled.tier) {
    const merchant = settled.merchant;
    const invoice = settled.invoice;
    const plan = getPlan(settled.tier);
    const billing = billingFor(merchant.id);
    const corridor = getCorridor(merchant.corridorId);
    return (
      <Card className="overflow-hidden">
        <div className="kente-strip h-1.5 w-full" aria-hidden />
        <CardContent className="p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E7F3EC] text-[#1E6B4F]">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1E6B4F]">
            Payment received
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-[-0.01em] text-ink-900">
            You&apos;re on {plan.name}
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-ink-500">
            {merchant.name} now has ranked placement in{" "}
            {corridor?.name ?? "your corridor"} and the full performance dashboard.
          </p>

          <div className="mt-5 rounded-2xl bg-ink-50 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[13px] text-ink-500">{plan.name} plan · month</span>
              <span className="metric text-xl font-semibold text-ink-900">
                {cedisExact(invoice.amountCedis)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-ink-400">
              Paid with {channelLabel(invoice.channel)}
              {invoice.paidAt ? ` on ${longDate(invoice.paidAt)}` : ""}
            </p>
          </div>

          <dl className="mt-4 grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2">
            <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2 sm:col-span-2">
              <dt className="text-ink-400">Reference</dt>
              <dd className="font-mono text-[11px] text-ink-800">{invoice.reference}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2">
              <dt className="text-ink-400">Next charge</dt>
              <dd className="font-medium text-ink-800">
                {billing.nextChargeDate ? longDate(billing.nextChargeDate) : "—"}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-2 border-b border-ink-50 pb-2">
              <dt className="text-ink-400">Days left</dt>
              <dd className="metric font-medium text-ink-800">
                {typeof billing.daysLeft === "number" ? `${billing.daysLeft} days` : "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-2">
            <Link href="/merchant/billing" className={`${actionLink("primary")} w-full`}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to billing
            </Link>
            <Link href={`/business/${merchant.slug}`} className={`${actionLink("outline")} w-full`}>
              View your listing
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
            <ReceiptText className="h-3.5 w-3.5" aria-hidden />
            The receipt is in Billing → Invoices, reference {invoice.reference}.
          </p>
        </CardContent>
      </Card>
    );
  }

  const message = failure ?? {
    title: "We couldn't complete this payment",
    message: "Nothing was changed on your account. Start a new payment from Billing.",
  };

  return (
    <Card className="overflow-hidden">
      <div className="kente-strip h-1.5 w-full" aria-hidden />
      <CardContent className="p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FBEAE5] text-[#A8442A]">
          <AlertCircle className="h-6 w-6" aria-hidden />
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-[-0.01em] text-ink-900">
          {message.title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{message.message}</p>
        {reference && (
          <p className="mt-3 rounded-xl bg-ink-50 p-3 text-center font-mono text-[11px] text-ink-500">
            Reference {reference}
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          {signedInMerchant ? (
            <Link href="/merchant/billing" className={`${actionLink("primary")} w-full`}>
              Back to billing and try again
            </Link>
          ) : (
            <Link
              href={`/signin?next=${encodeURIComponent("/merchant/billing")}`}
              className={`${actionLink("primary")} w-full`}
            >
              Sign in to try again
            </Link>
          )}
          <Link href="/pricing" className={`${actionLink("outline")} w-full`}>
            Compare plans
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-400">
          {live
            ? "Payments are verified directly with Paystack — Seen never marks a payment as successful without confirmation."
            : "Demo mode: no money was moved. Seen never marks a payment as successful without a matching invoice."}
        </p>
      </CardContent>
    </Card>
  );
}
