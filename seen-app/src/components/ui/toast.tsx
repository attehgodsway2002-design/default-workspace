"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "success" | "error";
type ToastItem = { id: number; message: string; tone: Tone };

const EVENT = "seen:toast";

export function toast(message: string, tone: Tone = "default") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { message, tone } }));
}

export function Toaster() {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  React.useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ message: string; tone: Tone }>).detail;
      const id = Date.now() + Math.random();
      setItems((prev) => [...prev, { id, ...detail }]);
      setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 4200);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={cn(
            "pointer-events-auto animate-fade-up rounded-xl px-4 py-3 text-sm font-medium shadow-lift",
            item.tone === "success" && "bg-[#1E6B4F] text-white",
            item.tone === "error" && "bg-[#A8442A] text-white",
            item.tone === "default" && "bg-ink-900 text-white",
          )}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
