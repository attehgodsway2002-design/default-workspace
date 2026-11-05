# Seen

**Local discovery and paid visibility for Ghana's mobile-first cities.**

Seen is the product described in `../Seen_Business_Model_and_Proposal.md`: a
corridor-by-corridor discovery platform for Accra (Osu / Oxford Street and East
Legon first), where verified local businesses buy ranked, measured attention —
and later plug third-party services into the same identity and payment rail.

This repository is the working application, not a mockup: discovery, merchant
onboarding, a live performance dashboard, Paystack mobile-money billing, an
internal ops console, and a mini-app platform with scoped delegated identity.

---

## Run it

```bash
npm install
npm run dev          # http://localhost:3100
```

No environment variables are required. With none set, the app runs in **demo
mode**: a seeded local store, a hand-built corridor map, and a simulated MoMo
checkout. Copy `.env.example` → `.env.local` to switch on Paystack, Mapbox or
Supabase.

Demo mode is development-only. In production, the local JSON store and demo
sign-in routes are disabled, development signing-secret fallbacks are rejected,
and checkout will not fall back to simulated approval. A production database
adapter and real sign-in flow must be configured before the app can serve users.

```bash
npm run build        # production build
npm run seed         # clear the store; restart to reseed
```

## Demo accounts

| Email | Role | What it opens |
|---|---|---|
| `ama@example.gh` | consumer | discovery, 360° listing, QuickBook & Accra Live consent + booking |
| `kofi@kenteandkoffee.gh` | merchant | Kente & Koffee, Osu · Billboard: dashboard, billing, Paystack upgrade |
| `ops@seen.gh` | admin | MRR, corridor occupancy, verification queue, partner take-rates |

Sign in at `/signin` (one click per account), or sign in with any email to get a
consumer profile.

## What is built

### Layer 1 — discovery and paid visibility
- `/` — landing page driven by live data (96 storefronts, real 30-day metrics).
- `/discover` — search, six categories, corridor + tier filters, ranking that is
  *paid tier + quality score*, results grid and an interactive corridor map
  (Mapbox when `NEXT_PUBLIC_MAPBOX_TOKEN` is set, otherwise a hand-built vector
  map with real Osu / East Legon geometry and no tile dependency).
- `/business/[slug]` — verified listing: photo plates, a drag-to-pan 360° tour,
  GhanaPostGPS address, directions handed to Google Maps, phone/WhatsApp with
  analytics beacons, "why this ranks here" transparency panel, nearby listings.
- `/pricing` — three tiers (Starter free, Boost GH₵99, Billboard GH₵249), live
  slot availability per corridor and category, ROI calculator, alternatives
  table, merchant FAQ.
- `/onboarding` — three-step merchant application with GhanaPostGPS validation
  and corridor matching; creates a pending listing and a merchant session.

### Merchant dashboard + billing
- `/merchant` — impressions, views, intent actions and QR redemptions with
  period deltas; 7/30/90-day trend; funnel; source breakdown; ROI panel against
  the plan price; current slot and next charge.
- `/merchant/storefront` — edit the public listing with a live preview.
- `/merchant/billing` — plan, invoices, receipts, upgrade/downgrade, cancel.
- Paystack: `/api/subscription/init` initialises a real transaction; when no
  secret key is present the app routes to its own `/paystack/checkout`
  mobile-money approval screen; `/api/paystack/webhook` verifies the
  HMAC-SHA512 signature before changing a subscription.

### Layer 2 — mini-app platform
- `/mini` — the "Seen App Store" directory and the consent model explained.
- `/mini/[slug]` — container with partner chrome and scoped consent:
  - **QuickBook** — booking flow (merchant, service, time), confirmation + .ics.
  - **Accra Live** — ticketing flow with mobile-money checkout and ticket code.
  - **Nexus Bills** — pilot state showing the scoped-token handshake.
- `/api/mini/token` issues a short-lived, HMAC-signed delegated identity token
  (`sub`, `app`, scopes, name, phone, address) — no wallet or PIN data, ever.
- Consent is per-scope, explicit and revocable; `/api/consent` records grants and
  revocations.

