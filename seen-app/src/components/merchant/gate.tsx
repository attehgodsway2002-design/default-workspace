import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Card } from "@/components/ui/card";
import { actionLink } from "./ui";

/**
 * Shown whenever a merchant route is opened without a merchant session.
 * It is deliberately small and never throws: the demo can always recover.
 */
export function MerchantGate({ next = "/merchant" }: { next?: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FBFAF7] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <Card className="p-6 sm:p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-900 text-white shadow-sm">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-[-0.01em] text-ink-900">
            Sign in to your merchant dashboard
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">
            This area shows live impressions, invoices and your storefront editor. Sign in with the
            demo merchant account{" "}
            <span className="font-semibold text-ink-800">kofi@kenteandkoffee.gh</span> to open Kente
            &amp; Koffee in Osu.
          </p>
          <div className="mt-6 space-y-2">
            <Link
              href={`/signin?next=${encodeURIComponent(next)}`}
              className={`${actionLink("primary")} w-full`}
            >
              Sign in as kofi@kenteandkoffee.gh
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link href="/discover" className={`${actionLink("outline")} w-full`}>
              Browse the Seen feed instead
            </Link>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-ink-400">
          Merchant tools are read-only until you sign in. No payment is taken from this screen.
        </p>
      </div>
    </main>
  );
}
