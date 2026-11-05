"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Lock, ShieldCheck, XCircle } from "lucide-react";
import type { Tier } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cedis, cedisExact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { actionLink, channelLabel } from "./ui";

interface ChannelOption {
  id: string;
  label: string;
  note: string;
}

/**
 * Seen's own mobile-money approval screen, used only when Paystack keys are
 * absent. It deliberately never touches the amount: the server settles the
 * pending invoice by reference and re-validates the tier against the price list.
 */
export function CheckoutApproval({
  reference,
  merchantId,
  merchantName,
  phoneLast4,
  planName,
  tier,
  amountCedis,
  feeCedis,
  email,
  channels,
  defaultChannel,
  backHref,
}: {
  reference: string;
  merchantId: string;
  merchantName: string;
  phoneLast4: string;
  planName: string;
  tier: Tier;
  amountCedis: number;
  feeCedis: number;
  email: string;
  channels: ChannelOption[];
  defaultChannel: string;
  backHref: string;
}) {
  const [channel, setChannel] = React.useState(defaultChannel);
  const [digits, setDigits] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [declined, setDeclined] = React.useState(false);

  const ready = digits.length === 4 && !pending;

  async function approve() {
    if (!ready) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/paystack/demo-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, meta: { merchantId, tier }, channel }),
      });
      const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "We couldn't approve this payment. Try again.");
        return;
      }
      window.location.href = `/paystack/callback?reference=${encodeURIComponent(reference)}&demo=1`;
    } catch {
      setError("Network error — the payment wasn't approved. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (declined) {
    return (
      <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card">
        <div className="bg-ink-900 px-5 py-4 text-white">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/60">
            <Lock className="h-3.5 w-3.5" aria-hidden /> Payment cancelled
          </p>
          <p className="mt-2 text-lg font-semibold">You declined this payment</p>
        </div>
        <div className="space-y-4 p-5">
          <div className="flex items-start gap-2 rounded-xl bg-[#FBEAE5] p-3 text-[12px] leading-relaxed text-[#A8442A]">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            Nothing was charged. The {cedisExact(amountCedis)} {planName} payment stayed pending —
            start again from Billing whenever you&apos;re ready.
          </div>
          <div className="flex flex-col gap-2">
            <Link href={backHref} className={`${actionLink("primary")} w-full`}>
              Back to billing
            </Link>
            <Link href="/discover" className={`${actionLink("outline")} w-full`}>
              Browse Seen instead
            </Link>
          </div>
          <p className="text-center text-[11px] text-ink-400">Reference {reference}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-lift">
      <div className="bg-ink-900 px-5 py-5 text-white">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/60">
            <Lock className="h-3 w-3" aria-hidden />
            Seen checkout
          </p>
          <Badge tone="gold">Demo mode</Badge>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[13px] text-white/70">{merchantName}</p>
            <p className="text-base font-semibold">{planName} plan · 1 month</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="metric text-3xl font-semibold leading-none">{cedis(amountCedis)}</p>
            <p className="mt-1 text-[11px] text-white/50">{cedisExact(amountCedis)}</p>
          </div>
        </div>
        <p className="mt-3 truncate text-[11px] text-white/40">Ref {reference}</p>
      </div>

      <div className="p-5">
        <div className="rounded-xl bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-500">
          A{" "}
          <span className="font-semibold text-ink-800">{channelLabel(channel)}</span> approval prompt
          was sent to the number ending{" "}
          <span className="font-mono font-semibold text-ink-800">••• {phoneLast4}</span>. Confirm the
          amount below and approve to activate {planName}.
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 block text-[12px] font-semibold text-ink-600">Pay with</legend>
          <div className="space-y-1.5">
            {channels.map((option) => {
              const active = channel === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors",
                    active ? "border-ink-900 bg-ink-50/70" : "border-ink-100 hover:border-ink-300",
                  )}
                >
                  <input
                    type="radio"
                    name="checkout-channel"
                    value={option.id}
                    checked={active}
                    onChange={() => setChannel(option.id)}
                    className="h-4 w-4 accent-ink-900"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium text-ink-800">{option.label}</span>
                    <span className="block text-[11px] text-ink-400">{option.note}</span>
                  </span>
                  {active && <CheckCircle2 className="h-4 w-4 text-ink-900" aria-hidden />}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-4">
          <label
            htmlFor="momo-approval-code"
            className="mb-1.5 block text-[12px] font-semibold text-ink-600"
          >
            MoMo approval code
          </label>
          <input
            id="momo-approval-code"
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={4}
            value={digits}
            onChange={(event) => {
              setDigits(event.target.value.replace(/\D/g, "").slice(0, 4));
              setError(null);
            }}
            aria-describedby="momo-approval-hint"
            placeholder="4 digits"
            className="h-12 w-full rounded-xl border border-ink-200 bg-white text-center text-xl tracking-[0.6em] text-ink-900 placeholder:text-ink-300 placeholder:tracking-normal focus-visible:border-sun-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sun-100"
          />
          <p id="momo-approval-hint" className="mt-1.5 text-[11px] text-ink-400">
            Enter the 4 digits from the prompt. {email ? `Receipt goes to ${email}.` : null}
          </p>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-[#FBEAE5] p-3 text-[12px] font-medium text-[#A8442A]">
            {error}
          </p>
        )}

        <div className="mt-4 space-y-2">
          <Button variant="sun" size="lg" className="w-full" onClick={approve} disabled={!ready}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Approving…
              </>
            ) : (
              <>Approve payment · {cedisExact(amountCedis)}</>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => setDeclined(true)}
            disabled={pending}
          >
            Decline
          </Button>
        </div>

        <div className="mt-4 flex items-start gap-1.5 text-[10.5px] leading-relaxed text-ink-400">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Paystack&apos;s 1.95% fee on this payment is {cedisExact(feeCedis)}, absorbed by Seen. In
          demo mode no money moves — the invoice, reference and receipt are real records in Seen&apos;s
          store.
        </div>
      </div>
    </div>
  );
}
