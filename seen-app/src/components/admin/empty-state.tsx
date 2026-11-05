import * as React from "react";
import { cn } from "@/lib/utils";

/** Mandatory empty state for every ops table and queue. */
export function EmptyState({
  title,
  detail,
  action,
  className,
}: {
  title: string;
  detail: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-4 py-7 text-center",
        className,
      )}
    >
      <div className="text-sm font-semibold text-ink-700">{title}</div>
      <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-400">{detail}</p>
      {action && <div className="mt-3 flex justify-center">{action}</div>}
    </div>
  );
}
