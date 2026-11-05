import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  bookingsFor,
  consentFor,
  getCategory,
  getCorridor,
  getMiniApp,
  ordersFor,
  searchMerchants,
} from "@/lib/db/queries";
import { SCOPE_COPY } from "@/lib/mini-auth";
import type { MiniScope } from "@/lib/types";
import { buttonClass } from "@/components/ui/button";
import { ContainerChrome } from "@/components/mini/container-chrome";
import { ConsentScreen } from "@/components/mini/consent-screen";
import { ManageConsent } from "@/components/mini/manage-consent";
import { ScopeUpgradeBanner } from "@/components/mini/scope-upgrade";
import {
  QuickBookApp,
  type PriorBooking,
  type QuickBookMerchant,
} from "@/components/mini/quickbook-app";
import { AccraLiveApp, type PriorOrder } from "@/components/mini/accra-live-app";
import { NexusBillsApp } from "@/components/mini/nexus-bills";
import { QUICKBOOK_CATEGORIES, servicesFor } from "@/components/mini/quickbook-catalogue";
import { liveEvents } from "@/components/mini/event-catalogue";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const app = getMiniApp(slug);
  if (!app) return { title: "Mini-app" };
  return {
    title: `${app.name} · Seen App Store`,
    description: app.blurb,
  };
}

function quickBookMerchants(): QuickBookMerchant[] {
  return QUICKBOOK_CATEGORIES.flatMap((categoryId) =>
    searchMerchants({ categoryId, limit: 40 }).map(({ merchant }) => ({
      id: merchant.id,
      name: merchant.name,
      corridor: getCorridor(merchant.corridorId)?.name ?? merchant.corridorId,
      categoryName: getCategory(merchant.categoryId)?.name ?? merchant.categoryId,
      rating: merchant.rating,
      ghanapost: merchant.ghanapost,
      landmark: merchant.landmark,
      services: servicesFor(merchant.categoryId, merchant.priceBand),
    })),
  ).sort((a, b) => a.name.localeCompare(b.name));
}

export default async function MiniAppPage({ params }: PageProps) {
  const { slug } = await params;
  const app = getMiniApp(slug);
  if (!app) notFound();

  const session = await getSession();
  const user = session ? getDb().users.find((item) => item.id === session.userId) : undefined;
  const consent = user ? consentFor(user.id, app.id) : undefined;
  const nowIso = new Date().toISOString();

  const flowScope: MiniScope | undefined =
    app.category === "booking"
      ? "booking"
      : app.category === "ticketing" || app.category === "bills"
        ? "payments"
        : undefined;
  const missingScope =
    consent && flowScope && !consent.scopes.includes(flowScope) ? flowScope : undefined;

  const priorBookings: PriorBooking[] =
    user && app.category === "booking"
      ? bookingsFor(user.id)
          .filter((booking) => booking.miniAppId === app.id)
          .map((booking) => ({
            reference: booking.reference,
            service: booking.service,
            priceCedis: booking.priceCedis,
            startsAt: booking.startsAt,
            merchantName: booking.merchant?.name ?? "QuickBook partner",
          }))
      : [];

  const priorOrders: PriorOrder[] =
    user && app.category === "ticketing"
      ? ordersFor(user.id)
          .filter((order) => order.miniAppId === app.id)
          .map((order) => ({
            reference: order.reference,
            eventName: order.eventName,
            quantity: order.quantity,
            totalCedis: order.totalCedis,
            createdAt: order.createdAt,
          }))
      : [];

  return (
    <ContainerChrome app={app} scopes={consent?.scopes ?? app.scopes} linked={Boolean(consent)}>
      {!user ? (
        <div className="rounded-xl border border-ink-100 bg-ink-50/60 p-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-ink-500" aria-hidden />
            <h2 className="text-base font-semibold text-ink-900">Sign in with your Seen identity</h2>
          </div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            {app.name} opens inside Seen, so Seen has to know who you are first. Signing in takes one
            tap — there is no new account and no card details.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <Link
              href={`/signin?next=/mini/${app.slug}`}
              className={buttonClass({ variant: "primary", size: "md" })}
            >
              Sign in to continue
            </Link>
            <Link
              href="/mini"
              className={buttonClass({ variant: "ghost", size: "md" })}
            >
              Back to the App Store
            </Link>
          </div>
          <p className="mt-3 text-[11px] text-ink-400">
            Demo consumer: <span className="metric font-mono">ama@example.gh</span> — Ama Mensah,
            Accra.
          </p>
        </div>
      ) : !consent ? (
        <ConsentScreen
          appId={app.id}
          appSlug={app.slug}
          appName={app.name}
          appPartner={app.partner}
          requestedScopes={app.scopes}
          scopeCopy={SCOPE_COPY}
        />
      ) : (
        <div className="space-y-5">
          {missingScope && (
            <ScopeUpgradeBanner
              appId={app.id}
              appName={app.name}
              currentScopes={consent.scopes}
              missingScope={missingScope}
              missingLabel={SCOPE_COPY[missingScope].label}
            />
          )}
          {app.category === "booking" && (
            <QuickBookApp
              appSlug={app.slug}
              merchants={quickBookMerchants()}
              previousBookings={priorBookings}
              nowIso={nowIso}
            />
          )}
          {app.category === "ticketing" && (
            <AccraLiveApp
              appSlug={app.slug}
              events={liveEvents(nowIso)}
              priorOrders={priorOrders}
              buyerName={user.name}
            />
          )}
          {app.category === "bills" && (
            <NexusBillsApp appSlug={app.slug} appName={app.name} />
          )}
          {app.category === "delivery" && (
            <div className="rounded-xl border border-dashed border-ink-200 p-4">
              <h2 className="text-sm font-semibold text-ink-800">Not live in Accra yet</h2>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                This partner is still in contracting. Your Seen identity link works the moment it
                opens — check the App Store for the launch.
              </p>
              <Link
                href="/mini"
                className="mt-2 inline-block text-[12px] font-semibold text-sun-600 hover:text-sun-700"
              >
                Back to the App Store
              </Link>
            </div>
          )}

          <ManageConsent
            appId={app.id}
            appName={app.name}
            scopes={consent.scopes}
            scopeCopy={SCOPE_COPY}
            grantedAt={consent.grantedAt}
          />
        </div>
      )}
    </ContainerChrome>
  );
}
