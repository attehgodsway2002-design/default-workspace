"use client";

import * as React from "react";
import { cedis } from "@/lib/format";

const PLANS = [
  { id: "boost", label: "Boost", price: 99 },
  { id: "billboard", label: "Billboard", price: 249 },
];

/**
 * The ROI conversation every Ghanaian merchant actually has: how many extra
 * customers does this need to bring before it pays for itself?
 */
export function RoiCalculator({ defaultTicket }: { defaultTicket: number }) {
  const [ticket, setTicket] = React.useState(defaultTicket);
  const [margin, setMargin] = React.useState(60);
  const [customers, setCustomers] = React.useState(1);
  const [plan, setPlan] = React.useState("boost");

  const price = PLANS.find((p) => p.id === plan)?.price ?? 99;
  const grossProfit = ticket * customers * 30 * (margin / 100);
  const multiple = grossProfit / price;
  const customersToBreakEven = price / ((ticket * margin) / 100) / 30;

  return (
    <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[17px] font-semibold text-ink-900">What does it need to bring you?</h3>
          <p className="mt-1 text-[12.5px] text-ink-500">
            Seen measures visits, not impressions. Here is the arithmetic a merchant does before
            paying GH₵99.
          </p>
        </div>
        <div className="flex rounded-xl border border-ink-100 p-1">
          {PLANS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPlan(option.id)}
              className={
                plan === option.id
                  ? "rounded-lg bg-ink-900 px-3 py-1.5 text-[12px] font-semibold text-white"
                  : "rounded-lg px-3 py-1.5 text-[12px] font-medium text-ink-500 hover:text-ink-800"
              }
            >
              {option.label} · {cedis(option.price)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Average ticket (GH₵)
          </span>
          <input
            type="number"
            min={5}
            max={2000}
            value={ticket}
            onChange={(event) => setTicket(Math.max(5, Number(event.target.value) || 5))}
            className="h-10 w-full rounded-xl border border-ink-200 px-3 text-[14px] text-ink-900 outline-none focus:border-sun-400"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Gross margin ({margin}%)
          </span>
          <input
            type="range"
            min={20}
            max={90}
            value={margin}
            onChange={(event) => setMargin(Number(event.target.value))}
            className="mt-3 w-full accent-sun-500"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            Extra customers per day
          </span>
          <input
            type="number"
            min={1}
            max={60}
            value={customers}
            onChange={(event) => setCustomers(Math.max(1, Number(event.target.value) || 1))}
            className="h-10 w-full rounded-xl border border-ink-200 px-3 text-[14px] text-ink-900 outline-none focus:border-sun-400"
          />
        </label>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-ink-900 p-4 text-white">
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-white/45">Monthly gross profit</div>
          <div className="metric mt-1 text-2xl font-semibold">{cedis(grossProfit)}</div>
          <div className="mt-1 text-[11px] text-white/50">
            {customers} customers/day × GH₵{ticket} × {margin}%
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-ink-400">Return on the plan</div>
          <div className="metric mt-1 text-2xl font-semibold text-ink-900">
            {multiple >= 1 ? `${multiple.toFixed(1)}x` : `${(multiple * 100).toFixed(0)}%`}
          </div>
          <div className="mt-1 text-[11px] text-ink-400">against {cedis(price)}/month</div>
        </div>
        <div className="rounded-2xl border border-ink-100 p-4">
          <div className="text-[10.5px] uppercase tracking-[0.1em] text-ink-400">Break-even</div>
          <div className="metric mt-1 text-2xl font-semibold text-ink-900">
            {customersToBreakEven <= 1
              ? `${Math.ceil(customersToBreakEven * 30)} customers/mo`
              : `${Math.ceil(customersToBreakEven * 30)} customers/mo`}
          </div>
          <div className="mt-1 text-[11px] text-ink-400">
            ≈ {Math.max(1, Math.ceil(customersToBreakEven))} extra customer{customersToBreakEven > 1 ? "s" : ""} a day
          </div>
        </div>
      </div>

      <p className="mt-4 text-[11.5px] leading-relaxed text-ink-400">
        A GH₵{ticket} ticket at {margin}% margin is worth GH₵{((ticket * margin) / 100).toFixed(0)} of
        gross profit. {cedis(price)} a month pays for itself with{" "}
        {Math.max(1, Math.ceil(customersToBreakEven * 30))} extra customers across the whole month —
        before counting the customers who find you and never tell you.
      </p>
    </div>
  );
}
