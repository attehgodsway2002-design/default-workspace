"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ShieldOff } from "lucide-react";
import type { MiniScope } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import type { ScopeCopy } from "@/components/mini/scope-chips";
import { longDate } from "@/lib/format";

/**
 * Consent management panel: shows exactly what is granted, since when, and
 * revokes it — which also kills the delegated token on the partner side.
 */
export function ManageConsent({
  appId,
  appName,
  scopes,
  scopeCopy,
  grantedAt,
}: {
  appId: string;
  appName: string;
  scopes: MiniScope[];
  scopeCopy: ScopeCopy;
  grantedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function revoke() {
    setBusy(true);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "revoke", miniAppId: appId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not revoke access.");
      toast(`Access revoked — ${appName} no longer sees your identity`, "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not revoke access.", "error");
      setBusy(false);
    }
  }

  return (
    <Card id="consent" className="scroll-mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Manage consent</CardTitle>
          <Badge tone="green">Linked</Badge>
        </div>
        <CardDescription>
          Granted {longDate(grantedAt)} · the partner holds a scoped token, never your credentials.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {scopes.map((scope) => (
            <li key={scope} className="flex items-start gap-2 text-[12px]">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1E6B4F]" aria-hidden />
              <span>
                <span className="font-semibold text-ink-800">{scopeCopy[scope].label}</span>
                <span className="text-ink-400"> — {scopeCopy[scope].detail}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-2 border-t border-ink-50 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-relaxed text-ink-400">
            Revoking is immediate: {appName} loses the token and any booking or ticket already made
            stays valid.
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={revoke}
            disabled={busy}
            className="shrink-0"
          >
            <ShieldOff className="h-3.5 w-3.5" aria-hidden />
            {busy ? "Revoking…" : "Revoke access"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
