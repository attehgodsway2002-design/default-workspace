"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Ticket, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toast";
import { cedis, longDate, timeOfDay } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LiveEvent } from "@/components/mini/event-catalogue";
import { VisualCode } from "@/components/mini/visual-code";

export interface PriorOrder {
  reference: string;
  eventName: string;
  quantity: number;
  totalCedis: number;
  createdAt: string;
}

export interface TicketOrder {
  id: string;
  reference: string;
  eventName: string;
  quantity: number;
  totalCedis: number;
  status: "paid" | "pending";
}

interface Take {
  bps: number;
  cedis: number;
}

interface Confirmation {
  order: TicketOrder;
  event: LiveEvent;
  take: Take;
}

export function AccraLiveApp({
  appSlug,
  events,
  priorOrders,
  buyerName,
}: {
  appSlug: string;
  events: LiveEvent[];
  priorOrders: PriorOrder[];
  buyerName: string;
}) {
  const [selectedId, setSelectedId] = React.useState(events[0]?.id ?? "");
  const router = useRouter();
  const [quantity, setQuantity] = React.useState(1);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<Confirmation | null>(null);

  const event = events.find((item) => item.id === selectedId) ?? events[0];
  const maxQuantity = Math.min(6, event?.remaining ?? 6);
  const total = (event?.priceCedis ?? 0) * quantity;

  async function pay() {
    if (!event) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/mini/ticket", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          miniAppSlug: appSlug,
          eventName: event.name,
          quantity,
          priceCedis: event.priceCedis,
        }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        order?: TicketOrder;
        take?: Take;
      };
      if (!res.ok || !data.ok || !data.order || !data.take) {
        throw new Error(data.error ?? "The ticket could not be issued.");
      }
      setConfirmation({ order: data.order, event, take: data.take });
      toast("Ticket issued", "success");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The ticket could not be issued.");
    } finally {
      setBusy(false);
    }
  }

  if (confirmation) {
    const { order, event: bookedEvent, take } = confirmation;
    const partnerShare = order.totalCedis - take.cedis;
    return (
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border border-ink-200">
          <div className="flex items-center justify-between gap-2 bg-ink-900 px-4 py-2.5 text-white">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]">
              <Ticket className="h-3.5 w-3.5" aria-hidden />
              Accra Live ticket
            </span>
            <Badge tone="green">{order.status === "paid" ? "Paid" : "Pending"}</Badge>
          </div>
          <div className="bg-white p-4">
            <h2 className="text-lg font-semibold tracking-[-0.01em] text-ink-900">
              {order.eventName}
            </h2>
            <p className="mt-0.5 text-[13px] text-ink-500">
              {bookedEvent.venue} · {bookedEvent.area}
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-ink-700">
              {longDate(bookedEvent.startsAt)} · {timeOfDay(bookedEvent.startsAt)}
            </p>

            <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-dashed border-ink-200 bg-ink-50/40 p-4">
              <VisualCode reference={order.reference} className="h-40 w-40" />
              <div className="metric font-mono text-[13px] font-semibold tracking-[0.08em] text-ink-900">
                {order.reference}
              </div>
              <p className="text-center text-[10px] leading-relaxed text-ink-400">
                Entry code shown at the gate. This is a decorative pattern, not a scannable QR code.
              </p>
            </div>

            <dl className="mt-4 space-y-1.5 border-t border-ink-50 pt-3 text-[13px]">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Issued to</dt>
                <dd className="font-medium text-ink-800">{buyerName}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Tickets</dt>
                <dd className="metric font-medium text-ink-800">{order.quantity}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-ink-400">Paid</dt>
                <dd className="metric font-semibold text-ink-900">{cedis(order.totalCedis)}</dd>
              </div>
            </dl>

            <p className="mt-3 border-t border-ink-50 pt-2.5 text-[11px] leading-relaxed text-ink-400">
              Charged on the MTN MoMo rail through Paystack. Accra Live receives{" "}
              {cedis(partnerShare)}; Seen keeps its {(take.bps / 100).toFixed(2)}% take (
              {cedis(take.cedis)}). The card issuer or MoMo wallet statement shows “SEEN ACCRA LIVE”.
            </p>
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-full" onClick={() => setConfirmation(null)}>
          Buy another ticket
        </Button>

        {priorOrders.length > 0 && (
          <div className="border-t border-ink-50 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              Tickets bought with Seen
            </div>
            <ul className="mt-1.5 space-y-1.5">
              {priorOrders.slice(0, 4).map((item) => (
                <li
                  key={item.reference}
                  className="flex items-baseline justify-between gap-3 text-[12px]"
                >
                  <span className="min-w-0 truncate text-ink-600">{item.eventName}</span>
                  <span className="shrink-0 text-ink-400">
                    {item.quantity}× · {cedis(item.totalCedis)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (!event) {
    return (
      <p className="rounded-xl border border-dashed border-ink-200 p-4 text-[13px] text-ink-400">
        No Accra Live events are on sale right now. Check back on Thursday — the weekend line-up
        publishes then.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold text-ink-900">What&apos;s on in Accra</h2>
        <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500">
          Tickets are paid with mobile money inside Seen. Your entry code appears on the next screen
          and is tied to your Seen identity.
        </p>
      </div>

      <div className="space-y-2">
        {events.map((item) => {
          const active = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setSelectedId(item.id);
                setQuantity(1);
              }}
              className={cn(
                "w-full rounded-xl border p-3 text-left transition-colors",
                active
                  ? "border-sun-400 bg-sun-50"
                  : "border-ink-100 bg-white hover:border-ink-200",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-semibold text-ink-900">{item.name}</div>
                  <div className="mt-0.5 text-[12px] text-ink-500">
                    {item.venue} · {item.area}
                  </div>
                  <div className="mt-0.5 text-[12px] text-ink-500">
                    {longDate(item.startsAt)} · {timeOfDay(item.startsAt)}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="metric text-[13px] font-semibold text-ink-900">
                    {cedis(item.priceCedis)}
                  </div>
                  <div className="text-[10px] text-ink-400">{item.remaining} left</div>
                </div>
              </div>
              <p className="mt-1.5 text-[11px] leading-relaxed text-ink-400">{item.blurb}</p>
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-ink-100 bg-ink-50/70 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] font-medium text-ink-700">Quantity</span>
          <div className="inline-flex items-center gap-3">
            <button
              type="button"
              aria-label="Remove one ticket"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={quantity <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden />
            </button>
            <span className="metric w-6 text-center text-base font-semibold text-ink-900">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Add one ticket"
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              disabled={quantity >= maxQuantity}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-700 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between border-t border-ink-100 pt-2 text-[13px]">
          <span className="text-ink-500">
            {quantity} × {cedis(event.priceCedis)}
          </span>
          <span className="metric text-base font-semibold text-ink-900">{cedis(total)}</span>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-[#FBEAE5] px-3 py-2 text-[12px] font-medium text-[#A8442A]"
        >
          {error}
        </p>
      )}

      <Button size="lg" className="w-full" onClick={pay} disabled={busy || quantity < 1}>
        <Wallet className="h-4 w-4" aria-hidden />
        {busy ? "Opening MoMo…" : `Pay with MoMo · ${cedis(total)}`}
      </Button>
      <p className="text-[11px] leading-relaxed text-ink-400">
        MTN MoMo, Telecel Cash, AT Money or card. This preview stops short of the Paystack prompt —
        no real mobile money charge is made.
      </p>
    </div>
  );
}