### Ops console
- `/admin` — MRR/ARR, paying vs free, corridor occupancy, 6-month collections
  trend, verification queue, top merchants by impressions, partner GMV.
- `/admin/merchants`, `/admin/merchants/[id]`, `/admin/slots`,
  `/admin/partners` — the operating surface for a two-corridor business.

## Architecture

```
src/app/            routes (App Router, server components by default)
src/components/     ui primitives (shadcn-style), consumer, charts, mini, merchant, admin
src/lib/
  types.ts          domain model, mirrored 1:1 by the Postgres schema
  db/
    seed.ts         deterministic 96-storefront Accra dataset + 90 days of metrics
    index.ts        JSON-backed store with in-memory cache (swap for Supabase)
    queries.ts      ranking, search, analytics, slots, billing, admin rollups
    public.ts       read-only facade for consumer pages
    schema.sql      Postgres DDL + RLS policies for Supabase
  auth.ts           HMAC-signed session cookies, roles, demo accounts
  paystack.ts       transaction init/verify, webhook signature, channel labels
  mini-auth.ts      delegated identity tokens + scope copy
  ghana.ts          GhanaPostGPS validation, corridor matching, distances, Maps links
  format.ts         cedis, compact numbers, date helpers
scripts/            asset generation (SVG plates, 360° panorama strips), reseed
```

**Data.** `getDb()` reads `.data/seen.json`, seeds it on first boot, and writes
mutations back. The query layer never knows whether it is talking to JSON or
Postgres; `schema.sql` is the production target and includes row-level security
so a merchant can only read their own analytics, subscriptions and invoices.

**Payments.** Amounts are cedis in the domain and pesewas on the wire. Paystack
fee is 1.95% flat and absorbed, not passed to the merchant. No money is held:
Seen never custodies funds, which keeps the platform outside the licensing scope
that Act 987 applies to custodial services.

**Analytics.** Six events per listing: impression, view, map click, phone click,
direction request, QR redemption. The client fires beacons from
`/api/track`; impressions are de-duplicated per visitor per merchant per day, so
a merchant's dashboard is not inflated by a single scroll. The seed ships 90 days
of pre-aggregated history so charts are meaningful on first boot.

## Production checklist

1. Apply `src/lib/db/schema.sql` in Supabase; enable the RLS policies.
2. Set the Supabase keys and implement `src/lib/db/supabase.ts` against the same
   `queries.ts` signatures (the seam is the facade, not the pages).
3. Replace demo sign-in with Supabase magic links or a phone OTP; keep the
   session shape (`Session`) identical.
4. Set live Paystack keys, register the webhook URL, and confirm settlement
   timing (T+1) in writing.
5. Register as a data controller with the Data Protection Commission (Act 843)
   and complete the DPIA for mini-app consent before enabling partners.
6. Get a written Act 987 opinion before any mini-app takes custody of funds.

## Auth email via Gmail SMTP

Configure SMTP in the Supabase dashboard under **Authentication → SMTP Settings**;
these mail credentials do not belong in the app's `.env.local` or repository.
For low-volume testing, use:

- Host: `smtp.gmail.com`
- Port: `587` with STARTTLS
- Username: the full Gmail address
- Password: a Google App Password (requires 2-Step Verification), not the normal account password
- Sender: a verified address/name allowed by that Gmail account

After the app's auth callback route is implemented, set Supabase's Site URL to
the deployed app origin and add its local and staging callback URLs to the
redirect allow list. The app's Supabase URL must be the project base URL
(`https://<project-ref>.supabase.co`), not the `/rest/v1/` endpoint.

SMTP only delivers Supabase Auth emails; it does not enable sign-in by itself.
The Supabase Auth integration in the app must be implemented and the project
credentials configured before signup, verification, or magic-link emails work.
Gmail is suitable for development and small tests; use a transactional mail
provider for production volume and delivery monitoring.

## Notes on the demo data

All 96 businesses are fictional composites. Corridor geography, GhanaPostGPS
formatting, price points and metric ratios follow the operating model in the
business plan (`build/finance_model.py`): Billboard ≈ 9,400 impressions/month,
Boost ≈ 2,600, with click-through and intent rates calibrated to that model.
