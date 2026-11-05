"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Info, Check } from "lucide-react";
import type { Tier } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cedis, cedisExact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { channelLabel } from "./ui";

interface PlanOption {
  tier: Tier;
  name: string;
  priceCedis: number;
  feeCedis: number;
  popular: boolean;
  features: string[];
}

interface ChannelOption {
  id: string;
  label: string;
  note: string;
}

const TIER_BLURB: Record<Tier, string> = {
  starter: "Verified listing, map pin and GhanaPostGPS address.",
  boost: "Priority rank in your category, plus the full analytics dashboard.",
  billboard: "Top placement, produced 360° tour and a monthly rep call.",
};

async function cancelSubscription(): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch("/api/subscription/cancel", { method: "POST" });
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!response.ok || !payload.ok) {
      return { ok: false, error: payload.error ?? "We couldn't cancel the subscription." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Network error — the subscription wasn't cancelled. Try again." };
  }
}

export function PlanPicker({
  plans,
  channels,
  currentTier,
  demo,
}: {
  plans: PlanOption[];
  channels: ChannelOption[];
  currentTier: Tier;
  demo: boolean;
}) {
  const router = useRouter();
  const sorted = [...plans].sort((a, b) => a.priceCedis - b.priceCedis);
  const defaultTier: Tier =
    currentTier === "starter" ? (sorted.find((plan) => plan.priceCedis > 0)?.tier ?? "boost") : currentTier;
  const [tier, setTier] = React.useState<Tier>(defaultTier);
  const [channel, setChannel] = React.useState<string>(channels[0]?.id ?? "mtn-momo");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmStarter, setConfirmStarter] = React.useState(false);

  const selected = sorted.find((plan) => plan.tier === tier) ?? sorted[sorted.length - 1]!;
  const paid = selected.priceCedis > 0;

  async function startCheckout() {
    if (pending) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/subscription/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, channel }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        demo?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok || !payload.url) {
        setError(payload.error ?? "We couldn't start the payment. Try again.");
        return;
      }
      window.location.href = payload.url;
    } catch {
      setError("Network error — we couldn't reach the payment provider. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function switchToStarter() {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await cancelSubscription();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "We couldn't switch plans.");
      return;
    }
    setConfirmStarter(false);
    toast("You're on Starter — paid placement and analytics are off. Your listing stays live.", "success");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 block text-[12px] font-semibold text-ink-600">Choose a plan</legend>
        <div className="grid gap-2.5 sm:grid-cols-3">
          {sorted.map((plan) => {
            const active = tier === plan.tier;
            return (
              <label
                key={plan.tier}
                className={cn(
                  "relative flex cursor-pointer flex-col rounded-2xl border p-3.5 transition-colors",
                  active
                    ? "border-ink-900 bg-ink-50/70 ring-1 ring-ink-900"
                    : "border-ink-100 bg-white hover:border-ink-300",
                )}
              >
                <input
                  type="radio"
                  name="plan-tier"
                  value={plan.tier}
                  checked={active}
                  onChange={() => {
                    setTier(plan.tier);
                    setConfirmStarter(false);
                    setError(null);
                  }}
                  className="sr-only"
                />
                <span className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-ink-900">{plan.name}</span>
                  {currentTier === plan.tier && <Badge tone="green">Current</Badge>}
                  {plan.popular && currentTier !== plan.tier && <Badge tone="sun">Popular</Badge>}
                  {active && <Check className="ml-auto h-4 w-4 text-ink-900" aria-hidden />}
                </span>
                <span className="metric mt-2 text-lg font-semibold text-ink-900">
                  {plan.priceCedis > 0 ? cedis(plan.priceCedis) : "Free"}
                  {plan.priceCedis > 0 && (
                    <span className="ml-0.5 text-[11px] font-normal text-ink-400">/month</span>
                  )}
                </span>
                <span className="mt-1 text-[11px] leading-relaxed text-ink-400">
                  {TIER_BLURB[plan.tier]}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {paid && (
        <fieldset>
          <legend className="mb-2 block text-[12px] font-semibold text-ink-600">
            Pay with
          </legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {channels.map((option) => {
              const active = channel === option.id;
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition-colors",
                    active
                      ? "border-ink-900 bg-ink-50/70"
                      : "border-ink-100 bg-white hover:border-ink-300",
                  )}
                >
                  <input
                    type="radio"
                    name="channel"
                    value={option.id}
                    checked={active}
                    onChange={() => setChannel(option.id)}
                    className="mt-0.5 h-4 w-4 accent-ink-900"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-ink-800">{option.label}</span>
                    <span className="block text-[11px] text-ink-400">{option.note}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {paid ? (
        <div className="rounded-xl border border-ink-100 bg-[#FBFAF7] p-4">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm text-ink-500">You pay today</span>
            <span className="metric text-base font-semibold text-ink-900">
              {cedisExact(selected.priceCedis)}
            </span>
          </div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2 text-[12px] text-ink-400">
            <span>Paystack fee at 1.95% — absorbed by Seen</span>
            <span className="metric">{cedisExact(selected.feeCedis)}</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
            The exact amount charged to your {channelLabel(channel)} is{" "}
            {cedisExact(selected.priceCedis)}. No surcharge, no hidden processing fee.
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-ink-50 p-3 text-[12px] leading-relaxed text-ink-500">
          Starter is free. Switching to Starter cancels paid placement immediately and keeps your
          verified listing live.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-[#FBEAE5] p-3 text-[12px] font-medium text-[#A8442A]">
          {error}
        </p>
      )}

      {tier === "starter" ? (
        currentTier === "starter" ? (
          <p className="text-[13px] text-ink-500">You&apos;re already on Starter — nothing to pay.</p>
        ) : confirmStarter ? (
          <div
            role="alertdialog"
            aria-labelledby="starter-switch-title"
            className="rounded-xl border border-[#A8442A]/30 bg-[#FBEAE5] p-4"
          >
            <p id="starter-switch-title" className="text-sm font-semibold text-ink-900">
              Switch to Starter?
            </p>
            <p className="mt-1 text-[12px] leading-relaxed text-ink-600">
              Ranked placement and the analytics dashboard switch off now. Your listing stays live
              and verified, and you won&apos;t be charged again.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="danger" size="sm" onClick={switchToStarter} disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Switching…
                  </>
                ) : (
                  "Yes, switch to Starter"
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmStarter(false)}
                disabled={pending}
              >
                Keep my plan
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setConfirmStarter(true)}>
            Switch to Starter
          </Button>
        )
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant={currentTier === tier ? "outline" : "sun"}
            onClick={startCheckout}
            disabled={pending}
          >
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Starting secure checkout…
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" aria-hidden />
                {currentTier === tier ? "Renew" : "Continue"} — {cedisExact(selected.priceCedis)} via{" "}
                {channelLabel(channel)}
              </>
            )}
          </Button>
          {currentTier === tier && (
            <span className="text-[11px] text-ink-400">This is your current plan.</span>
          )}
        </div>
      )}

      {demo && (
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Demo mode: Paystack keys aren&apos;t configured here, so you approve on Seen&apos;s
          simulated mobile-money screen. The reference, invoice and receipt are real records in the
          local store; no money moves.
        </p>
      )}
    </div>
  );
}

export function CancelPlan({ planName }: { planName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onConfirm() {
    if (pending) return;
    setPending(true);
    setError(null);
    const result = await cancelSubscription();
    setPending(false);
    if (!result.ok) {
      setError(result.error ?? "We couldn't cancel the subscription.");
      return;
    }
    setConfirming(false);
    toast("Subscription cancelled — your listing is now on Starter.", "success");
    router.refresh();
  }

  if (!confirming) {
    return (
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-lg text-[13px] leading-relaxed text-ink-500">
          Cancelling your {planName} plan switches off ranked placement and the performance
          dashboard immediately. Your listing drops to Starter and stays verified.
        </p>
        <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
          Cancel subscription
        </Button>
      </div>
    );
  }

  return (
    <div
      role="alertdialog"
      aria-labelledby="cancel-subscription-title"
      aria-describedby="cancel-subscription-description"
      className="rounded-xl border border-[#A8442A]/30 bg-[#FBEAE5] p-4"
    >
      <p id="cancel-subscription-title" className="text-sm font-semibold text-ink-900">
        Cancel your {planName} subscription?
      </p>
      <p id="cancel-subscription-description" className="mt-1 text-[12px] leading-relaxed text-ink-600">
        This happens immediately: ranked placement ends, analytics lock, and the next charge will
        not happen. Paid invoices stay on your record.
      </p>
      {error && (
        <p role="alert" className="mt-2 text-[12px] font-medium text-[#A8442A]">
          {error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="danger" size="sm" onClick={onConfirm} disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Cancelling…
            </>
          ) : (
            "Yes, cancel subscription"
          )}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          disabled={pending}
        >
          Keep subscription
        </Button>
      </div>
    </div>
  );
}
