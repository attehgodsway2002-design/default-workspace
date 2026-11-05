import Link from "next/link";
import { ArrowRight, Store, UserRound } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { supabaseConfigured } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Create an account" };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next) ?? "/discover";
  const authReady = supabaseConfigured();
  const production = process.env.NODE_ENV === "production";
  const businessReady = authReady && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      <main className="container max-w-4xl py-10 lg:py-16">
        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">Join Seen</p>
        <h1 className="mt-2 text-[32px] font-semibold leading-tight text-ink-900">Create your account</h1>
        <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-ink-600">
          Choose a personal account to discover local businesses, or apply to add your business to Seen.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-ink-900">
              <UserRound className="h-5 w-5 text-sun-600" />
              <h2 className="text-[17px] font-semibold">Personal account</h2>
            </div>
            <p className="mt-2 mb-5 text-[13px] leading-relaxed text-ink-500">
              Save your account and use Seen to find places, book services, and manage consent.
            </p>
            {authReady ? (
              <EmailAuthForm mode="signup" nextPath={nextPath} />
            ) : production ? (
              <p role="alert" className="rounded-xl bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-600">
                Account signup is unavailable until Supabase Auth is configured.
              </p>
            ) : (
              <form action="/api/auth/signin" method="post" className="space-y-3">
                <label htmlFor="signup-email" className="block text-[12px] font-semibold text-ink-700">
                  Email address
                </label>
                <input
                  id="signup-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  placeholder="you@example.com"
                  className="h-11 w-full rounded-xl border border-ink-200 px-3 text-[14px] outline-none focus:border-sun-500"
                />
                <input type="hidden" name="next" value={nextPath} />
                <button
                  type="submit"
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-sun-500 px-4 text-[13px] font-semibold text-white hover:bg-sun-600"
                >
                  Create preview account <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[11px] leading-relaxed text-ink-400">
                  {production
                    ? "Real account creation is unavailable until Supabase Auth is configured."
                    : "Local preview only: this creates a demo profile without email verification."}
                </p>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
            <div className="flex items-center gap-2 text-ink-900">
              <Store className="h-5 w-5 text-ink-700" />
              <h2 className="text-[17px] font-semibold">Business account</h2>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
              Apply for a business listing. Your storefront stays pending until it has been reviewed.
            </p>
            {businessReady ? (
              <div className="mt-5">
                <EmailAuthForm mode="signup" accountType="business" nextPath="/onboarding" />
              </div>
            ) : production ? (
              <p className="mt-5 rounded-xl bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-600">
                Business applications require Supabase Auth and the server-side database key to be configured.
              </p>
            ) : (
              <Link
                href="/onboarding"
                className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
              >
                Start business application <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </section>
        </div>

        <p className="mt-6 text-center text-[13px] text-ink-500">
          Already have an account?{" "}
          <Link href={`/signin?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-ink-900 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
