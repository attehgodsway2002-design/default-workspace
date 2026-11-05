import type { Metadata } from "next";
import { getCategory, getCorridor, getDemoMerchant } from "@/lib/db/queries";
import { merchantContext } from "@/components/merchant/context";
import { StorefrontEditor } from "@/components/merchant/storefront-editor";
import { actionLink } from "@/components/merchant/ui";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Storefront",
  description: "Edit the listing shoppers see in the Seen feed, search and on your public page.",
};

export default async function MerchantStorefrontPage() {
  const { merchant } = await merchantContext();
  const category = getCategory(merchant.categoryId);
  const corridor = getCorridor(merchant.corridorId);
  const demo = getDemoMerchant();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink-900 sm:text-xl">
            Storefront
          </h2>
          <p className="mt-0.5 text-sm text-ink-500">
            This is the listing shoppers see in search, the feed and on your public page.
          </p>
        </div>
        <Link href={`/business/${merchant.slug}`} className={actionLink("outline", "sm")}>
          View public listing
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>

      <StorefrontEditor
        merchant={merchant}
        categoryName={category?.name ?? "Business"}
        corridorName={corridor?.name ?? "Accra"}
        isDemoMerchant={merchant.id === demo.id}
      />

      <p className="flex items-start gap-1.5 pb-2 text-[11px] leading-relaxed text-ink-400">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Changes go live immediately and are visible on your public listing. Your GhanaPostGPS
        address is verified by Seen&apos;s field team and is read-only here.
      </p>
    </div>
  );
}
