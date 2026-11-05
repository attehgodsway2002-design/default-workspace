import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/discover", label: "Discover" },
  { href: "/pricing", label: "For business" },
  { href: "/mini", label: "Mini-apps" },
];

export async function SiteHeader({ className }: { className?: string }) {
  const session = await getSession();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-ink-100/80 bg-[#FBFAF7]/90 backdrop-blur",
        className,
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-600 transition-colors hover:bg-ink-50 hover:text-ink-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/merchant"
            className="hidden rounded-lg px-3 py-2 text-[13.5px] font-medium text-ink-600 hover:text-ink-900 sm:block"
          >
            Merchant login
          </Link>
          {session ? (
            <Link
              href={homeFor(session)}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-ink-900 px-3.5 text-[13px] font-medium text-white hover:bg-ink-800"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#E0A526]" />
              {session.name.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex h-9 items-center rounded-xl bg-sun-500 px-3.5 text-[13px] font-semibold text-white shadow-sm hover:bg-sun-600"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
      <nav className="container flex gap-1 overflow-x-auto pb-2 md:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-600"
          >
            {item.label}
          </Link>
        ))}
        <Link
          href="/merchant"
          className="whitespace-nowrap rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[12.5px] font-medium text-ink-600"
        >
          Merchant login
        </Link>
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="container grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
            Seen is the discovery and paid-visibility layer for Ghana&apos;s local economy.
            Verified storefronts, GhanaPostGPS addresses and measured attention — Osu and
            East Legon first.
          </p>
          <p className="mt-4 text-xs text-ink-400">
            Preview data: businesses are fictional · checkout is simulated · no money moves
          </p>
        </div>
        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            Discover
          </div>
          <ul className="space-y-2 text-sm text-ink-600">
            <li><Link className="hover:text-ink-900" href="/discover?corridor=osu">Osu — Oxford Street</Link></li>
            <li><Link className="hover:text-ink-900" href="/discover?corridor=east-legon">East Legon</Link></li>
            <li><Link className="hover:text-ink-900" href="/discover?category=food">Cafés &amp; restaurants</Link></li>
            <li><Link className="hover:text-ink-900" href="/discover?category=beauty">Salons &amp; barbers</Link></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
            For business
          </div>
          <ul className="space-y-2 text-sm text-ink-600">
            <li><Link className="hover:text-ink-900" href="/pricing">Plans &amp; pricing</Link></li>
            <li><Link className="hover:text-ink-900" href="/merchant">Merchant dashboard</Link></li>
            <li><Link className="hover:text-ink-900" href="/mini">Seen App Store</Link></li>
            <li><Link className="hover:text-ink-900" href="/admin">Ops console</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-50">
        <div className="container flex flex-col gap-2 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Seen Technologies, Accra. GH₵ prices include all taxes.</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1E6B4F]" />
            Mobile money: MTN MoMo · Telecel Cash · AT Money
          </span>
        </div>
      </div>
    </footer>
  );
}
