# Seen — build contract

Read this before writing code. It is the interface between parallel builders.

## Product

**Seen** is a Ghanaian local-discovery and paid-visibility platform launching in
Osu (Oxford Street) and East Legon, Accra.

- **Layer 1** — consumers discover verified local businesses; merchants buy ranked
  visibility in three tiers: Starter (free), Boost (GH₵99/mo), Billboard (GH₵249/mo,
  3 slots per category per corridor). Every merchant gets a dashboard proving
  impressions → views → map clicks / phone clicks / direction requests → QR redemptions.
- **Layer 2** — third-party services (QuickBook appointments, Accra Live ticketing,
  Nexus Bills) run as mini-apps inside Seen with OAuth-style delegated identity:
  scoped, revocable consent; short-lived HMAC tokens; no wallet credentials shared.
- Payments: Paystack mobile money (MTN MoMo, Telecel Cash, AT Money) + card.
  Amounts in **cedis**; Paystack is charged in pesewas; fee 1.95% flat.

Tone: confident, specific, Ghanaian. Prices always shown in `GH₵` (e.g. `GH₵99`).
GhanaPostGPS addresses look like `GA-585-7449`. Never invent navigation — every
"Directions" action opens Google Maps.

## Stack (fixed)

Next.js 15 App Router · React 19 · TypeScript strict · Tailwind 3 · hand-rolled
shadcn/ui-style primitives · `lucide-react` icons. **No new npm dependencies.**
Do not modify `package.json`, `tailwind.config.ts`, `postcss.config.mjs`,
`next.config.mjs`, `src/app/globals.css`, or `src/lib/**` (read-only for you except
where your slice owns a lib file).

## Ownership (do not edit files outside your slice)

| Slice | Owner | Files |
|---|---|---|
| Merchant dashboard + billing + Paystack | teammate-a | `src/app/merchant/**`, `src/app/paystack/**`, `src/components/merchant/**`, `src/app/api/paystack/**`, `src/app/api/subscription/**` |
| Admin console + mini-app platform | teammate-b | `src/app/admin/**`, `src/app/mini/**`, `src/components/admin/**`, `src/components/mini/**`, `src/app/api/mini/**`, `src/app/api/consent/**` |
| Consumer discovery, landing, auth, seed, infra | lead | everything else |

Never edit a file another slice owns. If you need a change in `src/lib/**` or
`src/components/ui/**`, message the lead instead of editing.

## Data access (server-only, import from `@/lib/db/...`)

All functions are synchronous and read from a JSON-backed store seeded with 90 days
of data. Pages that read them must be dynamic:

```ts
export const dynamic = "force-dynamic";
```

```ts
import { getSession, setSession, clearSession, resolveUser, sessionFor, demoUsers, homeFor } from "@/lib/auth";

import {
  // catalogue
  listCorridors, liveCorridors, getCorridor, listCategories, getCategory,
  allMerchants, verifiedMerchants, getMerchantBySlug, getMerchantById, getDemoMerchant,
  getPlans, getPlan, searchMerchants, rankScore, corridorHighlights, corridorMetrics,
  // analytics
  metricsFor, metricsWithDelta,            // MetricsDelta { current, previous, *Delta }
  // slots
  slotInventory, allSlots, nextAvailableSlot,
  // billing
  billingFor,                               // BillingView
  // mini-apps
  listMiniApps, getMiniApp, consentsFor, consentFor, bookingsFor, ordersFor,
  // admin
  adminOverview,
} from "@/lib/db/queries";

import { getDb, updateDb, trackEvent, setMerchantTier, verifyMerchant, addMerchant } from "@/lib/db";
```

Types live in `@/lib/types` (`Merchant`, `Slot`, `Subscription`, `Invoice`,
`MiniApp`, `MerchantMetrics`, `Tier`, `CategoryId`, `CorridorId`, …).
`DailyMetric` and `SeenDb` come from `@/lib/db/seed` if you need them.

Formatting: `@/lib/format` → `cedis`, `cedisExact`, `compact`, `pct`, `shortDay`,
`longDate`, `relativeDays`, `titleCase`, `initials`, `reference`.
Ghana helpers: `@/lib/ghana` → `isValidGhanaPost`, `googleMapsDirections`,
`prettyPhone`, `ghanaPhone`, `distanceLabel`, `walkingMinutes`.

Paystack: `@/lib/paystack` → `paystackLive()`, `initializeTransaction({ email,
amountCedis, reference, callbackUrl, metadata, channels })`,
`verifyTransaction(ref)`, `verifyWebhookSignature(rawBody, sig)`, `paystackFeeCedis`,
`CHANNELS`.
Mini-app identity: `@/lib/mini-auth` → `issueMiniToken`, `verifyMiniToken`, `SCOPE_COPY`.

## UI primitives (already built — import, do not re-create)

```ts
import { Button, buttonClass } from "@/components/ui/button";   // variant: primary|sun|outline|ghost|subtle|danger; size: sm|md|lg|icon
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Stat } from "@/components/ui/card";
import { Badge, TierBadge } from "@/components/ui/badge";        // Badge tones: neutral|ink|sun|green|clay|gold|outline
import { Input, Textarea, Select, Label, Field } from "@/components/ui/input";
import { Table, THead, TR, TH, TD } from "@/components/ui/table";
import { TrendChart, Sparkline, BarList, Funnel } from "@/components/charts";
import { Logo } from "@/components/brand/logo";
import { toast } from "@/components/ui/toast";                   // client only
```

`Stat` props: `{ label, value, delta?, hint? }` (`delta` is a fraction, `0.12` → `+12.0%`).
`TrendChart` props: `{ data: { day: string; value: number; secondary?: number }[], height?: number, label?: string, secondaryLabel?: string }`.
`Funnel` props: `{ steps: { label: string; value: number }[] }`.
`BarList` props: `{ items: { label: string; value: number; hint?: string }[] }`.

Design tokens: `bg-ink-900` navy, `text-ink-500` muted, `bg-sun-500` orange accent,
`rounded-2xl` cards, `shadow-card`, `border-ink-100`, `.metric` for tabular numerals,
`.kente-strip` brand rule, `.paper-grain` subtle texture. Mobile-first: every layout
must work at 390 px wide.

## Conventions

- Server components by default; add `"use client"` only for interactivity.
- Route handlers: `export async function POST(req: NextRequest)`; validate with `zod`
  (already installed) and return `NextResponse.json({ ok: true, ... })` or
  `{ ok: false, error: "human readable" }` with the right status.
- Money: integers in cedis for display; convert to pesewas only when calling Paystack.
- Dates: ISO strings; use `shortDay`/`longDate` for display.
- Empty states are mandatory: never render a blank card.
- Accessibility: real `<button>`/`<a>`, labels on inputs, `aria-label` on icon buttons.
- No placeholder text like "Lorem ipsum", no TODO comments, no dead links —
  link only to routes in this app or external URLs that are real.

## Routes that must exist when you are done

Your slice's routes are listed in your task. Shared routes owned by the lead:
`/` (landing), `/discover`, `/business/[slug]`, `/signin`, `/api/track`,
`/api/auth/signin`, `/api/auth/signout`.

## Definition of done

1. `npx tsc --noEmit` passes for the files you touched.
2. `npm run build` passes (the lead runs the final build).
3. Every page renders with the seeded demo data and handles the empty case.
4. Numbers come from the data layer — never hard-code metrics in a component.
5. Mobile 390 px: no horizontal overflow.
