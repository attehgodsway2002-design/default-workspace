import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { consentsFor, listMiniApps } from "@/lib/db/queries";
import { SCOPE_COPY } from "@/lib/mini-auth";
import { longDate, relativeDays } from "@/lib/format";
import { Logo } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { ScopeChips } from "@/components/mini/scope-chips";
import { MiniStatusBadge } from "@/components/admin/status-badges";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "App Store",
  description:
    "Apps that run inside Seen on your Seen identity — scoped, revocable, no new accounts and no card details.",
};

const MODEL = [
  {
    title: "One identity",
    detail:
      "You sign in to Seen once. Partner apps ask Seen who you are instead of asking you for a password.",
  },
  {
    title: "Scopes you can read",
    detail:
      "Every app lists exactly what it wants before it opens: name, phone, GhanaPostGPS address, payment authorisation or booking history.",
  },
  {
    title: "An hour-long token",
    detail:
      "Approval issues a signed token with an expiry. It carries your scopes and nothing else — no PIN, no card, no wallet balance.",
  },
  {
    title: "Revoked means revoked",
    detail:
      "One tap in Manage consent ends the link. The partner keeps only what a booking or ticket legitimately needs.",
  },
];

export default async function MiniDirectoryPage() {
  const session = await getSession();
  const user = session ? getDb().users.find((item) => item.id === session.userId) : undefined;
  const apps = listMiniApps();
  const links = user ? consentsFor(user.id) : [];
  const liveApps = apps.filter((app) => app.status === "live");

  return (
    <div className="min-h-screen bg-[#FBFAF7]">
      <header className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo />
            <Badge tone="outline">App Store</Badge>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <span className="hidden text-[12px] font-medium text-ink-500 sm:inline">
                {user.name}
              </span>
            ) : (
              <Link
                href="/signin?next=/mini"
                className="text-[12px] font-semibold text-ink-500 hover:text-ink-900"
              >
                Sign in
              </Link>
            )}
            <Link
              href="/discover"
              className={buttonClass({ variant: "outline", size: "sm" })}
            >
              Discover
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-14">
        <section className="paper-grain -mx-4 border-b border-ink-100 px-4 py-10 sm:py-14">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-ink-100 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-500 shadow-card">
              <ShieldCheck className="h-3.5 w-3.5 text-[#1E6B4F]" aria-hidden />
              Identity by Seen
            </span>
            <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-ink-900 sm:text-4xl">
              Apps that already know you.
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
              Book a braider, buy a ticket, pay a bill — without creating another account or typing
              card details into another form. These apps run inside Seen on your Seen identity.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {["No new accounts", "No card details", "Revoke any time"].map((item) => (
                <Badge key={item} tone="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="pt-8" aria-labelledby="apps-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="apps-heading" className="text-lg font-semibold text-ink-900">
              Partners
            </h2>
            <span className="text-[12px] text-ink-400">
              {liveApps.length} live · {apps.length - liveApps.length} in pilot
            </span>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {apps.map((app) => (
              <article
                key={app.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card"
              >
                <div className="h-1.5 w-full" style={{ backgroundColor: app.accent }} aria-hidden />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold text-white"
                        style={{ backgroundColor: app.accent }}
                        aria-hidden
                      >
                        {app.name.slice(0, 1)}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold text-ink-900">{app.name}</h3>
                        <p className="text-[11px] text-ink-400">{app.partner}</p>
                      </div>
                    </div>
                    <MiniStatusBadge status={app.status} />
                  </div>

                  <p className="mt-3 flex-1 text-[12px] leading-relaxed text-ink-500">{app.blurb}</p>

                  <div className="mt-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-400">
                      Asks for
                    </div>
                    <ScopeChips
                      scopes={app.scopes}
                      scopeCopy={SCOPE_COPY}
                      tone="outline"
                      className="mt-1.5"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    {app.status === "live" ? (
                      <Link
                        href={`/mini/${app.slug}`}
                        className={buttonClass({ variant: "primary", size: "sm" })}
                      >
                        Open {app.name}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400">
                        Coming soon
                      </span>
                    )}
                    {app.status !== "live" && (
                      <Link
                        href={`/mini/${app.slug}`}
                        className="text-[12px] font-semibold text-sun-600 hover:text-sun-700"
                      >
                        Preview the pilot
                      </Link>
                    )}
                  </div>
                  {app.launchedAt && (
                    <p className="mt-2 text-[10px] text-ink-300">
                      Live since {longDate(app.launchedAt)}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10" aria-labelledby="consent-heading">
          <h2 id="consent-heading" className="text-lg font-semibold text-ink-900">
            How consent works
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">
            Seen is the identity provider, not a password manager for partners. Here is the whole
            contract in four steps.
          </p>
          <ol className="mt-4 grid gap-3 md:grid-cols-2">
            {MODEL.map((item, index) => (
              <li
                key={item.title}
                className="rounded-2xl border border-ink-100 bg-white p-4 shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span className="metric flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-[11px] font-semibold text-white">
                    {index + 1}
                  </span>
                  <h3 className="text-[13px] font-semibold text-ink-900">{item.title}</h3>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-500">{item.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10 rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-ink-900">Your links</h2>
            {user ? (
              <span className="text-[12px] text-ink-400">Signed in as {user.email}</span>
            ) : (
              <span className="text-[12px] text-ink-400">Demo consumer · ama@example.gh</span>
            )}
          </div>

          {!user ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-ink-500">
                Sign in as Ama Mensah to try a real consent screen and a real booking. No password —
                it is the demo consumer account.
              </p>
              <Link
                href="/signin?next=/mini"
                className={buttonClass({ variant: "sun", size: "sm" })}
              >
                Sign in as Ama
              </Link>
            </div>
          ) : links.length === 0 ? (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[12px] leading-relaxed text-ink-500">
                No apps linked yet. Open QuickBook and the consent screen will ask before anything is
                shared.
              </p>
              {liveApps[0] && (
                <Link
                  href={`/mini/${liveApps[0].slug}`}
                  className={buttonClass({ variant: "sun", size: "sm" })}
                >
                  Open {liveApps[0].name}
                </Link>
              )}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-ink-50">
              {links.map((consent) => {
                const app = apps.find((item) => item.id === consent.miniAppId);
                if (!app) return null;
                return (
                  <li
                    key={consent.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink-800">{app.name}</span>
                        <MiniStatusBadge status={app.status} />
                        <span className="text-[11px] text-ink-400">
                          granted {relativeDays(consent.grantedAt)}
                        </span>
                      </div>
                      <ScopeChips
                        scopes={consent.scopes}
                        scopeCopy={SCOPE_COPY}
                        tone="green"
                        className="mt-1.5"
                      />
                    </div>
                    <Link
                      href={`/mini/${app.slug}#consent`}
                      className="shrink-0 text-[12px] font-semibold text-sun-600 hover:text-sun-700"
                    >
                      Manage
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-5 text-[12px] text-ink-400">
          <span>Seen is live in Osu + East Legon, Accra.</span>
          <div className="flex items-center gap-4">
            <Link href="/discover" className="font-semibold text-ink-500 hover:text-ink-900">
              Discover
            </Link>
            <Link href="/" className="font-semibold text-ink-500 hover:text-ink-900">
              Seen home
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
