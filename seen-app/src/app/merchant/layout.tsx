import type { Metadata } from "next";
import { getSession } from "@/lib/auth";
import { getDemoMerchant, getMerchantById } from "@/lib/db/queries";
import { MerchantGate } from "@/components/merchant/gate";
import { MerchantShell } from "@/components/merchant/shell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Merchant",
  description:
    "Seen merchant console — the impressions, intent actions and QR redemptions your paid visibility buys, plus storefront and billing.",
};

export default async function MerchantLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "merchant") {
    return <MerchantGate next="/merchant" />;
  }

  const merchant =
    (session.merchantId ? getMerchantById(session.merchantId) : undefined) ?? getDemoMerchant();

  return (
    <MerchantShell merchant={merchant} email={session.email}>
      {children}
    </MerchantShell>
  );
}
