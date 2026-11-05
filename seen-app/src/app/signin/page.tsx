import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { getSession, homeFor, safeNextPath } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { supabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

const ROLE_COPY: Record<string, { label: string; blurb: string }> = {
  consumer: { label: "Consumer", blurb: "Discover, book and pay inside Seen" },
  merchant: { label: "Merchant", blurb: "Open your performance dashboard and billing" },
  admin: { label: "Ops", blurb: "Corridor ops, verification and partner management" },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await getSession();
  const params = await searchParams;
  if (session) {
    if (process.env.NODE_ENV === "production") redirect("/auth/complete");
    redirect(safeNextPath(params.next) ?? homeFor(session));
  }

  const authReady = supabaseConfigured();
  if (authReady || process.env.NODE_ENV === "production") {
    const nextPath = safeNextPath(params.next) ?? "/discover";
    const setupError = {
      auth_not_configured: "Email sign-in is not configured for this deployment.",
      missing_code: "The email link is incomplete. Request a new sign-in link.",
      verification_failed: "That email link could not be verified. Request a new one.",
      session_missing: "Your session could not be confirmed. Please sign in again.",
    }[params.error ?? ""];

    return (
      <div className="min-h-screen bg-[#FBFAF7]">
        <SiteHeader />
        <main className="container max-w-lg py-12 lg:py-16">
          <div className="mb-6">
            <Logo />
            <h1 className="mt-5 text-[30px] font-semibold text-ink-900">Sign in to Seen</h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              We’ll email you a secure, one-time sign-in link.
            </p>
          </div>
          {authReady ? (
            <EmailAuthForm mode="signin" nextPath={nextPath} />
          ) : (
            <div role="alert" className="rounded-2xl border border-ink-100 bg-white p-5 text-sm text-ink-600">
              {setupError ?? "Real sign-in is unavailable until Supabase Auth is configured."}
            </div>
          )}
          {setupError && <p role="alert" className="mt-3 text-sm text-red-700">{setupError}</p>}
          <p className="mt-5 text-center text-sm text-ink-500">
            New to Seen?{" "}
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink-900 underline underline-offset-2">
              Create an account
            </Link>
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const users = getDb().users.filter((u) => ["u-ama", "u-kofi", "u-ops"].includes(u.id));
  const next = params.next ?? "";

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      <div className="container grid max-w-5xl gap-8 py-10 lg:grid-cols-[1fr_1fr] lg:py-16">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500 ring-1 ring-ink-100">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1E6B4F]" /> Demo environment
          </div>
          <h1 className="mt-4 text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink-900">
            Sign in to Seen
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-600">
            This local preview uses sample accounts and demo data. Continue with any email to try
            a consumer profile, or apply to add a business listing.
          </p>

          <div className="mt-6 space-y-2.5">
            {users.map((user) => {
              const copy = ROLE_COPY[user.role] ?? ROLE_COPY.consumer!;
              return (
                <form key={user.id} action="/api/auth/signin" method="post">
                  <input type="hidden" name="email" value={user.email} />
                  <input type="hidden" name="next" value={next} />
                  <button
                    type="submit"
                    className="group flex w-full items-center gap-3 rounded-2xl border border-ink-100 bg-white p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-[13px] font-semibold text-white">
                      {user.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-[14px] font-semibold text-ink-900">{user.name}</span>
                        <Badge tone={user.role === "admin" ? "clay" : user.role === "merchant" ? "sun" : "outline"}>
                          {copy.label}
                        </Badge>
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-400">
                        {user.email} · {copy.blurb}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </form>
              );
            })}
          </div>

          <form action="/api/auth/signin" method="post" className="mt-6 rounded-2xl border border-ink-100 bg-white p-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Or continue with any email
            </label>
            <div className="mt-2 flex gap-2">
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.gh"
                className="h-10 flex-1 rounded-xl border border-ink-200 px-3 text-[13px] outline-none focus:border-sun-400"
              />
              <input type="hidden" name="next" value={next} />
              <button
                type="submit"
                className="h-10 rounded-xl bg-sun-500 px-4 text-[13px] font-semibold text-white hover:bg-sun-600"
              >
                Continue
              </button>
            </div>
            <p className="mt-2 text-[11px] text-ink-400">
              In this preview, an unknown email creates a sample consumer profile.
            </p>
            <Link
              href={`/signup?next=${encodeURIComponent(safeNextPath(next) ?? "/discover")}`}
              className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-700 hover:text-ink-900"
            >
              Create an account <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/onboarding"
              className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-700 hover:text-ink-900"
            >
              Create a business listing <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </form>
        </div>

        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
          <Logo />
          <h2 className="mt-5 text-[16px] font-semibold text-ink-900">What each account sees</h2>
          <ul className="mt-3 space-y-3 text-[12.5px] leading-relaxed text-ink-600">
            <li>
              <strong className="text-ink-900">Ama (consumer).</strong> Discovery, a listing page with
              the 360° tour, consent screens inside QuickBook and Accra Live, and her booking history.
            </li>
            <li>
              <strong className="text-ink-900">Kofi (merchant).</strong> Kente &amp; Koffee in Osu on
              the Billboard tier: impressions, intent actions, QR redemptions, invoices and the
              Paystack upgrade flow.
            </li>
            <li>
              <strong className="text-ink-900">Nana (ops).</strong> The console that runs the corridor:
              MRR, occupancy, the verification queue and partner take-rates.
            </li>
          </ul>
          <div className="mt-5 rounded-xl bg-ink-50 p-3 text-[11.5px] leading-relaxed text-ink-500">
            Sessions are signed HMAC cookies (7 days). Nothing is shared with partners without an
            explicit, revocable consent grant.
          </div>
          <div className="mt-4 flex flex-col gap-2 text-[12px]">
            <Link href="/discover" className="text-ink-600 hover:text-ink-900">
              Browse without signing in →
            </Link>
            <Link href="/merchant" className="text-ink-600 hover:text-ink-900">
              Merchant dashboard →
            </Link>
            <Link href="/admin" className="text-ink-600 hover:text-ink-900">
              Ops console →
            </Link>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
