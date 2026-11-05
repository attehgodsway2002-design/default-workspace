"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiscoverOption {
  id: string;
  label: string;
}

export function DiscoverControls({
  categories,
  corridors,
  initial,
  sortOptions,
}: {
  categories: DiscoverOption[];
  corridors: DiscoverOption[];
  initial: { q: string; corridor: string; category: string; tier: string; sort: string };
  sortOptions: DiscoverOption[];
}) {
  const router = useRouter();
  const [q, setQ] = React.useState(initial.q);
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = React.useCallback(
    (patch: Partial<typeof initial>) => {
      const params = new URLSearchParams();
      const merged = { ...initial, q, ...patch };
      if (merged.q) params.set("q", merged.q);
      if (merged.corridor && merged.corridor !== "all") params.set("corridor", merged.corridor);
      if (merged.category && merged.category !== "all") params.set("category", merged.category);
      if (merged.tier && merged.tier !== "all") params.set("tier", merged.tier);
      if (merged.sort && merged.sort !== "relevance") params.set("sort", merged.sort);
      const qs = params.toString();
      router.push(qs ? `/discover?${qs}` : "/discover", { scroll: false });
    },
    [initial, q, router],
  );

  const onSearch = (value: string) => {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => push({ q: value }), 350);
  };

  const activeFilters = [initial.corridor !== "all", initial.category !== "all", initial.tier !== "all"].filter(
    Boolean,
  ).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-2xl border border-ink-100 bg-white p-1.5 shadow-card">
        <div className="flex flex-1 items-center gap-2 pl-3">
          <Search className="h-4 w-4 shrink-0 text-ink-400" />
          <input
            value={q}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search a dish, a service or a landmark"
            className="h-10 w-full bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-300"
            aria-label="Search businesses"
          />
          {q && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="rounded-full p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-[12.5px] font-medium",
            activeFilters
              ? "border-sun-200 bg-sun-50 text-sun-700"
              : "border-ink-100 bg-white text-ink-600 hover:border-ink-200",
          )}
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilters > 0 && (
            <span className="metric rounded-full bg-sun-500 px-1.5 text-[10px] text-white">{activeFilters}</span>
          )}
        </button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => push({ category: "all" })}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
            initial.category === "all"
              ? "border-ink-900 bg-ink-900 text-white"
              : "border-ink-100 bg-white text-ink-600 hover:border-ink-200",
          )}
        >
          All categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => push({ category: category.id })}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium",
              initial.category === category.id
                ? "border-ink-900 bg-ink-900 text-white"
                : "border-ink-100 bg-white text-ink-600 hover:border-ink-200",
            )}
          >
            {category.label}
          </button>
        ))}
      </div>

      {open && (
        <div className="grid gap-3 rounded-2xl border border-ink-100 bg-white p-4 shadow-card sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Corridor
            </span>
            <div className="relative">
              <select
                value={initial.corridor}
                onChange={(event) => push({ corridor: event.target.value })}
                className="h-10 w-full appearance-none rounded-xl border border-ink-200 bg-white px-3 pr-8 text-[13px] text-ink-800 outline-none focus:border-sun-400"
              >
                <option value="all">All corridors</option>
                {corridors.map((corridor) => (
                  <option key={corridor.id} value={corridor.id}>
                    {corridor.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-ink-300" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Visibility tier
            </span>
            <div className="relative">
              <select
                value={initial.tier}
                onChange={(event) => push({ tier: event.target.value })}
                className="h-10 w-full appearance-none rounded-xl border border-ink-200 bg-white px-3 pr-8 text-[13px] text-ink-800 outline-none focus:border-sun-400"
              >
                <option value="all">Every tier</option>
                <option value="billboard">Billboard only</option>
                <option value="boost">Boost only</option>
                <option value="starter">Starter (free listings)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-ink-300" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
              Sort by
            </span>
            <div className="relative">
              <select
                value={initial.sort}
                onChange={(event) => push({ sort: event.target.value })}
                className="h-10 w-full appearance-none rounded-xl border border-ink-200 bg-white px-3 pr-8 text-[13px] text-ink-800 outline-none focus:border-sun-400"
              >
                {sortOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-ink-300" />
            </div>
          </label>
          <div className="sm:col-span-3 flex items-center justify-between">
            <p className="text-[11px] text-ink-400">
              Ranking = paid tier + quality score. Paid never outranks a badly reviewed listing.
            </p>
            <Link href="/discover" className="text-[12px] font-medium text-ink-600 hover:text-ink-900">
              Reset all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
