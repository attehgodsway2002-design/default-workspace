import { Badge } from "@/components/ui/badge";
import type { MerchantStatus, MiniApp, SlotStatus } from "@/lib/types";

/** Ops-facing status vocabulary — one badge per resource type. */

export function MerchantStatusBadge({ status }: { status: MerchantStatus }) {
  if (status === "verified") return <Badge tone="green">Verified</Badge>;
  if (status === "pending") return <Badge tone="gold">Pending</Badge>;
  if (status === "rejected") return <Badge tone="clay">Rejected</Badge>;
  return <Badge tone="neutral">Paused</Badge>;
}

export function SlotStatusBadge({ status }: { status: SlotStatus }) {
  if (status === "sold") return <Badge tone="ink">Sold</Badge>;
  if (status === "waitlist") return <Badge tone="sun">Waitlist</Badge>;
  return <Badge tone="outline">Available</Badge>;
}

export function MiniStatusBadge({ status }: { status: MiniApp["status"] }) {
  if (status === "live") return <Badge tone="green">Live</Badge>;
  if (status === "pilot") return <Badge tone="gold">Pilot</Badge>;
  return <Badge tone="neutral">LOI</Badge>;
}
