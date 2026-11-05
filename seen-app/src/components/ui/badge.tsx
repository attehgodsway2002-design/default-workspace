import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "ink" | "sun" | "green" | "clay" | "outline" | "gold";

const TONES: Record<Tone, string> = {
  neutral: "bg-ink-50 text-ink-600",
  ink: "bg-ink-900 text-white",
  sun: "bg-sun-100 text-sun-700",
  green: "bg-[#E7F3EC] text-[#1E6B4F]",
  clay: "bg-[#FBEAE5] text-[#A8442A]",
  gold: "bg-[#FBF1DA] text-[#8a6314]",
  outline: "border border-ink-200 text-ink-600 bg-white",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

export function TierBadge({ tier }: { tier: "starter" | "boost" | "billboard" }) {
  if (tier === "billboard") return <Badge tone="ink">Billboard</Badge>;
  if (tier === "boost") return <Badge tone="sun">Boost</Badge>;
  return <Badge tone="outline">Starter</Badge>;
}
