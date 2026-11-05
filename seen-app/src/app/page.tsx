import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/consumer/site-chrome";
import { MerchantCard } from "@/components/consumer/merchant-card";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { compact, cedis, pct } from "@/lib/format";
import {
  corridorMetrics,
  getCategory,
  getDemoMerchant,
  getMerchantsSafe,
  listCategories,
  listMiniApps,
  liveCorridors,
  metricsWithDelta,
  verifiedMerchants,
} from "@/lib/db/public";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  if (process.env.NODE_ENV === "production") {
    return (
      <main className="min-h-screen bg-[#FBFAF7]">
        <header className="border-b border-ink-100 bg-white">
          <div className="container flex h-16 items-center justify-between gap-4">
            <Logo />
            <nav className="flex items-center gap-2">
              <Link href="/signin" className="rounded-xl px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50">
                Sign in
              </Link>
              <Link href="/signup" className="rounded-xl bg-sun-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-sun-600">
                Create account
              </Link>
            </nav>
          </div>
        </header>
        <section className="container grid min-h-[calc(100vh-4rem)] max-w-5xl content-center gap-8 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-400">Seen · live service</p>
            <h1 className="mt-3 max-w-2xl text-4xl font-semibold leading-tight text-ink-900">
              Real neighbourhood listings are being connected.
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ink-600">
              We’ve hidden the sample businesses rather than present them as real. The live business directory is not connected on this deployment yet.
            </p>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
              You can create an account or sign in while the live directory is being prepared. Please don’t submit real business or payment information through preview flows.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="inline-flex h-11 items-center rounded-xl bg-sun-500 px-4 text-sm font-semibold text-white hover:bg-sun-600">
                Create account
              </Link>
              <Link href="/signin" className="inline-flex h-11 items-center rounded-xl border border-ink-200 bg-white px-4 text-sm font-semibold text-ink-800 hover:bg-ink-50">
                Sign in
              </Link>
            </div>
          </div>
          <aside className="border-l-2 border-sun-500 pl-5">
            <h2 className="text-sm font-semibold text-ink-900">Service status</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Business directory</dt>
                <dd className="font-medium text-ink-800">Not connected</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-500">Sample listings</dt>
                <dd className="font-medium text-ink-800">Hidden</dd>
              </div>
            </dl>
          </aside>
        </section>
      </main>
    );
  }

  const merchants = verifiedMerchants();
  const categories = listCategories();
  const corridors = liveCorridors();
  const demo = getDemoMerchant();
  const demoStats = metricsWithDelta(demo.id, 30);
  const demoMetrics = demoStats.current;
  const osu = corridorMetrics("osu", 30);
  const miniApps = listMiniApps().filter((a) => a.status !== "loi");
  const featured = getMerchantsSafe("osu", "food", 3);

  const counts = new Map(
    categories.map((c) => [c.id, merchants.filter((m) => m.categoryId === c.id).length]),
  );
  const billboardCount = merchants.filter((m) => m.tier === "billboard").length;
  const avgTicket = getCategory(demo.categoryId)?.avgTicketCedis ?? 72;
  const roiProfit = demoMetrics.qrRedemptions * avgTicket * 0.6;
  const roiVerdict = roiProfit / 249 > 1 ? "several times over" : "within the first weeks";

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden bg-ink-900 text-white">
        <div className="kente-strip h-1.5 w-full opacity-90" />
        <div className="paper-grain absolute inset-0 opacity-[0.18]" aria-hidden />
        <div className="container relative grid gap-12 py-14 lg:grid-cols-[1.15fr_0.85fr] lg:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-white/80">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E0A526]" />
              Live in Osu and East Legon · {merchants.length} verified storefronts
            </div>
            <h1 className="max-w-xl text-[38px] font-semibold leading-[1.06] tracking-[-0.02em] sm:text-[52px]">
              Know what&apos;s good,
              <br />
              before you leave
              <br />
              the house<span className="text-[#E0A526]">.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-white/70">
              Seen finds the neighbourhood places worth your time — verified, mapped and
              priced. GhanaPostGPS addresses you can send, opening hours that are true, and a
              pin that opens Google Maps with one tap.
            </p>

            <form action="/discover" className="mt-7 max-w-lg">
              <div className="flex items-center gap-2 rounded-2xl bg-white p-1.5 shadow-lift">
                <div className="flex flex-1 items-center gap-2 pl-3">
                  <Search className="h-4 w-4 text-ink-400" />
                  <input
                    name="q"
                    placeholder="jollof in Osu, barber near Labone…"
                    className="h-10 w-full bg-transparent text-[14px] text-ink-900 outline-none placeholder:text-ink-300"
                    aria-label="Search local businesses"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-sun-500 px-4 text-[13.5px] font-semibold text-white hover:bg-sun-600"
                >
                  Search
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {corridors.map((c) => (
                <Link
                  key={c.id}
                  href={`/discover?corridor=${c.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-medium text-white/80 hover:border-white/40 hover:text-white"
                >
                  <MapPin className="h-3 w-3" />
                  {c.name}
                </Link>
              ))}
              <span className="text-[12px] text-white/40">
                {corridors.length} corridors · {categories.length} categories
              </span>
            </div>

            <dl className="mt-9 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-5">
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.12em] text-white/45">Directions requested</dt>
                <dd className="metric mt-1 text-xl font-semibold">{compact(osu.intent)}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.12em] text-white/45">Verified storefronts</dt>
                <dd className="metric mt-1 text-xl font-semibold">{merchants.length}</dd>
              </div>
              <div>
                <dt className="text-[10.5px] uppercase tracking-[0.12em] text-white/45">Billboard merchants</dt>
                <dd className="metric mt-1 text-xl font-semibold">{billboardCount}</dd>
              </div>
            </dl>
          </div>

          {/* hero card: a real merchant, real numbers */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-lift backdrop-blur">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={demo.photos[0]}
                alt={`${demo.name} interior`}
                className="h-44 w-full object-cover"
              />
              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E0A526]/15 px-2.5 py-1 text-[11px] font-semibold text-[#F2CDA4]">
                    <Sparkles className="h-3 w-3" /> Billboard · GH₵249/mo
                  </div>
                  <div className="inline-flex items-center gap-1 text-[12px] text-white/60">
                    <Star className="h-3.5 w-3.5 fill-[#E0A526] text-[#E0A526]" />
                    {demo.rating.toFixed(1)} · {demo.reviewCount} reviews
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Impressions", value: compact(demoMetrics.impressions) },
                    { label: "Direction taps", value: compact(demoMetrics.directionRequests) },
                    { label: "Till QR scans", value: compact(demoMetrics.qrRedemptions) },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-white/[0.06] p-3">
                      <div className="metric text-lg font-semibold">{item.value}</div>
                      <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-white/45">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-[11.5px] text-white/50">
                  <BadgeCheck className="h-3.5 w-3.5 text-[#E0A526]" />
                  Verified on site · last 30 days · updates weekly by WhatsApp
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/40">
              <span>Every number above is measured, not modelled.</span>
              <Link href="/pricing" className="inline-flex items-center gap-1 text-white/70 hover:text-white">
                See the plans <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ categories */}
      <section className="container py-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-900">
              What are you looking for?
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Six categories, {merchants.length} verified businesses, two corridors — growing
              storefront by storefront.
            </p>
          </div>
          <Link
            href="/discover"
            className="hidden items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-900 sm:inline-flex"
          >
            Browse everything <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/discover?category=${category.id}`}
              className="group flex flex-col justify-between rounded-2xl border border-ink-100 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-ink-200 hover:shadow-card"
            >
              <div className="text-[13px] font-semibold text-ink-900">{category.name}</div>
              <div className="mt-6 flex items-end justify-between">
                <span className="text-[11px] text-ink-400">{counts.get(category.id) ?? 0} listed</span>
                <span className="metric text-[11px] font-semibold text-sun-600">
                  {cedis(category.avgTicketCedis)}
                  <span className="ml-0.5 font-normal text-ink-300">avg</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- featured */}
      <section className="container pb-4">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-sun-600">
              <Sparkles className="h-3.5 w-3.5" /> Billboard · Osu
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-900">
              On the top of the feed this week
            </h2>
          </div>
          <Link
            href="/discover?corridor=osu"
            className="hidden items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-900 sm:inline-flex"
          >
            Explore Osu <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((merchant) => (
            <MerchantCard
              key={merchant.id}
              merchant={merchant}
              corridorName="Osu"
              featured
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------ proof */}
      <section className="container py-12">
        <div className="grid gap-6 rounded-3xl border border-ink-100 bg-white p-6 shadow-card lg:grid-cols-[0.9fr_1.1fr] lg:p-9">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500">
              <TrendingUp className="h-3.5 w-3.5" /> The merchant view
            </div>
            <h2 className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.015em] text-ink-900">
              GH₵249 a month, and the receipts to prove it.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-500">
              Merchants do not buy listings — they buy customers. Seen shows every impression,
              every direction request and every till QR scan, then converts it into the only
              number that matters: gross profit against the subscription.
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                ["Impressions", compact(demoMetrics.impressions)],
                ["Profile views", compact(demoMetrics.views)],
                ["Intent actions", compact(demoMetrics.mapClicks + demoMetrics.phoneClicks + demoMetrics.directionRequests)],
                ["Till QR redemptions", compact(demoMetrics.qrRedemptions)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-ink-50 pb-2 text-[13px]">
                  <span className="text-ink-500">{label}</span>
                  <span className="metric font-semibold text-ink-900">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl bg-[#E7F3EC] p-3 text-[12.5px] leading-relaxed text-[#1E6B4F]">
              At the corridor&apos;s GH₵{avgTicket} average ticket and a 60% gross margin,{" "}
              {demoMetrics.qrRedemptions} verified visits plus a conservative share of intent
              actions cover the Billboard <strong>{roiVerdict}</strong>. Every figure is on the
              merchant&apos;s dashboard.
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/merchant"
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-4 text-[13px] font-semibold text-white hover:bg-ink-800"
              >
                Open the merchant dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex h-10 items-center rounded-xl border border-ink-200 bg-white px-4 text-[13px] font-semibold text-ink-800 hover:border-ink-300"
              >
                Plans &amp; pricing
              </Link>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Impressions", value: compact(demoMetrics.impressions), note: `vs ${compact(demoStats.previous.impressions)} prior 30 days` },
              { label: "Click-through", value: pct(demoMetrics.ctr), note: "views Ã· impressions" },
              { label: "Intent rate", value: pct(demoMetrics.intentRate), note: "map + phone + directions Ã· views" },
              { label: "Unique sessions", value: compact(demoMetrics.uniqueSessions), note: "deduplicated in the last 30 days" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-ink-100 p-4">
                <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                  {item.label}
                </div>
                <div className="metric mt-1 text-2xl font-semibold text-ink-900">{item.value}</div>
                <div className="mt-1 text-[11px] text-ink-400">{item.note}</div>
              </div>
            ))}
            <div className="sm:col-span-2 rounded-2xl bg-ink-900 p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-white/40">
                    Where the attention came from
                  </div>
                  <div className="mt-1 text-sm text-white/80">Feed · search · map · till QR</div>
                </div>
                <Navigation className="h-5 w-5 text-[#E0A526]" />
              </div>
              <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-white/10">
                {demoMetrics.bySource.slice(0, 4).map((source, index) => {
                  const total = demoMetrics.bySource.reduce((sum, s) => sum + s.count, 0) || 1;
                  const colors = ["#E0A526", "#C16A1E", "#93AFC5", "#1E6B4F"];
                  return (
                    <div
                      key={source.source}
                      title={`${source.source}: ${source.count}`}
                      style={{
                        width: `${(source.count / total) * 100}%`,
                        background: colors[index % colors.length],
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- mini apps */}
      <section className="container pb-12">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Layer 2 · inside Seen
            </div>
            <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink-900">
              Book, ticket and pay without a new account
            </h2>
          </div>
          <Link href="/mini" className="hidden items-center gap-1 text-[13px] font-medium text-ink-600 hover:text-ink-900 sm:inline-flex">
            Seen App Store <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {miniApps.map((app) => (
            <Link
              key={app.id}
              href={`/mini/${app.slug}`}
              className="group rounded-2xl border border-ink-100 bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-center justify-between">
                <div
                  className="grid h-10 w-10 place-items-center rounded-xl text-[15px] font-semibold text-white"
                  style={{ background: app.accent }}
                >
                  {app.name.slice(0, 1)}
                </div>
                <Badge tone={app.status === "live" ? "green" : "gold"}>
                  {app.status === "live" ? "Live" : "Pilot"}
                </Badge>
              </div>
              <div className="mt-3 text-[15px] font-semibold text-ink-900">{app.name}</div>
              <div className="text-[11.5px] text-ink-400">{app.partner}</div>
              <p className="mt-2 line-clamp-3 text-[12.5px] leading-relaxed text-ink-500">{app.blurb}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-sun-600">
                Open in Seen <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- how it works */}
      <section className="container pb-16">
        <div className="grid gap-6 rounded-3xl bg-ink-900 p-7 text-white lg:grid-cols-[0.8fr_1.2fr] lg:p-10">
          <div>
            <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.015em]">
              Three taps from &ldquo;where should we eat&rdquo; to the table.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Seen never guesses. Nothing is listed until a Seen rep has stood in the shop,
              checked the GhanaPostGPS point and photographed the room.
            </p>
            <Link
              href="/discover"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-[#E0A526] px-4 text-[13px] font-semibold text-ink-950 hover:bg-[#EBB53F]"
            >
              Start exploring <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                n: "01",
                title: "Find it",
                body: "Search a dish, a service or a neighbourhood. Billboard and Boost merchants rank first, then quality score — never a paid listing with bad reviews.",
              },
              {
                n: "02",
                title: "Check it",
                body: "Real photos, a 360Â° tour, true opening hours and a verified GhanaPostGPS point. If it is not verified, it is not on Seen.",
              },
              {
                n: "03",
                title: "Go",
                body: "One tap opens Google Maps to the pin, or dials the shop. Call it a direction request — the merchant sees it in their dashboard.",
              },
            ].map((step) => (
              <div key={step.n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="metric text-[11px] font-semibold text-[#E0A526]">{step.n}</div>
                <div className="mt-2 text-[14px] font-semibold">{step.title}</div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

