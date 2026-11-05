"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, LayoutDashboard, Store } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/merchant", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/merchant/storefront", label: "Storefront", icon: Store, exact: false },
  { href: "/merchant/billing", label: "Billing", icon: CreditCard, exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Merchant sections" className="space-y-1">
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-ink-900 text-white shadow-sm"
                : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Fixed bottom tab bar — the whole navigation on a 390 px phone. */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Merchant sections"
      className="no-print fixed inset-x-0 bottom-0 z-40 border-t border-ink-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="mx-auto grid max-w-md grid-cols-3">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(pathname, item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                active ? "text-sun-600" : "text-ink-400 hover:text-ink-700",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
