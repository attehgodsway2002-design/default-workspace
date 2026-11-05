"use client";

import Link from "next/link";
import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Fires a single impression when the card scrolls into view, and a click event
 * when the merchant is opened. Beacons are fire-and-forget and de-duplicated
 * per session server-side.
 */
export function TrackLink({
  href,
  merchantId,
  source,
  className,
  children,
  event = "view",
}: {
  href: string;
  merchantId: string;
  source: "feed" | "search" | "map" | "qr" | "mini" | "direct";
  className?: string;
  children: React.ReactNode;
  event?: "view" | "map_click";
}) {
  const ref = React.useRef<HTMLAnchorElement>(null);
  const seen = React.useRef(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !seen.current) {
            seen.current = true;
            void fetch("/api/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ merchantId, type: "impression", source }),
              keepalive: true,
            });
            observer.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [merchantId, source]);

  return (
    <Link
      ref={ref}
      href={href}
      className={cn(className)}
      onClick={() => {
        void fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ merchantId, type: event, source }),
          keepalive: true,
        });
      }}
    >
      {children}
    </Link>
  );
}

/** Tracks a non-link action (phone tap, directions, QR redemption). */
export function TrackAction({
  merchantId,
  type,
  source,
  children,
  className,
  href,
  target,
  onClick,
  ariaLabel,
}: {
  merchantId: string;
  type: "phone_click" | "direction_request" | "qr_redemption";
  source: "feed" | "search" | "map" | "qr" | "mini" | "direct";
  children: React.ReactNode;
  className?: string;
  href?: string;
  target?: string;
  onClick?: () => void;
  ariaLabel?: string;
}) {
  const fire = () => {
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchantId, type, source }),
      keepalive: true,
    });
    onClick?.();
  };

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={target === "_blank" ? "noreferrer" : undefined}
        className={className}
        onClick={fire}
        aria-label={ariaLabel}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={className} onClick={fire} aria-label={ariaLabel}>
      {children}
    </button>
  );
}
