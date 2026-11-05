import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Calendar,
  Check,
  Clock,
  MapPin,
  Navigation,
  Phone,
  Star,
  Users,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { PanoramaViewer } from "@/components/consumer/panorama-viewer";
import { MapPanel } from "@/components/consumer/map-panel";
import { ViewBeacon } from "@/components/consumer/view-beacon";
import { TrackAction } from "@/components/consumer/track-link";
import { ShareButton } from "@/components/consumer/share-button";
import { Badge, TierBadge } from "@/components/ui/badge";
import { cedis } from "@/lib/format";
import { distanceLabel, distanceMetres, googleMapsDirections, prettyPhone, walkingMinutes } from "@/lib/ghana";
import { rankScore, getCategory, getCorridor, getMerchantBySlug, searchMerchants } from "@/lib/db/public";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant) return { title: "Business not found" };
  return {
    title: `${merchant.name} · ${getCategory(merchant.categoryId)?.name ?? "Local business"}`,
    description: merchant.tagline,
  };
}

const PRICE_BAND = ["", "Budget-friendly", "Mid-range", "Premium"];

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const merchant = getMerchantBySlug(slug);
  if (!merchant || merchant.status !== "verified") notFound();

  const category = getCategory(merchant.categoryId)!;
  const corridor = getCorridor(merchant.corridorId)!;
  const metres = distanceMetres(corridor.center, merchant.gps);
  const score = rankScore(merchant);
  const nearby = searchMerchants({
    corridorId: merchant.corridorId,
    categoryId: merchant.categoryId,
    from: merchant.gps,
    limit: 5,
  })
    .filter((r) => r.merchant.id !== merchant.id)
    .slice(0, 3);
  const bookable = ["beauty", "health", "fitness"].includes(merchant.categoryId);

  return (
    <div className="min-h-screen">
      <ViewBeacon merchantId={merchant.id} source="direct" />
      <SiteHeader />

      <div className="border-b border-ink-100 bg-white">
        <div className="container flex items-center gap-2 py-3 text-[12px] text-ink-400">
          <Link href="/discover" className="hover:text-ink-700">Discover</Link>
          <span>/</span>
          <Link href={`/discover?corridor=${corridor.id}`} className="hover:text-ink-700">
            {corridor.name}
          </Link>
          <span>/</span>
          <Link href={`/discover?category=${category.id}`} className="hover:text-ink-700">
            {category.name}
          </Link>
          <span>/</span>
          <span className="truncate text-ink-600">{merchant.name}</span>
        </div>
      </div>

      <div className="container grid gap-8 py-6 lg:grid-cols-[1.55fr_0.95fr]">
        <div>
          {/* gallery */}
          <div className="grid grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={merchant.photos[0]}
              alt={`${merchant.name} interior`}
              className="col-span-4 row-span-2 h-[300px] w-full object-cover sm:col-span-2 sm:h-[340px]"
            />
            {merchant.photos.slice(1, 3).map((photo, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo}
                src={photo}
                alt={`${merchant.name} detail ${index + 2}`}
                className="hidden h-[166px] w-full object-cover sm:block"
              />
            ))}
            <div className="relative hidden h-[166px] overflow-hidden sm:block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={merchant.photos[2] ?? merchant.photos[0]} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 grid place-items-center bg-ink-950/55 text-[11px] font-semibold uppercase tracking-[0.1em] text-white">
                Verified
                <br />
                on site
              </div>
            </div>
          </div>

          {/* identity */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <TierBadge tier={merchant.tier} />
              <Badge tone="outline">{category.name}</Badge>
              {merchant.founding && <Badge tone="gold">Founding merchant</Badge>}
              <span className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#1E6B4F]">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified {new Date(merchant.verifiedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              </span>
            </div>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.02em] text-ink-900">
              {merchant.name}
            </h1>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-600">{merchant.description}</p>

            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-500">
              <span className="inline-flex items-center gap-1.5 font-medium text-ink-800">
                <Star className="h-3.5 w-3.5 fill-[#E0A526] text-[#E0A526]" />
                {merchant.rating.toFixed(1)}
                <span className="font-normal text-ink-400">({merchant.reviewCount} reviews)</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> {merchant.hours}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {distanceLabel(metres)} · {walkingMinutes(metres)} min walk
              </span>
              <span>{PRICE_BAND[merchant.priceBand]}</span>
            </div>

            {/* actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              <TrackAction
                merchantId={merchant.id}
                type="direction_request"
                source="direct"
                href={googleMapsDirections(merchant.gps, merchant.name)}
                target="_blank"
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
                ariaLabel={`Get directions to ${merchant.name} in Google Maps`}
              >
                <Navigation className="h-4 w-4" /> Get directions
              </TrackAction>
              <TrackAction
                merchantId={merchant.id}
                type="phone_click"
                source="direct"
                href={`tel:${merchant.phone.replace(/\s/g, "")}`}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:border-ink-300"
                ariaLabel={`Call ${merchant.name}`}
              >
                <Phone className="h-4 w-4" /> {prettyPhone(merchant.phone)}
              </TrackAction>
              <a
                href={`https://wa.me/${merchant.whatsapp.replace(/[^\d]/g, "").replace(/^0/, "233")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:border-ink-300"
              >
                WhatsApp
              </a>
              {bookable && (
                <Link
                  href={`/mini/quickbook?merchant=${merchant.slug}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sun-500 px-4 text-[13px] font-semibold text-white hover:bg-sun-600"
                >
                  <Calendar className="h-4 w-4" /> Book with Seen
                </Link>
              )}
              <ShareButton name={merchant.name} />
            </div>
          </div>

          {/* 360 */}
          {merchant.panoramaUrl && (
            <section className="mt-8">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-[16px] font-semibold text-ink-900">Look inside before you go</h2>
                <span className="text-[11.5px] text-ink-400">Shot by the Seen field team</span>
              </div>
              <PanoramaViewer src={merchant.panoramaUrl} label={merchant.name} />
            </section>
          )}

          {/* about + amenities */}
          <section className="mt-8 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="text-[15px] font-semibold text-ink-900">About {merchant.name}</h2>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-600">{merchant.description}</p>
              <dl className="mt-4 space-y-2 text-[12.5px]">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" />
                  <div>
                    <dt className="font-medium text-ink-700">{merchant.landmark || corridor.name}</dt>
                    <dd className="text-ink-400">
                      GhanaPostGPS{" "}
                      <span className="metric font-semibold text-ink-700">{merchant.ghanapost}</span>
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-300" />
                  <div>
                    <dt className="font-medium text-ink-700">{merchant.hours}</dt>
                    <dd className="text-ink-400">Hours confirmed by the owner this month</dd>
                  </div>
                </div>
              </dl>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <h2 className="text-[15px] font-semibold text-ink-900">Good to know</h2>
              <ul className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] text-ink-600">
                {merchant.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[#E7F3EC] text-[#1E6B4F]">
                      <Check className="h-3 w-3" />
                    </span>
                    {amenity}
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-ink-50 pt-3 text-[11.5px] text-ink-400">
                Listed in {category.name} · {corridor.name} ·{" "}
                {merchant.tier === "starter"
                  ? "Starter listing"
                  : `${merchant.tier === "billboard" ? "Billboard" : "Boost"} placement`}
              </div>
            </div>
          </section>
        </div>

        {/* right rail */}
        <aside className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <MapPanel
              corridor={corridor.name}
              center={merchant.gps}
              height={240}
              merchants={[
                {
                  id: merchant.id,
                  slug: merchant.slug,
                  name: merchant.name,
                  lat: merchant.gps.lat,
                  lng: merchant.gps.lng,
                  tier: merchant.tier,
                  category: category.name,
                },
              ]}
            />
            <div className="space-y-2 p-4">
              <div className="text-[12px] font-semibold text-ink-800">Find the door</div>
              <p className="text-[12px] leading-relaxed text-ink-500">
                {merchant.landmark}. Send the pin instead of explaining:{" "}
                <span className="metric font-semibold text-ink-800">{merchant.ghanapost}</span>.
              </p>
              <TrackAction
                merchantId={merchant.id}
                type="direction_request"
                source="map"
                href={googleMapsDirections(merchant.gps, merchant.name)}
                target="_blank"
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-ink-200 text-[12.5px] font-semibold text-ink-800 hover:border-ink-300"
              >
                <Navigation className="h-3.5 w-3.5" /> Open in Google Maps
              </TrackAction>
            </div>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                Why this ranks here
              </div>
              <span className="metric text-[11px] font-semibold text-ink-500">score {Math.round(score)}</span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-500">
              {merchant.tier === "billboard"
                ? "Billboard merchants hold the top of the corridor feed for their category — a paid placement with a published price of GH₵249/month."
                : merchant.tier === "boost"
                  ? "Boost merchants rank next within a 2 km radius — GH₵99/month, renewed monthly."
                  : "This is a free Starter listing, ranked by quality score only."}{" "}
              Quality is not for sale: rating, review count, photos, a 360° tour and on-site
              verification decide the rest of the score.
            </p>
            <div className="mt-3 space-y-1.5">
              {[
                ["Owner rating", `${merchant.rating.toFixed(1)} / 5`],
                ["Reviews", String(merchant.reviewCount)],
                ["Photos", String(merchant.photos.length)],
                ["360° tour", merchant.panoramaUrl ? "Yes" : "No"],
                ["Verified on site", "Yes"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-[11.5px]">
                  <span className="text-ink-400">{label}</span>
                  <span className="font-medium text-ink-700">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {nearby.length > 0 && (
            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  Also nearby
                </div>
                <Link
                  href={`/discover?category=${category.id}&corridor=${corridor.id}`}
                  className="text-[11.5px] font-medium text-ink-500 hover:text-ink-900"
                >
                  See all
                </Link>
              </div>
              <div className="space-y-2">
                {nearby.map(({ merchant: other, distanceMetres: distance }) => (
                  <Link
                    key={other.id}
                    href={`/business/${other.slug}`}
                    className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-ink-50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={other.photos[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12.5px] font-semibold text-ink-800">{other.name}</div>
                      <div className="text-[11px] text-ink-400">
                        ★ {other.rating.toFixed(1)} · {distance ? distanceLabel(distance) : "nearby"}
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-ink-300" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-ink-100 bg-ink-900 p-4 text-white">
            <div className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#E0A526]">
              <Building2 className="h-3.5 w-3.5" /> Own this business?
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-white/70">
              This listing is verified and live. Boost visibility in {category.name.toLowerCase()} for{" "}
              {cedis(99)}/month, or take a Billboard for {cedis(249)}.
            </p>
            <Link
              href="/pricing"
              className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#E0A526] text-[12.5px] font-semibold text-ink-950 hover:bg-[#EBB53F]"
            >
              Claim and upgrade <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-2xl border border-ink-100 bg-white p-4 text-[11.5px] text-ink-400">
            <div className="flex items-center gap-1.5 font-semibold text-ink-600">
              <Users className="h-3.5 w-3.5" /> {merchant.reviewCount} people reviewed this listing
            </div>
            <p className="mt-1.5 leading-relaxed">
              Seen does not sell reviews. Reviews come from customers who opened the listing and
              tapped through to the shop.
            </p>
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
