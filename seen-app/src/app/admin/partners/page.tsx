import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { listMiniApps } from "@/lib/db/queries";
import { cedis, longDate, pct } from "@/lib/format";
import { SCOPE_COPY } from "@/lib/mini-auth";
import type { MiniApp } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScopeChips } from "@/components/mini/scope-chips";
import { OpsHeader } from "@/components/admin/ops-header";
import { MiniStatusBadge } from "@/components/admin/status-badges";
import { TakeRateForm } from "@/components/admin/take-rate-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Partners" };

function takeCedis(app: MiniApp): number {
  return Math.round((app.monthlyGmvCedis * app.takeRateBps) / 10_000);
}

export default function AdminPartnersPage() {
  const apps = listMiniApps();
  const gmv = apps.reduce((sum, app) => sum + app.monthlyGmvCedis, 0);
  const take = apps.reduce((sum, app) => sum + takeCedis(app), 0);
  const transactions = apps.reduce((sum, app) => sum + app.monthlyTransactions, 0);

  return (
    <div className="space-y-5">
      <OpsHeader />

      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          Mini-app partners
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-500">
          Three partners run inside Seen on delegated identity. Seen takes a cut of GMV, never
          custody of funds — the partner settles on the existing mobile money rail.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
          <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
            Monthly GMV
          </div>
          <div className="metric mt-1 text-2xl font-semibold text-ink-900">{cedis(gmv)}</div>
          <div className="mt-1 text-xs text-ink-400">Across all three partners</div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card">
          <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
            Seen take
          </div>
          <div className="metric mt-1 text-2xl font-semibold text-ink-900">{cedis(take)}</div>
          <div className="mt-1 text-xs text-ink-400">
            Effective {pct(gmv ? take / gmv : 0)} of GMV
          </div>
        </div>
        <div className="col-span-2 rounded-2xl border border-ink-100 bg-white p-4 shadow-card lg:col-span-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
            Monthly transactions
          </div>
          <div className="metric mt-1 text-2xl font-semibold text-ink-900">
            {transactions.toLocaleString("en-GH")}
          </div>
          <div className="mt-1 text-xs text-ink-400">Bookings, tickets and bill payments</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {apps.map((app) => (
          <Card key={app.id} className="flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[15px] font-semibold text-white"
                    style={{ backgroundColor: app.accent }}
                    aria-hidden
                  >
                    {app.name.slice(0, 1)}
                  </span>
                  <div>
                    <CardTitle className="text-[13px] text-ink-900">{app.name}</CardTitle>
                    <div className="text-[12px] text-ink-400">{app.partner}</div>
                  </div>
                </div>
                <MiniStatusBadge status={app.status} />
              </div>
              <CardDescription className="pt-1">{app.blurb}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4">
              <div className="grid grid-cols-2 gap-2 text-[12px]">
                <div className="rounded-lg bg-ink-50/70 p-2.5">
                  <div className="font-semibold uppercase tracking-[0.07em] text-ink-400">
                    Monthly GMV
                  </div>
                  <div className="metric mt-0.5 text-sm font-semibold text-ink-900">
                    {cedis(app.monthlyGmvCedis)}
                  </div>
                </div>
                <div className="rounded-lg bg-ink-50/70 p-2.5">
                  <div className="font-semibold uppercase tracking-[0.07em] text-ink-400">
                    Transactions
                  </div>
                  <div className="metric mt-0.5 text-sm font-semibold text-ink-900">
                    {app.monthlyTransactions.toLocaleString("en-GH")}
                  </div>
                </div>
                <div className="rounded-lg bg-ink-50/70 p-2.5">
                  <div className="font-semibold uppercase tracking-[0.07em] text-ink-400">
                    Seen take
                  </div>
                  <div className="metric mt-0.5 text-sm font-semibold text-ink-900">
                    {cedis(takeCedis(app))}
                  </div>
                </div>
                <div className="rounded-lg bg-ink-50/70 p-2.5">
                  <div className="font-semibold uppercase tracking-[0.07em] text-ink-400">
                    Category
                  </div>
                  <div className="mt-0.5 text-sm font-semibold capitalize text-ink-900">
                    {app.category}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  Requested scopes
                </div>
                <ScopeChips scopes={app.scopes} scopeCopy={SCOPE_COPY} tone="outline" />
              </div>

              <div className="mt-auto space-y-2 border-t border-ink-50 pt-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-ink-400">Current take rate</span>
                  <span className="metric font-semibold text-ink-800">
                    {app.takeRateBps} bps · {pct(app.takeRateBps / 10_000)}
                  </span>
                </div>
                <TakeRateForm appId={app.id} appName={app.name} currentBps={app.takeRateBps} />
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[11px] text-ink-300">
                    {app.launchedAt ? `Live since ${longDate(app.launchedAt)}` : "Pilot — no launch date"}
                  </span>
                  <Link
                    href={`/mini/${app.slug}`}
                    className="inline-flex items-center gap-1 text-[12px] font-semibold text-sun-600 hover:text-sun-700"
                  >
                    Open in Seen
                    <ExternalLink className="h-3 w-3" aria-hidden />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Take-rate policy</CardTitle>
          <CardDescription>What we promised partners in the term sheet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-[13px] leading-relaxed text-ink-600">
          <p>
            Partners pay <strong className="text-ink-900">0% of GMV for the first six months</strong>{" "}
            while they prove volume inside Seen. After that the contracted band is{" "}
            <strong className="text-ink-900">5%–15% (500–1,500 bps)</strong>, set per partner against
            the opportunity Seen hands them.
          </p>
          <ul className="space-y-1.5">
            <li>
              <Badge tone="green">QuickBook</Badge>{" "}
              <span className="ml-1.5">
                bookings at 500 bps — 5% of appointment value, billed monthly on partner-reported GMV
                and reconciled against Paystack settlements.
              </span>
            </li>
            <li>
              <Badge tone="clay">Accra Live</Badge>{" "}
              <span className="ml-1.5">
                ticketing at 800 bps — payments are authorised in-app, so Seen keeps its cut before
                settling the remainder to the promoter.
              </span>
            </li>
            <li>
              <Badge tone="gold">Nexus Bills</Badge>{" "}
              <span className="ml-1.5">
                pilot at 150 bps, deliberately below the band while bill payments stay read-only and
                no customer funds move through Seen.
              </span>
            </li>
          </ul>
          <p className="text-[12px] text-ink-400">
            Changing a rate here updates the store immediately and applies to the next billing
            cycle; it does not rewrite invoices already issued. Rates above 15% need a commercial
            exception, not an ops change.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
