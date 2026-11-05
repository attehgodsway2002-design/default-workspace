import Link from "next/link";
import { MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { MerchantCard } from "@/components/consumer/merchant-card";
import { DiscoverControls } from "@/components/consumer/discover-controls";
import { MapPanel } from "@/components/consumer/map-panel";
import { Badge } from "@/components/ui/badge";
import { cedis } from "@/lib/format";
import {
  getCorridor,
  getCategory,
  listCategories,
  listCorridors,
  searchMerchants,
} from "@/lib/db/public";
import type { CategoryId, CorridorId, Tier } from "@/lib/types";

export const dynamic = "force-dynamic";

const SUGGESTIONS = ["jollof", "barber", "phone repair", "pharmacy", "coworking", "gym"];

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    corridor?: string;
    category?: string;
    tier?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").slice(0, 80);
  const corridorParam = params.corridor ?? "all";
  const categoryParam = params.category ?? "all";
  const tierParam = params.tier ?? "all";
  const sortParam = params.sort ?? "relevance";

  const corridors = listCorridors().filter((c) => c.live);
  const categories = listCategories();
  const corridorId = corridors.some((c) => c.id === corridorParam)
    ? (corridorParam as CorridorId)
    : ("all" as const);
  const categoryId = categories.some((c) => c.id === categoryParam)
    ? (categoryParam as CategoryId)
    : ("all" as const);
  const tier: Tier | "all" = ["billboard", "boost", "starter"].includes(tierParam)
    ? (tierParam as Tier)
    : "all";

  const activeCorridor = corridorId === "all" ? corridors[0]! : getCorridor(corridorId)!;
  const results = searchMerchants({
    q,
    corridorId,
    categoryId,
    tier,
    sort: (["relevance", "rating", "distance", "reviews"].includes(sortParam)
      ? sortParam
      : "relevance") as "relevance" | "rating" | "distance" | "reviews",
    from: activeCorridor.center,
    limit: 60,
  });

  const billboardCount = results.filter((r) => r.merchant.tier === "billboard").length;
  const boostCount = results.filter((r) => r.merchant.tier === "boost").length;
  const categoryName = categoryId === "all" ? "all categories" : getCategory(categoryId)?.name;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <div className="border-b border-ink-100 bg-white">
        <div className="container py-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                <MapPin className="h-3.5 w-3.5" />
                {corridorId === "all" ? "Osu + East Legon" : activeCorridor.name}
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.015em] text-ink-900">
                {q ? `â€œ${q}â€ in ${corridorId === "all" ? "Accra" : activeCorridor.name.split(" â€” ")[0]}` : "What's good nearby"}
              </h1>
              <p className="mt-1 text-[13px] text-ink-500">
                {results.length} verified {results.length === 1 ? "place" : "places"} Â·{" "}
                {categoryName} Â· {billboardCount} Billboard, {boostCount} Boost
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-ink-400">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1E6B4F]" />
              Every listing verified on site by a Seen rep
            </div>
          </div>

          <div className="mt-4">
            <DiscoverControls
              categories={categories.map((c) => ({ id: c.id, label: c.name }))}
              corridors={corridors.map((c) => ({ id: c.id, label: c.name }))}
              initial={{
                q,
                corridor: corridorId,
                category: categoryId,
                tier,
                sort: sortParam,
              }}
              sortOptions={[
                { id: "relevance", label: "Best match (paid + quality)" },
                { id: "rating", label: "Highest rated" },
                { id: "reviews", label: "Most reviewed" },
                { id: "distance", label: "Closest first" },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="container grid gap-6 py-6 lg:grid-cols-[1fr_400px]">
        <div>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-ink-50 text-ink-400">
                <MapPin className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-[17px] font-semibold text-ink-900">
                Nothing verified matches that yet
              </h2>
              <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-ink-500">
                We only list businesses a Seen rep has visited. Try a different corridor or one of
                these searches.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <Link
                    key={suggestion}
                    href={`/discover?q=${encodeURIComponent(suggestion)}`}
                    className="rounded-full border border-ink-200 px-3 py-1.5 text-[12px] font-medium text-ink-600 hover:border-ink-300 hover:bg-ink-50"
                  >
                    {suggestion}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map(({ merchant, distanceMetres: distance, highlights }) => (
                <MerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  distance={distance}
                  corridorName={getCorridor(merchant.corridorId)?.name.split(" â€” ")[0]}
                  reason={highlights?.[0]}
                />
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-col items-start justify-between gap-3 rounded-2xl border border-dashed border-ink-200 bg-white/60 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-sun-600">
                <Sparkles className="h-3.5 w-3.5" /> For business owners
              </div>
              <p className="mt-1 text-[13.5px] font-medium text-ink-900">
                {billboardCount > 0
                  ? "Billboard and Boost placements are sold per corridor and category."
                  : "Be the first verified business in your category here."}
              </p>
              <p className="text-[12.5px] text-ink-500">
                Boost {cedis(99)}/month Â· Billboard {cedis(249)}/month Â· Starter is free.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex h-10 shrink-0 items-center rounded-xl bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
            >
              See placement &amp; pricing
            </Link>
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <MapPanel
            corridor={activeCorridor.name}
            center={activeCorridor.center}
            height={560}
            merchants={results.slice(0, 40).map(({ merchant }) => ({
              id: merchant.id,
              slug: merchant.slug,
              name: merchant.name,
              lat: merchant.gps.lat,
              lng: merchant.gps.lng,
              tier: merchant.tier,
              category: getCategory(merchant.categoryId)?.name ?? merchant.categoryId,
            }))}
          />
          <div className="mt-3 rounded-2xl border border-ink-100 bg-white p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
              How ranking works
            </div>
            <ol className="mt-2 space-y-2 text-[12px] leading-relaxed text-ink-600">
              <li className="flex gap-2">
                <Badge tone="ink">1</Badge>
                Billboard merchants rank first in their category and corridor.
              </li>
              <li className="flex gap-2">
                <Badge tone="sun">2</Badge>
                Boost merchants rank next, within a 2 km radius.
              </li>
              <li className="flex gap-2">
                <Badge tone="outline">3</Badge>
                Everyone else by quality score: rating, reviews, photos and verification.
              </li>
            </ol>
            <p className="mt-2 text-[11px] leading-relaxed text-ink-400">
              A paid listing with bad reviews can still fall below a 4.8-star free listing. Paid
              placement buys attention, not trust.
            </p>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}

