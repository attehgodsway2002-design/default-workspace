"use client";

import * as React from "react";
import Link from "next/link";
import { Navigation, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MapMerchant {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  tier: "starter" | "boost" | "billboard";
  category: string;
}

/**
 * Corridor map.
 *
 * With NEXT_PUBLIC_MAPBOX_TOKEN set this mounts Mapbox GL JS. Without a token it
 * renders a hand-built vector map of the corridor (streets, blocks, pins) so the
 * product is fully usable offline — no broken tiles, no grey box.
 */
export function MapPanel({
  merchants,
  corridor,
  center,
  height = 520,
}: {
  merchants: MapMerchant[];
  corridor: string;
  center: { lat: number; lng: number };
  height?: number;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [selected, setSelected] = React.useState<MapMerchant | null>(null);

  if (token) {
    return (
      <MapboxPanel
        merchants={merchants}
        center={center}
        token={token}
        onSelect={setSelected}
        selected={selected}
        height={height}
      />
    );
  }

  // Normalise lat/lng into the drawing box with padding.
  const lats = merchants.map((m) => m.lat);
  const lngs = merchants.map((m) => m.lng);
  const pad = 0.0016;
  const north = Math.max(center.lat + 0.006, ...lats) + pad;
  const south = Math.min(center.lat - 0.006, ...lats) - pad;
  const west = Math.min(center.lng - 0.007, ...lngs) - pad;
  const east = Math.max(center.lng + 0.007, ...lngs) + pad;

  const project = (lat: number, lng: number) => {
    const x = ((lng - west) / (east - west)) * 100;
    const y = ((north - lat) / (north - south)) * 100;
    return { x, y };
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-ink-100 bg-[#F1F5F8]"
      style={{ height }}
    >
      {/* streets */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="blocks" width="7" height="7" patternUnits="userSpaceOnUse">
            <rect width="7" height="7" fill="#EDF2F6" />
            <rect x="0.4" y="0.4" width="6.2" height="6.2" rx="0.5" fill="#E3EBF1" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#blocks)" />
        {/* Oxford Street */}
        <path d="M -5 72 L 105 38" stroke="#FFFFFF" strokeWidth="4.2" />
        <path d="M -5 72 L 105 38" stroke="#D8E2EA" strokeWidth="0.35" />
        {/* Ring road */}
        <path d="M 18 -5 L 26 105" stroke="#FFFFFF" strokeWidth="3.4" />
        <path d="M 62 -5 L 58 105" stroke="#FFFFFF" strokeWidth="2.6" />
        {/* side streets */}
        <path d="M -5 30 L 105 22" stroke="#FFFFFF" strokeWidth="1.8" />
        <path d="M -5 88 L 105 80" stroke="#FFFFFF" strokeWidth="1.6" />
        <path d="M 82 -5 L 88 105" stroke="#FFFFFF" strokeWidth="1.6" />
        <path d="M 40 20 L 44 78" stroke="#FFFFFF" strokeWidth="1.2" />
        {/* green space */}
        <rect x="66" y="58" width="16" height="14" rx="2" fill="#DFEDE3" />
        <text x="74" y="66.5" fontSize="2.1" fill="#7FA88C" textAnchor="middle">
          park
        </text>
      </svg>

      {/* street labels */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-[6%] top-[74%] -rotate-[17deg] text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-300">
          Oxford Street
        </span>
        <span className="absolute left-[22%] top-[8%] rotate-[83deg] text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-300">
          Ring Road
        </span>
      </div>

      {/* pins */}
      {merchants.map((merchant) => {
        const { x, y } = project(merchant.lat, merchant.lng);
        const isSelected = selected?.id === merchant.id;
        return (
          <button
            key={merchant.id}
            type="button"
            onClick={() => setSelected(isSelected ? null : merchant)}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            aria-label={merchant.name}
          >
            <span
              className={cn(
                "block h-3.5 w-3.5 rounded-full border-2 border-white shadow transition-transform group-hover:scale-125",
                merchant.tier === "billboard"
                  ? "bg-sun-500"
                  : merchant.tier === "boost"
                    ? "bg-ink-800"
                    : "bg-ink-300",
                isSelected && "scale-125 ring-4 ring-sun-200",
              )}
            />
            {merchant.tier === "billboard" && (
              <span className="absolute left-1/2 top-4 hidden -translate-x-1/2 whitespace-nowrap rounded bg-white px-1.5 py-0.5 text-[9px] font-semibold text-ink-800 shadow group-hover:block">
                {merchant.name}
              </span>
            )}
          </button>
        );
      })}

      {/* legend */}
      <div className="absolute bottom-3 left-3 rounded-xl border border-ink-100 bg-white/95 p-2.5 text-[10.5px] shadow-sm backdrop-blur">
        <div className="mb-1.5 font-semibold uppercase tracking-[0.08em] text-ink-400">
          {corridor}
        </div>
        {[
          ["bg-sun-500", "Billboard"],
          ["bg-ink-800", "Boost"],
          ["bg-ink-300", "Starter (free)"],
        ].map(([dot, label]) => (
          <div key={label} className="flex items-center gap-1.5 py-0.5 text-ink-600">
            <span className={cn("h-2 w-2 rounded-full", dot)} />
            {label}
          </div>
        ))}
        <div className="mt-1 text-[9.5px] text-ink-300">Tap a pin · no token required</div>
      </div>

      {/* selected card */}
      {selected && (
        <div className="absolute inset-x-3 bottom-3 rounded-xl border border-ink-100 bg-white p-3 shadow-lift sm:left-auto sm:right-3 sm:w-64">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="absolute right-2 top-2 rounded-full p-1 text-ink-400 hover:bg-ink-50"
            aria-label="Close"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-400">
            {selected.category}
          </div>
          <div className="mt-0.5 pr-6 text-[13px] font-semibold text-ink-900">{selected.name}</div>
          <Link
            href={`/business/${selected.slug}`}
            className="mt-2 inline-flex h-8 items-center gap-1.5 rounded-lg bg-ink-900 px-2.5 text-[11.5px] font-semibold text-white"
          >
            <Navigation className="h-3 w-3" /> Open listing
          </Link>
        </div>
      )}
    </div>
  );
}

function MapboxPanel({
  merchants,
  center,
  token,
  onSelect,
  selected,
  height,
}: {
  merchants: MapMerchant[];
  center: { lat: number; lng: number };
  token: string;
  onSelect: (m: MapMerchant | null) => void;
  selected: MapMerchant | null;
  height: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<{ remove: () => void } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        await import("mapbox-gl/dist/mapbox-gl.css");
        if (cancelled || !ref.current) return;
        mapboxgl.accessToken = token;
        const map = new mapboxgl.Map({
          container: ref.current,
          style: "mapbox://styles/mapbox/light-v11",
          center: [center.lng, center.lat],
          zoom: 14.6,
          attributionControl: false,
        });
        mapRef.current = map;
        for (const merchant of merchants) {
          const el = document.createElement("button");
          el.className = "h-3.5 w-3.5 rounded-full border-2 border-white shadow";
          el.style.background =
            merchant.tier === "billboard" ? "#C16A1E" : merchant.tier === "boost" ? "#173A54" : "#93AFC5";
          el.setAttribute("aria-label", merchant.name);
          el.addEventListener("click", () => onSelect(merchant));
          new mapboxgl.Marker({ element: el }).setLngLat([merchant.lng, merchant.lat]).addTo(map);
        }
      } catch {
        /* Mapbox unavailable — the vector fallback below keeps the page usable */
      }
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [merchants, center, token, onSelect]);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-ink-100" style={{ height }}>
      <div ref={ref} className="h-full w-full" />
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[10.5px] font-semibold text-ink-600 shadow-sm">
        Mapbox · {merchants.length} pins
      </div>
      {selected && (
        <div className="absolute inset-x-3 bottom-3 rounded-xl bg-white p-3 shadow-lift sm:left-auto sm:right-3 sm:w-60">
          <div className="text-[13px] font-semibold text-ink-900">{selected.name}</div>
          <Link
            href={`/business/${selected.slug}`}
            className="mt-2 inline-flex h-8 items-center rounded-lg bg-ink-900 px-2.5 text-[11.5px] font-semibold text-white"
          >
            Open listing
          </Link>
        </div>
      )}
    </div>
  );
}
