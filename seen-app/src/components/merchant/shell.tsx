import Link from "next/link";
import { ArrowUpRight, BadgeCheck } from "lucide-react";
import type { Merchant } from "@/lib/types";
import { getCategory, getCorridor } from "@/lib/db/queries";
import { Logo } from "@/components/brand/logo";
import { Badge, TierBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SidebarNav, MobileTabBar } from "./nav";
import { actionLink } from "./ui";

/**
 * Merchant dashboard shell: persistent identity header, sidebar on desktop and
 * a bottom tab bar on mobile. The header is the same on every merchant page.
 */
export function MerchantShell({
  merchant,
  email,
  children,
}: {
  merchant: Merchant;
  email?: string;
  children: React.ReactNode;
}) {
  const corridor = getCorridor(merchant.corridorId);
  const category = getCategory(merchant.categoryId);
  const verified = merchant.status === "verified";
  const listingHref = `/business/${merchant.slug}`;

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl">
        <aside className="no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-ink-100 bg-white lg:flex">
          <div className="px-5 py-5">
            <Logo />
          </div>
          <div className="px-3">
            <SidebarNav />
          </div>
          <div className="mt-auto space-y-3 px-5 py-5">
            <Link
              href={listingHref}
              className="group block rounded-xl border border-ink-100 p-3 transition-colors hover:border-ink-200 hover:bg-ink-50"
            >
              <span className="flex items-center justify-between text-xs font-semibold text-ink-700">
                Public listing
                <ArrowUpRight className="h-3.5 w-3.5 text-ink-400 group-hover:text-ink-700" aria-hidden />
              </span>
              <span className="mt-1 block truncate text-[11px] text-ink-400">{listingHref}</span>
            </Link>
            {email && <p className="truncate text-[11px] text-ink-400">Signed in as {email}</p>}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="no-print sticky top-0 z-30 border-b border-ink-100 bg-white/95 backdrop-blur">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between gap-3 lg:hidden">
                <Logo />
                <Link
                  href={listingHref}
                  className={actionLink("outline", "sm")}
                  aria-label={`View the public listing for ${merchant.name}`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  Listing
                </Link>
              </div>

              <div className="mt-3 flex min-w-0 items-start justify-between gap-3 lg:mt-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                    <h1 className="min-w-0 truncate text-base font-semibold tracking-[-0.01em] text-ink-900 sm:text-xl">
                      {merchant.name}
                    </h1>
                    <TierBadge tier={merchant.tier} />
                    {verified ? (
                      <Badge tone="green">
                        <BadgeCheck className="h-3 w-3" aria-hidden />
                        Verified by Seen
                      </Badge>
                    ) : (
                      <Badge tone="gold">Verification pending</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-ink-400">
                    {corridor?.name ?? merchant.corridorId} · {category?.name ?? merchant.categoryId}
                  </p>
                </div>
                <Link
                  href={listingHref}
                  className={cn(actionLink("outline", "sm"), "hidden shrink-0 lg:inline-flex")}
                >
                  View public listing
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-28 pt-4 sm:px-6 sm:pt-6 lg:pb-10">
            {children}
          </main>
        </div>
      </div>
      <MobileTabBar />
    </div>
  );
}
