import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-100 bg-white shadow-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-5 pb-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-[13px] font-semibold uppercase tracking-[0.08em] text-ink-400", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-ink-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-2 p-5 pt-0", className)} {...props} />;
}

export function Stat({
  label,
  value,
  delta,
  hint,
  className,
}: {
  label: string;
  value: React.ReactNode;
  delta?: number;
  hint?: string;
  className?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className={cn("rounded-2xl border border-ink-100 bg-white p-4 shadow-card", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.09em] text-ink-400">{label}</div>
      <div className="mt-1 flex items-end gap-2">
        <div className="metric text-2xl font-semibold text-ink-900">{value}</div>
        {typeof delta === "number" && (
          <div
            className={cn(
              "metric mb-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
              positive ? "bg-[#E7F3EC] text-[#1E6B4F]" : "bg-[#FBEAE5] text-[#A8442A]",
            )}
          >
            {positive ? "+" : ""}
            {(delta * 100).toFixed(1)}%
          </div>
        )}
      </div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  );
}
