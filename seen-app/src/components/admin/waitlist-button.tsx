"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Adds one operator to an available slot's waitlist and refreshes the board. */
export function WaitlistButton({ slotId, label }: { slotId: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function add() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slotId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; waitlist?: number };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Could not update the waitlist");
      toast(
        `${label} — ${data.waitlist ?? 1} operator${data.waitlist === 1 ? "" : "s"} waiting`,
        "success",
      );
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Could not update the waitlist", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={add} disabled={busy} aria-label={`Add to waitlist for ${label}`}>
      <Plus className="h-3.5 w-3.5" aria-hidden />
      {busy ? "Adding" : "Add to waitlist"}
    </Button>
  );
}
