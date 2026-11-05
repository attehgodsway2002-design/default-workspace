import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, MapPin, Sparkles, Timer } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { OnboardingForm } from "@/components/consumer/onboarding-form";
import { getSession } from "@/lib/auth";
import { listCategories } from "@/lib/db/public";
import { getDb } from "@/lib/db";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Claim your listing",
  description:
    "Apply for a verified Seen listing in Osu or East Legon. Free Starter listing, GH₵99 Boost, GH₵249 Billboard.",
};

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; submitted?: string }>;
}) {
  const params = await searchParams;
  const production = process.env.NODE_ENV === "production";
  const plan =
    params.plan === "boost" || params.plan === "billboard" ? params.plan : "starter";
  let categories: { id: string; name: string }[];
  let corridors: { id: string; name: string }[];
  let foundingTaken = 0;

  if (production) {
    const session = await getSession();
    if (!session) redirect("/signup?account=business&next=%2Fonboarding");

    if (params.submitted === "1") {
      return (
        <div className="min-h-screen bg-[#FBFAF7]">
          <SiteHeader />
          <main className="container max-w-xl py-16">
            <section className="rounded-2xl border border-ink-100 bg-white p-7 shadow-card">
              <CheckCircle2 className="h-8 w-8 text-[#1E6B4F]" />
              <h1 className="mt-4 text-2xl font-semibold text-ink-900">Application received</h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-600">
                Your business application is pending review. We’ll contact you using the details you provided.
              </p>
              <Link href="/" className="mt-6 inline-flex text-sm font-semibold text-ink-900 underline underline-offset-2">
                Return to Seen
              </Link>
            </section>
          </main>
          <SiteFooter />
        </div>
      );
    }

    const admin = createSupabaseAdminClient();
    if (!admin) {
      return (
        <div className="min-h-screen bg-[#FBFAF7]">
          <SiteHeader />
          <main className="container max-w-xl py-16">
            <h1 className="text-2xl font-semibold text-ink-900">Business applications are unavailable</h1>
            <p className="mt-3 text-sm text-ink-600">The production database is not configured.</p>
          </main>
          <SiteFooter />
        </div>
      );
    }

    const { data: categoryRows, error: categoryError } = await admin
      .from("categories")
      .select("id, name")
      .order("name");
    if (categoryError || !categoryRows?.length) {
      return (
        <div className="min-h-screen bg-[#FBFAF7]">
          <SiteHeader />
          <main className="container max-w-xl py-16">
            <h1 className="text-2xl font-semibold text-ink-900">Business applications are unavailable</h1>
            <p className="mt-3 text-sm text-ink-600">Business categories haven’t been configured yet.</p>
          </main>
          <SiteFooter />
        </div>
      );
    }
    categories = categoryRows;

    const { data: corridorRows, error: corridorError } = await admin
      .from("corridors")
      .select("id, name")
      .eq("live", true)
      .order("name");
    if (corridorError || !corridorRows?.length) {
      return (
        <div className="min-h-screen bg-[#FBFAF7]">
          <SiteHeader />
          <main className="container max-w-xl py-16">
            <h1 className="text-2xl font-semibold text-ink-900">Business applications are unavailable</h1>
            <p className="mt-3 text-sm text-ink-600">Launch areas haven’t been configured yet.</p>
          </main>
          <SiteFooter />
        </div>
      );
    }
    corridors = corridorRows;

    const { count } = await admin
      .from("merchants")
      .select("id", { count: "exact", head: true })
      .eq("founding", true);
    foundingTaken = count ?? 0;
  } else {
    categories = listCategories();
    const db = getDb();
    corridors = db.corridors.filter((corridor) => corridor.live);
    foundingTaken = db.merchants.filter((m) => m.founding).length;
  }

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      <div className="container grid gap-8 py-10 lg:grid-cols-[1fr_1.1fr] lg:py-14">
        <div>
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 hover:text-ink-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
          </Link>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500 ring-1 ring-ink-100">
            <Sparkles className="h-3.5 w-3.5 text-sun-500" /> Founding Merchant · Osu &amp; East Legon
          </div>
          <h1 className="mt-3 text-[32px] font-semibold leading-[1.1] tracking-[-0.02em] text-ink-900">
            Get verified. Get found.
          </h1>
          <p className="mt-3 max-w-md text-[14px] leading-relaxed text-ink-600">
            Tell us about the business, drop your GhanaPostGPS address, and pick a placement. A Seen
            rep visits within 5 working days, verifies the point, photographs the room and turns the
            listing on.
          </p>

          <ul className="mt-6 space-y-3">
            {[
              ["First month free", "Every Founding Merchant starts free for 30 days, then pays only if the dashboard earns it."],
              ["Price locked for 24 months", "GH₵99 Boost and GH₵249 Billboard held against future price rises."],
              ["A verified 360° tour", "We shoot and publish it — merchants do not need a photographer or a website."],
              ["Numbers by WhatsApp", "Impressions, direction taps and QR scans, every Monday morning."],
            ].map(([title, body]) => (
              <li key={title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1E6B4F]" />
                <div>
                  <div className="text-[13px] font-semibold text-ink-900">{title}</div>
                  <div className="text-[12px] leading-relaxed text-ink-500">{body}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <div className="metric text-2xl font-semibold text-ink-900">{foundingTaken}</div>
              <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Founding merchants live</div>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.08em] text-ink-400">
                <Timer className="h-3.5 w-3.5" /> Verification SLA
              </div>
              <div className="mt-1 text-[13px] font-semibold text-ink-900">5 working days</div>
              <div className="text-[11px] text-ink-400">Accra field team</div>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-2 rounded-2xl bg-ink-900 p-4 text-[11.5px] leading-relaxed text-white/60">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#E0A526]" />
            Live corridors: Osu (Oxford Street) and East Legon. Kumasi — Adum and Asokwa — opens in
            Month 16; applications from Ashanti are queued for launch.
          </div>
        </div>

        <OnboardingForm categories={categories} corridors={corridors} initialPlan={plan} />
      </div>
      <SiteFooter />
    </div>
  );
}
