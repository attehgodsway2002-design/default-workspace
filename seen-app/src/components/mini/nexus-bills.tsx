"use client";

import * as React from "react";
import { CheckCircle2, Droplets, KeyRound, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { longDate, timeOfDay } from "@/lib/format";

interface Claims {
  sub?: string;
  app?: string;
  name?: string;
  phone?: string;
  ghanapost?: string;
  scopes?: string[];
}

interface Handshake {
  token: string;
  expiresAt: string;
  claims: Claims;
}

function decodeClaims(token: string): Claims | null {
  try {
    const body = token.split(".")[0] ?? "";
    const base64 = body.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const binary = window.atob(padded);
    const json = decodeURIComponent(
      Array.from(binary)
        .map((character) => `%${character.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as Claims;
  } catch {
    return null;
  }
}

const UPCOMING = [
  {
    icon: Zap,
    name: "ECG prepaid",
    detail: "Top up a prepaid meter and keep the receipt in Seen.",
  },
  {
    icon: Droplets,
    name: "Ghana Water",
    detail: "Pay a bill against the account number you already use.",
  },
  {
    icon: Smartphone,
    name: "Airtime & data",
    detail: "MTN, Telecel and AT bundles on the same MoMo rail.",
  },
];

/** Nexus Bills pilot: proves the delegated handshake, holds payments back. */
export function NexusBillsApp({
  appSlug,
  appName,
}: {
  appSlug: string;
  appName: string;
}) {
  const [handshake, setHandshake] = React.useState<Handshake | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function runHandshake() {
    setBusy(true);
    try {
      const res = await fetch("/api/mini/token", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ miniAppSlug: appSlug }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        token?: string;
        expiresAt?: string;
      };
      if (!res.ok || !data.ok || !data.token || !data.expiresAt) {
        throw new Error(data.error ?? "The identity handshake failed.");
      }
      const claims = decodeClaims(data.token);
      setHandshake({ token: data.token, expiresAt: data.expiresAt, claims: claims ?? {} });
      toast("Scoped token issued — expires in 60 minutes", "success");
    } catch (error) {
      toast(error instanceof Error ? error.message : "The identity handshake failed.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-ink-900">Bills, one pass</h2>
          <Badge tone="gold">Pilot</Badge>
        </div>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
          {appName} is proving the delegated identity handshake inside Seen before any payment rail
          is switched on.
        </p>
      </div>

      <div className="rounded-xl border border-ink-100 bg-white p-3.5">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-ink-500" aria-hidden />
          <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Scoped identity handshake
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
          Nexus asks Seen for a token, not for your details. The token carries only the scopes you
          granted, expires after one hour, and can be revoked the moment you close this screen.
        </p>

        {!handshake ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            className="mt-3 w-full"
            onClick={runHandshake}
            disabled={busy}
          >
            {busy ? "Handshaking…" : "Request scoped token"}
          </Button>
        ) : (
          <div className="mt-3 rounded-lg border border-[#D7EBDD] bg-[#F4FAF6] p-3">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1E6B4F]">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              Consent verified · token issued
            </div>
            <dl className="mt-2 space-y-1.5 text-[12px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Seen user</dt>
                <dd className="metric font-mono text-ink-700">{handshake.claims.sub ?? "—"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">App</dt>
                <dd className="text-ink-700">{handshake.claims.app ?? appSlug}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Name shared</dt>
                <dd className="text-ink-700">{handshake.claims.name ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Phone shared</dt>
                <dd className="text-ink-700">{handshake.claims.phone ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">GhanaPostGPS shared</dt>
                <dd className="text-ink-700">{handshake.claims.ghanapost ? "Yes" : "No"}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Wallet / PIN</dt>
                <dd className="font-semibold text-[#1E6B4F]">Never requested</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Expires</dt>
                <dd className="text-ink-700">
                  {longDate(handshake.expiresAt)} · {timeOfDay(handshake.expiresAt)}
                </dd>
              </div>
            </dl>
            <div className="mt-2 truncate rounded-md bg-white px-2 py-1.5 font-mono text-[10px] text-ink-400">
              {handshake.token.slice(0, 32)}…
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-[#FBF1DA] bg-[#FBF1DA]/40 p-3.5">
        <div className="flex items-center gap-2">
          <Badge tone="gold">Pilot</Badge>
          <span className="text-[13px] font-semibold text-[#8a6314]">
            Not accepting live payments
          </span>
        </div>
        <p className="mt-1 text-[12px] leading-relaxed text-ink-600">
          The identity link above is real. The bill rails below are not switched on: Nexus is running
          a read-only pilot with GCB G-Money Nexus, so nothing can be charged from this screen.
        </p>
        <ul className="mt-3 space-y-2">
          {UPCOMING.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-ink-600">
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[12px] font-semibold text-ink-800">{item.name}</span>
                  <span className="block text-[11px] leading-relaxed text-ink-400">
                    {item.detail}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-[11px] leading-relaxed text-ink-400">
        Money movement will run on GCB G-Money&apos;s Bank of Ghana licence under the Payment Systems
        and Services Act, 2019 (Act 987). Seen holds no float and never takes custody of customer
        funds — the pilot is limited to scoped identity and read-only bill lookup.
      </p>
    </div>
  );
}
