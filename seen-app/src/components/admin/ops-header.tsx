import { longDate } from "@/lib/format";

/** Ops strip: corridor coverage, today's date and the Kente rule. */
export function OpsHeader() {
  const today = longDate(new Date().toISOString());
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink-700 shadow-card">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E6B4F] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1E6B4F]" />
          </span>
          Osu + East Legon live
        </span>
        <span className="text-[12px] font-medium text-ink-400">{today}</span>
      </div>
      <div className="kente-strip mt-3 h-1.5 w-full rounded-full" aria-hidden />
    </div>
  );
}
