"use client";

import * as React from "react";

/** Fires a single view event when a listing page mounts. */
export function ViewBeacon({
  merchantId,
  source = "direct",
}: {
  merchantId: string;
  source?: "feed" | "search" | "map" | "qr" | "mini" | "direct";
}) {
  React.useEffect(() => {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId, type: "view", source }),
      keepalive: true,
    });
  }, [merchantId, source]);

  return null;
}
