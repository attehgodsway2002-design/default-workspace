"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Approve / reject a pending storefront from the verification queue. */
export function VerifyActions({
  merchantId,
  merchantName,
}: {
  merchantId: string;
  merchantName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<"approve" | "reject" | null>(null);

  async function run(approve: boolean) {
    setBusy(approve ? "approve" : "reject");
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ merchantId, approve }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Verification failed");
      toast(
        approve ? `${merchantName} is verified and live` : `${merchantName} was rejected`,
        approve ? "success" : "error",
      );
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Verification failed", "error");
      setBusy(null);
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button
        size="sm"
        variant="primary"
        onClick={() => run(true)}
        disabled={busy !== null}
        aria-label={`Approve ${merchantName}`}
      >
        <Check className="h-3.5 w-3.5" aria-hidden />
        {busy === "approve" ? "Approving" : "Approve"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => run(false)}
        disabled={busy !== null}
        aria-label={`Reject ${merchantName}`}
      >
        <X className="h-3.5 w-3.5" aria-hidden />
        {busy === "reject" ? "Rejecting" : "Reject"}
      </Button>
    </div>
  );
}
