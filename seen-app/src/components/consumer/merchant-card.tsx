import Link from "next/link";
import { Badge, TierBadge } from "@/components/ui/badge";
import { cedis } from "@/lib/format";
import { distanceLabel } from "@/lib/ghana";
import { TrackLink } from "@/components/consumer/track-link";
import type { Merchant } from "@/lib/types";

const PRICE_LABEL = ["", "₵", "₵₵", "₵₵₵"];

export function MerchantCard({
  merchant,
  distance,
  corridorName,
  featured = false,
  reason,
}: {
  merchant: Merchant;
  distance?: number | null;
  corridorName?: string;
  featured?: boolean;
  reason?: string;
}) {
  const photo = merchant.photos[0] ?? "/photos/food-1.svg";
  return (
    <article className="group overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card transition-shadow hover:shadow-lift">
      <TrackLink
        href={`/business/${merchant.slug}`}
        merchantId={merchant.id}
        source="feed"
        className="block"
      >
        <div className="relative aspect-[16/9] overflow-hidden bg-ink-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={`${merchant.name} storefront`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
          <div className="absolute left-3 top-3 flex items-center gap-1.5">
            <TierBadge tier={merchant.tier} />
            {merchant.founding && <Badge tone="gold">Founding</Badge>}
          </div>
          {merchant.panoramaUrl && (
            <div className="absolute right-3 top-3 rounded-full bg-ink-900/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              360°
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/70 to-transparent p-3">
            <div className="flex items-center justify-between text-white">
              <span className="text-[11px] font-medium uppercase tracking-[0.08em]">
                {corridorName ?? merchant.corridorId}
              </span>
              <span className="metric text-[12px] font-semibold">
                ★ {merchant.rating.toFixed(1)}
                <span className="ml-1 font-normal text-white/70">({merchant.reviewCount})</span>
              </span>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[15px] font-semibold leading-snug text-ink-900">{merchant.name}</h3>
            <span className="mt-0.5 shrink-0 text-[11px] font-medium text-ink-500">
              {PRICE_LABEL[merchant.priceBand]}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-500">
            {merchant.tagline}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-400">
            <span className="inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1E6B4F]" />
              {merchant.hours}
            </span>
            {typeof distance === "number" && (
              <span>{distanceLabel(distance)} away</span>
            )}
            {featured && merchant.tier === "billboard" && (
                <span className="text-sun-600">Billboard spot</span>
              )}
          </div>
          {reason && (
            <div className="mt-2 inline-flex rounded-md bg-ink-50 px-2 py-0.5 text-[10.5px] font-medium text-ink-500">
              {reason}
            </div>
          )}
        </div>
      </TrackLink>
    </article>
  );
}

export function MerchantRow({
  merchant,
  corridorName,
  impressions,
}: {
  merchant: Merchant;
  corridorName: string;
  impressions: number;
}) {
  return (
    <Link
      href={`/business/${merchant.slug}`}
      className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 transition-colors hover:border-ink-200 hover:bg-ink-50/40"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={merchant.photos[0] ?? "/photos/food-1.svg"}
        alt=""
        className="h-12 w-12 shrink-0 rounded-lg object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink-900">{merchant.name}</div>
        <div className="truncate text-[11.5px] text-ink-400">
          {corridorName} · {cedis(merchant.tier === "billboard" ? 249 : 99)}/mo
        </div>
      </div>
      <div className="text-right">
        <div className="metric text-[13px] font-semibold text-ink-800">
          {impressions.toLocaleString("en-GH")}
        </div>
        <div className="text-[10px] uppercase tracking-wide text-ink-400">impressions</div>
      </div>
    </Link>
  );
}
