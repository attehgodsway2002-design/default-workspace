import * as React from "react";
import { cn } from "@/lib/utils";
import { compact, shortDay } from "@/lib/format";

/* Server-rendered SVG charts — no chart library, no client JS. */

export function TrendChart({
  data,
  height = 180,
  label = "Impressions",
  secondaryLabel,
  className,
}: {
  data: { day: string; value: number; secondary?: number }[];
  height?: number;
  label?: string;
  secondaryLabel?: string;
  className?: string;
}) {
  if (!data.length) {
    return (
      <div className={cn("flex h-[180px] items-center justify-center text-sm text-ink-400", className)}>
        No data in this window yet.
      </div>
    );
  }

  const width = 760;
  const padX = 8;
  const padTop = 12;
  const padBottom = 22;
  const innerH = height - padTop - padBottom;
  const max = Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0)), 1);
  const stepX = (width - padX * 2) / Math.max(1, data.length - 1);

  const points = (key: "value" | "secondary") =>
    data.map((d, i) => {
      const v = (d[key] ?? 0) as number;
      return [padX + i * stepX, padTop + innerH - (v / max) * innerH] as const;
    });

  const line = (pts: readonly (readonly [number, number])[]) =>
    pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const primary = points("value");
  const hasSecondary = data.some((d) => typeof d.secondary === "number");
  const secondary = hasSecondary ? points("secondary") : [];
  const area = `${line(primary)} L${width - padX},${padTop + innerH} L${padX},${padTop + innerH} Z`;

  return (
    <div className={cn("w-full", className)}>
      <div className="mb-2 flex items-center justify-between text-[11px] text-ink-400">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sun-500" /> {label}
          </span>
          {hasSecondary && secondaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-ink-300" /> {secondaryLabel}
            </span>
          )}
        </div>
        <span>peak {compact(max)}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`${label} trend across ${data.length} days`}
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C16A1E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#C16A1E" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={width - padX}
            y1={padTop + innerH * f}
            y2={padTop + innerH * f}
            stroke="rgba(11,46,74,0.08)"
            strokeDasharray={f === 1 ? "" : "3 5"}
          />
        ))}
        <path d={area} fill="url(#trendFill)" />
        <path d={line(primary)} fill="none" stroke="#C16A1E" strokeWidth={2.2} strokeLinejoin="round" />
        {hasSecondary && (
          <path
            d={line(secondary)}
            fill="none"
            stroke="#93AFC5"
            strokeWidth={1.6}
            strokeDasharray="4 4"
            strokeLinejoin="round"
          />
        )}
        <text x={padX} y={height - 6} fontSize={10} fill="#7c8b99">
          {shortDay(data[0]!.day)}
        </text>
        <text x={width - padX} y={height - 6} fontSize={10} fill="#7c8b99" textAnchor="end">
          {shortDay(data[data.length - 1]!.day)}
        </text>
      </svg>
    </div>
  );
}

export function Sparkline({
  values,
  className,
  stroke = "#1E6B4F",
}: {
  values: number[];
  className?: string;
  stroke?: string;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const w = 120;
  const h = 36;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / Math.max(1, max - min)) * (h - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cn("h-9 w-[120px]", className)} aria-hidden>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.8} strokeLinejoin="round" />
    </svg>
  );
}

export function BarList({
  items,
  className,
  accent = "#0B2E4A",
}: {
  items: { label: string; value: number; hint?: string }[];
  className?: string;
  accent?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={cn("space-y-2.5", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-baseline justify-between text-[13px]">
            <span className="font-medium text-ink-700">{item.label}</span>
            <span className="metric text-ink-500">
              {compact(item.value)}
              {item.hint && <span className="ml-1.5 text-ink-300">{item.hint}</span>}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-50">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%`, background: accent }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Funnel({
  steps,
  className,
}: {
  steps: { label: string; value: number }[];
  className?: string;
}) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <div className={cn("space-y-2", className)}>
      {steps.map((step, index) => {
        const prev = index === 0 ? step.value : steps[index - 1]!.value;
        const conversion = prev ? step.value / prev : 0;
        const width = Math.max(6, (step.value / top) * 100);
        return (
          <div key={step.label}>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-ink-600">{step.label}</span>
              <span className="metric font-medium text-ink-800">
                {step.value.toLocaleString("en-GH")}
                {index > 0 && (
                  <span className="ml-2 text-[11px] font-normal text-ink-400">
                    {(conversion * 100).toFixed(1)}% step
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1 h-6 w-full rounded-md bg-ink-50">
              <div
                className="flex h-6 items-center rounded-md px-2 text-[10px] font-semibold text-white"
                style={{
                  width: `${width}%`,
                  background: `linear-gradient(90deg, rgba(11,46,74,0.92), rgba(11,46,74,0.72))`,
                }}
              >
                {width > 18 ? ((step.value / top) * 100).toFixed(1) + "%" : ""}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
