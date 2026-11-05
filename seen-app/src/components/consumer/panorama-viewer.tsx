"use client";

import * as React from "react";
import { Compass, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Equirectangular strip viewer for Seen's 360° storefront tours.
 * Drag (or arrow keys) to look around; auto-pans gently until first interaction.
 */
export function PanoramaViewer({
  src,
  label,
  className,
}: {
  src: string;
  label: string;
  className?: string;
}) {
  const [pos, setPos] = React.useState(42);
  const [dragging, setDragging] = React.useState(false);
  const [touched, setTouched] = React.useState(false);
  const last = React.useRef<{ x: number; pos: number } | null>(null);
  const frame = React.useRef<number | null>(null);
  const direction = React.useRef(1);

  // Gentle auto-pan until the user takes over.
  React.useEffect(() => {
    if (touched || dragging) return;
    const tick = () => {
      setPos((current) => {
        let next = current + direction.current * 0.06;
        if (next > 88) {
          direction.current = -1;
          next = 88;
        }
        if (next < 12) {
          direction.current = 1;
          next = 12;
        }
        return next;
      });
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [touched, dragging]);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-ink-100 bg-ink-900",
        className,
      )}
    >
      <div
        role="img"
        aria-label={`${label} — 360 degree preview`}
        className={cn(
          "aspect-[16/7] w-full cursor-grab select-none bg-no-repeat",
          dragging && "cursor-grabbing",
        )}
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: "200% 100%",
          backgroundPosition: `${pos}% 50%`,
        }}
        onPointerDown={(event) => {
          setTouched(true);
          setDragging(true);
          last.current = { x: event.clientX, pos };
          (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging || !last.current) return;
          const delta = ((event.clientX - last.current.x) / (event.currentTarget.clientWidth || 1)) * -100;
          setPos(Math.min(100, Math.max(0, last.current.pos + delta * 1.6)));
        }}
        onPointerUp={() => {
          setDragging(false);
          last.current = null;
        }}
        onPointerLeave={() => {
          setDragging(false);
          last.current = null;
        }}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
          if (event.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/55 via-transparent to-ink-950/20" />

      <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-ink-950/70 px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white backdrop-blur">
        <Compass className="h-3 w-3 text-[#E0A526]" /> 360° · Seen verified
      </div>

      <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10.5px] font-medium text-ink-700 shadow-sm">
        <MoveHorizontal className="h-3 w-3" /> Drag to look around
      </div>

      <div className="absolute inset-x-1/2 bottom-3 h-1 w-24 -translate-x-1/2 rounded-full bg-white/25">
        <div
          className="h-1 rounded-full bg-[#E0A526]"
          style={{ width: `${Math.max(10, Math.min(90, pos))}%` }}
        />
      </div>
    </div>
  );
}
