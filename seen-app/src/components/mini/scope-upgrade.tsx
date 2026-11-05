"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { MiniScope } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/**
 * Shown when a user granted consent but declined the optional scope the app's
 * core flow needs. Re-granting adds exactly that scope — nothing else changes.
 */
export function ScopeUpgradeBanner({
  appId,
  appName,
  currentScopes,
  missingScope,
  missingLabel,
}: {
  appId: string;
  appName: string;
  currentScopes: MiniScope[];
  missingScope: MiniScope;
  missingLabel: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function grant() {
    setBusy(true);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          miniAppId: appId,
          scopes: [...currentScopes, missingScope],
        }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not update consent.");
      toast(`${appName} can now use ${missingLabel.toLowerCase()}`, "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update consent.", "error");
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[#FBF1DA] bg-[#FBF1DA]/50 p-3.5">
      <div className="text-[12px] font-semibold text-[#8a6314]">
        {missingLabel} is not granted
      </div>
      <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">
        {appName} needs this scope to finish this flow. Grant it now — nothing else on your consent
        changes.
      </p>
      <Button size="sm" variant="sun" className="mt-2" onClick={grant} disabled={busy}>
        {busy ? "Updating…" : `Grant ${missingLabel.toLowerCase()}`}
      </Button>
    </div>
  );
}
