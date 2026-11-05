import type { Metadata } from "next";
import Link from "next/link";
import {
  allMerchants,
  allSlots,
  getCategory,
  getCorridor,
  liveCorridors,
  slotInventory,
} from "@/lib/db/queries";
import { cedis, pct } from "@/lib/format";
import type { Slot } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Stat,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { OpsHeader } from "@/components/admin/ops-header";
import { EmptyState } from "@/components/admin/empty-state";
import { SlotStatusBadge } from "@/components/admin/status-badges";
import { WaitlistButton } from "@/components/admin/waitlist-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Slot inventory" };

function slotLabel(slot: Slot): string {
  const corridor = getCorridor(slot.corridorId)?.name ?? slot.corridorId;
  const category = getCategory(slot.categoryId)?.name ?? slot.categoryId;
  return `${corridor} · ${category} · ${slot.tier === "billboard" ? "Billboard" : "Boost"} #${slot.position}`;
}

export default function AdminSlotsPage() {
  const corridors = liveCorridors();
  const inventory = corridors.map((corridor) => ({
    corridor,
    categories: slotInventory(corridor.id),
  }));
  const slots = allSlots();
  const sold = slots.filter((slot) => slot.status === "sold");
  const available = slots.filter((slot) => slot.status !== "sold");
  const occupancy = slots.length ? sold.length / slots.length : 0;
  const waitlistTotal = slots.reduce((sum, slot) => sum + slot.waitlist, 0);

  const merchantName = new Map(allMerchants().map((merchant) => [merchant.id, merchant]));
  const pressure = available
    .filter((slot) => slot.waitlist > 0)
    .sort((a, b) => b.waitlist - a.waitlist || a.position - b.position)
    .slice(0, 10);

  return (
    <div className="space-y-5">
      <OpsHeader />

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink-900">Slot inventory</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Three Billboard slots and eight Boost slots exist per category per corridor. Billboard
            position 1 is the hero slot at GH₵249; positions 2 and 3 list at GH₵199.
          </p>
        </div>
        <Badge tone="outline">
          {slots.length} slots · {corridors.length} corridors
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Occupancy"
          value={pct(occupancy, 0)}
          hint={`${sold.length} of ${slots.length} paid slots sold`}
        />
        <Stat label="Sold" value={sold.length} hint="Billboard + Boost under contract" />
        <Stat label="Available" value={available.length} hint="Ready to sell this week" />
        <Stat
          label="Waitlist demand"
          value={waitlistTotal}
          hint="Operators queued across available slots"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Waitlist pressure</CardTitle>
          <CardDescription>
            Available slots sorted by how many operators are already waiting — highest first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pressure.length === 0 ? (
            <EmptyState
              title="No waitlist pressure"
              detail="Every available slot currently has an empty waitlist. Use Add to waitlist when a merchant asks to be queued."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Slot</TH>
                  <TH>Tier</TH>
                  <TH className="text-right">Price</TH>
                  <TH className="text-right">Waiting</TH>
                  <TH className="text-right">Action</TH>
                </TR>
              </THead>
              <TBody>
                {pressure.map((slot) => (
                  <TR key={slot.id}>
                    <TD className="text-[13px] font-medium text-ink-800">{slotLabel(slot)}</TD>
                    <TD>
                      <Badge tone={slot.tier === "billboard" ? "ink" : "sun"}>
                        {slot.tier === "billboard" ? "Billboard" : "Boost"}
                      </Badge>
                    </TD>
                    <TD className="metric text-right">{cedis(slot.priceCedis)}</TD>
                    <TD className="metric text-right font-semibold text-ink-900">{slot.waitlist}</TD>
                    <TD className="text-right">
                      <WaitlistButton slotId={slot.id} label={slotLabel(slot)} />
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {inventory.map(({ corridor, categories }) => {
        const corridorSlots = slots.filter((slot) => slot.corridorId === corridor.id);
        const corridorSold = corridorSlots.filter((slot) => slot.status === "sold").length;
        return (
          <section key={corridor.id} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-ink-400">
                {corridor.name}
              </h2>
              <span className="text-[12px] text-ink-400">
                {corridorSold}/{corridorSlots.length} sold · {pct(
                  corridorSlots.length ? corridorSold / corridorSlots.length : 0,
                  0,
                )}{" "}
                occupancy
              </span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {categories.map(({ category, billboards, boosts }) => {
                const categorySold = [...billboards, ...boosts].filter(
                  (slot) => slot.status === "sold",
                ).length;
                return (
                  <Card key={`${corridor.id}-${category.id}`}>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle>{category.name}</CardTitle>
                        <Badge tone="outline">{categorySold}/11 sold</Badge>
                      </div>
                      <CardDescription>{category.blurb}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { label: "Billboard · 3 slots", rows: billboards },
                        { label: "Boost · 8 slots", rows: boosts },
                      ].map((group) => (
                        <div key={group.label}>
                          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                            {group.label}
                          </div>
                          <Table>
                            <THead>
                              <TR>
                                <TH>Pos</TH>
                                <TH>Price</TH>
                                <TH>Status</TH>
                                <TH>Merchant</TH>
                                <TH className="text-right">Waitlist</TH>
                              </TR>
                            </THead>
                            <TBody>
                              {group.rows.map((slot) => {
                                const owner = slot.merchantId
                                  ? merchantName.get(slot.merchantId)
                                  : undefined;
                                return (
                                  <TR key={slot.id}>
                                    <TD className="metric text-[13px] text-ink-500">
                                      #{slot.position}
                                    </TD>
                                    <TD className="metric whitespace-nowrap text-[13px]">
                                      {cedis(slot.priceCedis)}
                                    </TD>
                                    <TD>
                                      <SlotStatusBadge status={slot.status} />
                                    </TD>
                                    <TD className="max-w-[160px] truncate text-[13px]">
                                      {owner ? (
                                        <Link
                                          href={`/admin/merchants/${owner.id}`}
                                          className="font-medium text-ink-800 hover:text-sun-600"
                                        >
                                          {owner.name}
                                        </Link>
                                      ) : (
                                        <span className="text-ink-300">—</span>
                                      )}
                                    </TD>
                                    <TD className="metric text-right text-[13px]">
                                      {slot.waitlist > 0 ? slot.waitlist : <span className="text-ink-300">0</span>}
                                    </TD>
                                  </TR>
                                );
                              })}
                            </TBody>
                          </Table>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}

      <p className="text-[11px] text-ink-300">
        Slot inventory is read-only here. Adding a merchant to a waitlist records demand on the slot;
        it does not create a subscription. Inventory is generated per corridor and category.
      </p>
    </div>
  );
}
