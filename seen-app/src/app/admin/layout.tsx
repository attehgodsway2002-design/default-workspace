import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";
import { getSession } from "@/lib/auth";
import { Logo } from "@/components/brand/logo";
import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Ops console", template: "%s · Seen ops" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session || session.role !== "admin") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50/50 px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-ink-100 bg-white p-6 shadow-card">
          <Logo />
          <div className="mt-6 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.01em] text-ink-900">
            Operator access only
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
            The Seen ops console runs the business: verification, slot inventory and
            partner settlements. Sign in with an operator account to continue.
          </p>
          <div className="mt-5 rounded-xl border border-dashed border-ink-200 bg-ink-50/60 p-3.5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
              Demo admin
            </div>
            <div className="metric mt-1 font-mono text-sm text-ink-800">ops@seen.gh</div>
          </div>
          {session && session.role !== "admin" && (
            <p className="mt-3 text-[12px] text-ink-400">
              You are signed in as {session.email}, which is not an operator account.
            </p>
          )}
          <div className="mt-5 flex flex-col gap-2">
            <Link
              href="/signin?next=/admin"
              className={buttonClass({ variant: "primary", size: "md" })}
            >
              Sign in to the console
            </Link>
            <Link href="/" className={buttonClass({ variant: "ghost", size: "md" })}>
              Back to Seen
            </Link>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-300">
            This console is internal. Consumer and merchant accounts are redirected here and
            cannot read ops data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50/40">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col lg:flex-row">
        <aside className="border-b border-ink-100 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-5">
            <Logo />
            <Badge tone="ink">Ops</Badge>
          </div>
          <AdminNav />
          <div className="hidden border-t border-ink-100 px-5 py-4 lg:block">
            <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">
              Signed in
            </div>
            <div className="mt-1 text-sm font-semibold text-ink-800">{session.name}</div>
            <div className="text-[12px] text-ink-400">{session.email}</div>
            <Link
              href="/discover"
              className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sun-600 hover:text-sun-700"
            >
              View the public app
            </Link>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
