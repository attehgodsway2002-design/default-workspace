import { Logo } from "@/components/brand/logo";

/** Shared frame for Seen's own Paystack screens (demo checkout + callback). */
export default function PaystackLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-b from-ink-950 via-ink-900 to-[#071d30] px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-5 flex items-center justify-between gap-2">
          <Logo tone="light" />
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
            Secure payments
          </span>
        </div>
        {children}
        <p className="mt-6 text-center text-[11px] text-white/40">
          Seen · Accra, Ghana · payments processed by Paystack
        </p>
      </div>
    </main>
  );
}
