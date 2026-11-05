"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Blocks,
  LayoutDashboard,
  LayoutGrid,
  Store,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/merchants", label: "Merchants", icon: Store },
  { href: "/admin/slots", label: "Slot inventory", icon: LayoutGrid },
  { href: "/admin/partners", label: "Partners", icon: Blocks },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname() ?? "/admin";
  return (
    <nav
      aria-label="Ops console"
      className="flex gap-1 overflow-x-auto border-t border-ink-100 px-3 py-2 no-scrollbar lg:flex-col lg:gap-0.5 lg:border-t-0 lg:px-2 lg:py-1"
    >
      {ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "bg-ink-900 text-white"
                : "text-ink-500 hover:bg-ink-50 hover:text-ink-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
