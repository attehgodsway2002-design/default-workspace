import type { MiniScope } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type ScopeCopy = Record<MiniScope, { label: string; detail: string; required: boolean }>;

type ChipTone = "neutral" | "outline" | "green" | "sun" | "ink";

/** Scope chips shared by the app store, the container chrome and consent UI. */
export function ScopeChips({
  scopes,
  scopeCopy,
  tone = "neutral",
  className,
}: {
  scopes: MiniScope[];
  scopeCopy: ScopeCopy;
  tone?: ChipTone;
  className?: string;
}) {
  if (scopes.length === 0) {
    return <span className="text-[12px] text-ink-300">No scopes requested</span>;
  }
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {scopes.map((scope) => (
        <Badge key={scope} tone={tone}>
          {scopeCopy[scope].label}
        </Badge>
      ))}
    </div>
  );
}
