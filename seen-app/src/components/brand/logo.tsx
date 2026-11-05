import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  tone = "ink",
  showWordmark = true,
}: {
  className?: string;
  tone?: "ink" | "light";
  showWordmark?: boolean;
}) {
  const ink = tone === "ink" ? "#0B2E4A" : "#FFFFFF";
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", className)} aria-label="Seen home">
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden>
        <rect width="32" height="32" rx="9" fill={ink} />
        <circle cx="16" cy="16" r="7.4" stroke="#E0A526" strokeWidth="2" />
        <circle cx="16" cy="16" r="2.6" fill="#E0A526" />
        <path
          d="M16 4.6v3.2M16 24.2v3.2M4.6 16h3.2M24.2 16h3.2"
          stroke={tone === "ink" ? "#FFFFFF" : "#0B2E4A"}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.85"
        />
      </svg>
      {showWordmark && (
        <span
          className="text-[19px] font-semibold tracking-[-0.02em]"
          style={{ color: tone === "ink" ? "#0B2E4A" : "#FFFFFF" }}
        >
          seen<span style={{ color: "#C16A1E" }}>.</span>
        </span>
      )}
    </Link>
  );
}
