import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import type { MiniApp, MiniScope } from "@/lib/types";
import { SCOPE_COPY } from "@/lib/mini-auth";
import { Badge } from "@/components/ui/badge";
import { MiniStatusBadge } from "@/components/admin/status-badges";
import { ScopeChips } from "@/components/mini/scope-chips";

/**
 * The Seen container around every partner app: back-to-Seen bar, partner
 * badge, delegated identity chip and a always-visible session scope strip.
 */
export function ContainerChrome({
  app,
  scopes,
  linked,
  children,
}: {
  app: MiniApp;
  scopes: MiniScope[];
  linked: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ink-50/50 pb-12">
      <div className="mx-auto w-full max-w-3xl px-3 sm:px-4">
        <div className="flex items-center justify-between gap-2 py-3">
          <Link
            href="/mini"
            className="inline-flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-[13px] font-semibold text-ink-500 hover:text-ink-900"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Seen App Store
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1E6B4F]" aria-hidden />
            Identity by Seen
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card sm:rounded-3xl">
          <div className="h-1.5 w-full" style={{ backgroundColor: app.accent }} aria-hidden />
          <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-semibold text-white"
                style={{ backgroundColor: app.accent }}
                aria-hidden
              >
                {app.name.slice(0, 1)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-semibold tracking-[-0.01em] text-ink-900">
                    {app.name}
                  </h1>
                  <MiniStatusBadge status={app.status} />
                </div>
                <p className="mt-0.5 text-[12px] text-ink-400">{app.partner}</p>
              </div>
            </div>
            <Badge tone="outline" className="max-w-full truncate">
              {app.partner}
            </Badge>
          </div>

          <div className="border-y border-ink-100 bg-ink-50/70 px-4 py-2.5 sm:px-5">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Session scopes
              </span>
              <span className="text-[11px] text-ink-400">
                {linked ? "Granted by you · revocable any time" : "Requested when you connect"}
              </span>
            </div>
            <ScopeChips
              scopes={scopes}
              scopeCopy={SCOPE_COPY}
              tone={linked ? "green" : "outline"}
              className="mt-1.5"
            />
          </div>

          <div className="p-4 sm:p-5">{children}</div>
        </div>

        <p className="mt-4 px-1 text-center text-[11px] leading-relaxed text-ink-300">
          This app runs inside Seen. It never sees your mobile money PIN, your card details or your
          Seen password.
        </p>
      </div>
    </div>
  );
}
