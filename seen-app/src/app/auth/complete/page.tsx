import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account confirmed" };

export default async function AuthCompletePage() {
  const session = await getSession();
  if (!session) redirect("/signin?error=session_missing");

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <SiteHeader />
      <main className="container max-w-xl py-16">
        <section className="rounded-2xl border border-ink-100 bg-white p-7 shadow-card">
          <CheckCircle2 className="h-8 w-8 text-[#1E6B4F]" />
          <h1 className="mt-4 text-2xl font-semibold text-ink-900">Your email is confirmed</h1>
          <p className="mt-2 text-sm text-ink-600">You’re signed in as {session.email}.</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-500">
            Account verification is connected. Business listings and the rest of the live data service
            are still being connected, so production features are not open yet.
          </p>
          <Link
            href="/api/auth/signout"
            className="mt-6 inline-flex h-10 items-center rounded-xl bg-ink-900 px-4 text-sm font-semibold text-white hover:bg-ink-800"
          >
            Sign out
          </Link>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
