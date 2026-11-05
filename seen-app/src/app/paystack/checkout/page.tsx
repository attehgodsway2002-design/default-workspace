import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft, ReceiptText } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getDemoMerchant, getMerchantById } from "@/lib/db/queries";
import { cedisExact } from "@/lib/format";
import { paystackFeeCedis, paystackLive } from "@/lib/paystack";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutApproval } from "@/components/merchant/checkout-approval";
import { actionLink } from "@/components/merchant/ui";
import { tierForInvoice } from "@/components/merchant/payments";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Approve your Seen subscription payment with mobile money.",
};

function parseMeta(raw?: string): { merchantId?: string; tier?: string } {
  if (!raw) return {};
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object") return {};
    const record = value as Record<string, unknown>;
    return {
      merchantId: typeof record.merchantId === "string" ? record.merchantId : undefined,
      tier: typeof record.tier === "string" ? record.tier : undefined,
    };
  } catch {
    return {};
  }
}

function StatusCard({
  tone = "clay",
  title,
  message,
  children,
}: {
  tone?: "clay" | "gold";
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="kente-strip h-1.5 w-full" aria-hidden />
      <CardContent className="p-6">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-full ${
            tone === "gold" ? "bg-[#FBF1DA] text-[#8a6314]" : "bg-[#FBEAE5] text-[#A8442A]"
          }`}
        >
          <AlertTriangle className="h-5 w-5" aria-hidden />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-ink-900">{title}</h1>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{message}</p>
        <div className="mt-5 flex flex-col gap-2">
          {children ?? (
            <>
              <Link href="/merchant/billing" className={`${actionLink("primary")} w-full`}>
                Back to billing
              </Link>
              <Link href="/pricing" className={`${actionLink("outline")} w-full`}>
                Compare plans
              </Link>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function PaystackCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; email?: string; amount?: string; meta?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const params = await searchParams;
  const reference = (params.reference ?? "").trim();
  const meta = parseMeta(params.meta);

  if (paystackLive()) {
    return (
      <StatusCard
        title="Paystack is live on this deployment"
        message={
          reference
            ? "Seen's demo approval screen is only used when Paystack keys are absent. Payments run on Paystack's own checkout — you can check the status of this reference below."
            : "Seen's demo approval screen is only used when Paystack keys are absent. Start a plan change from Billing to be redirected to Paystack."
        }
      >
        {reference ? (
          <Link
            href={`/paystack/callback?reference=${encodeURIComponent(reference)}`}
            className={`${actionLink("primary")} w-full`}
          >
            Check payment status
          </Link>
        ) : (
          <Link href="/merchant/billing" className={`${actionLink("primary")} w-full`}>
            Go to billing
          </Link>
        )}
        <Link href="/pricing" className={`${actionLink("outline")} w-full`}>
          Compare plans
        </Link>
      </StatusCard>
    );
  }

  if (!reference) {
    return (
      <StatusCard
        title="No payment reference"
        message="This checkout link is missing its reference — it may have been truncated. Start the payment again from Billing."
      />
    );
  }

  const invoice = getDb().invoices.find((item) => item.reference === reference);
  if (!invoice) {
    return (
      <StatusCard
        title="We couldn't find that payment"
        message="No invoice matches this reference. Payment links expire when a new checkout starts, so start again from Billing to get a fresh one."
      >
        <p className="rounded-xl bg-ink-50 p-3 text-center font-mono text-[11px] text-ink-500">
          {reference}
        </p>
        <Link href="/merchant/billing" className={`${actionLink("primary")} w-full`}>
          Back to billing
        </Link>
        <Link href="/pricing" className={`${actionLink("outline")} w-full`}>
          Compare plans
        </Link>
      </StatusCard>
    );
  }

  const session = await getSession();
  const sessionMerchantId =
    (session?.role === "merchant" ? session.merchantId : undefined) ?? getDemoMerchant()?.id;
  const merchant = getMerchantById(invoice.merchantId);
  if (!session || session.role !== "merchant" || !sessionMerchantId || invoice.merchantId !== sessionMerchantId) {
    return (
      <StatusCard
        tone="gold"
        title="Sign in to approve this payment"
        message="This payment reference belongs to a merchant account. Sign in with that merchant's email to approve it."
      >
        <Link
          href={`/signin?next=${encodeURIComponent("/merchant/billing")}`}
          className={`${actionLink("primary")} w-full`}
        >
          Sign in as a merchant
        </Link>
        <Link href="/discover" className={`${actionLink("outline")} w-full`}>
          Browse Seen instead
        </Link>
      </StatusCard>
    );
  }

  if (meta.merchantId && meta.merchantId !== invoice.merchantId) {
    return (
      <StatusCard
        title="This link doesn't match your invoice"
        message="The merchant on this payment link isn't the merchant this invoice belongs to. Start again from Billing."
      />
    );
  }

  const tier = tierForInvoice(invoice);
  if (!tier || !merchant) {
    return (
      <StatusCard
        title="We couldn't match this invoice to a plan"
        message="The invoice amount doesn't match a current Seen plan price. Start a new payment from Billing."
      />
    );
  }

  if (invoice.status === "paid") {
    return (
      <StatusCard
        title="This payment has already been approved"
        message={`${cedisExact(invoice.amountCedis)} for ${merchant.name} was already settled on reference ${invoice.reference}. Nothing more is due on this link.`}
      >
        <Link
          href={`/paystack/callback?reference=${encodeURIComponent(invoice.reference)}&demo=1`}
          className={`${actionLink("primary")} w-full`}
        >
          <ReceiptText className="h-4 w-4" aria-hidden />
          View the receipt
        </Link>
        <Link href="/merchant/billing" className={`${actionLink("outline")} w-full`}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back to billing
        </Link>
      </StatusCard>
    );
  }

  if (invoice.status !== "pending") {
    return (
      <StatusCard
        title="This invoice can't be paid"
        message="The invoice is marked failed or void. Start a fresh payment from Billing — you won't be charged twice."
        children={
          <Link href="/merchant/billing" className={`${actionLink("primary")} w-full`}>
            Back to billing
          </Link>
        }
      />
    );
  }

  const planName =
    tier === "billboard" ? "Billboard" : tier === "boost" ? "Boost" : "Starter";
  const emailParam = (params.email ?? "").trim();
  const displayEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailParam) ? emailParam : merchant.email;
  const digits = merchant.phone.replace(/\D/g, "");
  const phoneLast4 = digits.slice(-4) || "0000";

  return (
    <CheckoutApproval
      reference={invoice.reference}
      merchantId={merchant.id}
      merchantName={merchant.name}
      phoneLast4={phoneLast4}
      planName={planName}
      tier={tier}
      amountCedis={invoice.amountCedis}
      feeCedis={paystackFeeCedis(invoice.amountCedis)}
      email={displayEmail}
      channels={[
        { id: "mtn-momo", label: "MTN MoMo", note: "Most used in Accra" },
        { id: "telecel-cash", label: "Telecel Cash", note: "Formerly Vodafone Cash" },
        { id: "at-money", label: "AT Money", note: "AirtelTigo" },
        { id: "card", label: "Visa / Mastercard", note: "1.95% flat, settled T+1" },
      ]}
      defaultChannel={invoice.channel ?? "mtn-momo"}
      backHref="/merchant/billing"
    />
  );
}
