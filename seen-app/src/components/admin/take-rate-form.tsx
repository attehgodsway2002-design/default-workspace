"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/**
 * Take-rate editor. Rates are basis points of GMV (500 bps = 5%); the
 * contractual band after the free months is 500–1,500 bps.
 */
export function TakeRateForm({
  appId,
  appName,
  currentBps,
}: {
  appId: string;
  appName: string;
  currentBps: number;
}) {
  const router = useRouter();
  const [value, setValue] = React.useState(String(currentBps));
  const [busy, setBusy] = React.useState(false);
  const inputId = `take-rate-${appId}`;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const bps = Number(value);
    if (!Number.isInteger(bps) || bps < 0 || bps > 1500) {
      toast("Take rate must be a whole number between 0 and 1,500 bps", "error");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/take-rate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ miniAppId: appId, takeRateBps: bps }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not update the take rate");
      toast(`${appName} take rate set to ${bps} bps`, "success");
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update the take rate", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-2">
      <div className="min-w-0 flex-1">
        <label
          htmlFor={inputId}
          className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400"
        >
          Take rate (bps)
        </label>
        <Input
          id={inputId}
          name="takeRateBps"
          type="number"
          inputMode="numeric"
          min={0}
          max={1500}
          step={25}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm" variant="primary" disabled={busy}>
        {busy ? "Saving" : "Update"}
      </Button>
    </form>
  );
}
