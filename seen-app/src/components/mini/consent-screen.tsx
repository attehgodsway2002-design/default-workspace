"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { MiniScope } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import type { ScopeCopy } from "@/components/mini/scope-chips";
import { cn } from "@/lib/utils";

function joinList(items: string[]): string {
  if (items.length === 0) return "nothing at all";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Consent screen: required scopes are locked on, optional scopes toggle, and
 * the summary sentence names exactly what the partner will see.
 */
export function ConsentScreen({
  appId,
  appSlug,
  appName,
  appPartner,
  requestedScopes,
  scopeCopy,
}: {
  appId: string;
  appSlug: string;
  appName: string;
  appPartner: string;
  requestedScopes: MiniScope[];
  scopeCopy: ScopeCopy;
}) {
  const router = useRouter();
  const required = requestedScopes.filter((scope) => scopeCopy[scope].required);
  const [granted, setGranted] = React.useState<MiniScope[]>(requestedScopes);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  function toggle(scope: MiniScope) {
    if (required.includes(scope)) return;
    setGranted((current) =>
      current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope],
    );
  }

  const ordered = requestedScopes.filter((scope) => granted.includes(scope));
  const summary = `${appName} will see ${joinList(
    ordered.map((scope) => scopeCopy[scope].label.toLowerCase()),
  )} — never your mobile money PIN, your card details or your Seen password.`;

  async function connect() {
    setBusy(true);
    setError(null);
    try {
      const consentRes = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ miniAppId: appId, scopes: granted }),
      });
      const consentData = (await consentRes.json()) as { ok: boolean; error?: string };
      if (!consentRes.ok || !consentData.ok) {
        throw new Error(consentData.error ?? "Consent could not be recorded.");
      }

      const tokenRes = await fetch("/api/mini/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ miniAppSlug: appSlug }),
      });
      const tokenData = (await tokenRes.json()) as { ok: boolean; error?: string };
      if (!tokenRes.ok || !tokenData.ok) {
        throw new Error(tokenData.error ?? "The identity handshake failed.");
      }

      toast(`${appName} is now linked to your Seen identity`, "success");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E7F3EC] text-[#1E6B4F]">
          <ShieldCheck className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink-900">Connect {appName}</h2>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
            {appPartner} is asking Seen for access to your identity. Choose what it sees — you are
            never creating a new account.
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {requestedScopes.map((scope) => {
          const copy = scopeCopy[scope];
          const locked = copy.required;
          const checked = granted.includes(scope);
          return (
            <li key={scope}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors",
                  checked ? "border-ink-200 bg-white" : "border-ink-100 bg-ink-50/50",
                  locked && "cursor-default",
                )}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 accent-[#C16A1E]"
                  checked={checked}
                  disabled={locked || busy}
                  onChange={() => toggle(scope)}
                  aria-describedby={`scope-detail-${scope}`}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[13px] font-semibold text-ink-800">{copy.label}</span>
                    {locked ? (
                      <Badge tone="neutral">Required</Badge>
                    ) : (
                      <Badge tone="outline">Optional</Badge>
                    )}
                  </span>
                  <span
                    id={`scope-detail-${scope}`}
                    className="mt-0.5 block text-[12px] leading-relaxed text-ink-400"
                  >
                    {copy.detail}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 rounded-xl border border-ink-100 bg-ink-50/70 p-3.5">
        <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
          In plain English
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-700">{summary}</p>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-[#FBEAE5] px-3 py-2 text-[12px] font-medium text-[#A8442A]">
          {error}
        </p>
      )}

      <div className="mt-4 space-y-2">
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="w-full"
          onClick={connect}
          disabled={busy}
        >
          {busy ? "Connecting…" : `Continue to ${appName}`}
          {!busy && <ArrowRight className="h-4 w-4" aria-hidden />}
        </Button>
        <div className="flex items-center justify-between text-[11px] text-ink-400">
          <span>Creates a 1-hour delegated token — no wallet access.</span>
          <Link href="/mini" className="font-semibold text-ink-500 hover:text-ink-900">
            Not now
          </Link>
        </div>
      </div>
    </div>
  );
}
