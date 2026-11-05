-- ============================================================================
-- Seen — Postgres schema (Supabase)
-- Mirrors src/lib/types.ts. Enables RLS: merchants can read only their own
-- performance rows; public can read verified merchants and slot inventory.
-- Run in Supabase SQL editor, then set NEXT_PUBLIC_SUPABASE_URL / ANON_KEY.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------- corridors
create table if not exists corridors (
  id                text primary key,
  name              text not null,
  city              text not null,
  gps_prefix        text not null,
  center_lat        double precision not null,
  center_lng        double precision not null,
  bounds            jsonb not null,
  target_storefronts int not null,
  live              boolean not null default true,
  launch_month      text not null
);

create table if not exists categories (
  id           text primary key,
  name         text not null,
  slug         text not null unique,
  blurb        text not null,
  icon         text not null,
  avg_ticket_cedis int not null
);

-- -------------------------------------------------------------------- plans
create table if not exists plans (
  tier               text primary key check (tier in ('starter','boost','billboard')),
  name               text not null,
  price_cedis        int not null check (price_cedis >= 0),
  cadence            text not null check (cadence = 'month'),
  slots_per_category int not null check (slots_per_category >= 0),
  features           text[] not null default '{}',
  cta                text not null,
  popular            boolean not null default false
);

-- ------------------------------------------------------------------- users
create table if not exists users (
  id          uuid primary key default gen_random_uuid(),
  auth_id     uuid unique,                       -- auth.users.id when using Supabase Auth
  email       text unique not null,
  name        text not null,
  phone       text,
  ghanapost   text,
  role        text not null default 'consumer' check (role in ('consumer','merchant','admin')),
  created_at  timestamptz not null default now()
);

create or replace function public.handle_seen_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (auth_id, email, name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(coalesce(new.email, ''), '@', 1), 'Seen user'),
    '',
    'consumer'
  )
  on conflict (auth_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_seen_auth_user_created on auth.users;
create trigger on_seen_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_seen_auth_user();

-- --------------------------------------------------------------- merchants
create table if not exists merchants (
  id           text primary key,
  slug         text unique not null,
  name         text not null,
  category_id  text not null references categories(id),
  corridor_id  text not null references corridors(id),
  tier         text not null default 'starter' check (tier in ('starter','boost','billboard')),
  status       text not null default 'pending' check (status in ('pending','verified','rejected','paused')),
  tagline      text not null,
  description  text not null,
  ghanapost    text not null,
  gps          jsonb not null,                   -- {lat,lng}
  landmark     text,
  phone        text not null,
  whatsapp     text,
  email        text,
  hours        text not null,
  price_band   smallint not null check (price_band between 1 and 3),
  rating       numeric(2,1) not null default 0,
  review_count int not null default 0,
  photos       text[] not null default '{}',
  panorama_url text,
  amenities    text[] not null default '{}',
  verified_at  timestamptz,
  founding     boolean not null default false,
  slot_id      text,
  owner_id     uuid references users(id),
  created_at   timestamptz not null default now()
);
create index if not exists merchants_corridor_cat on merchants (corridor_id, category_id, tier);
create index if not exists merchants_status on merchants (status);

-- Applications are private submissions; only trusted server review can
-- promote one into a public merchant listing with verified coordinates.
create table if not exists merchant_applications (
  id                    uuid primary key default gen_random_uuid(),
  owner_id              uuid not null references users(id) on delete cascade,
  name                  text not null,
  category_id           text not null references categories(id),
  requested_corridor_id text not null references corridors(id),
  description           text not null,
  ghanapost             text not null,
  phone                 text not null,
  email                 text not null,
  hours                 text not null,
  price_band            smallint not null check (price_band between 1 and 3),
  requested_tier        text not null default 'starter' check (requested_tier in ('starter','boost','billboard')),
  status                text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at            timestamptz not null default now(),
  reviewed_at           timestamptz,
  reviewer_id           uuid references users(id)
);
create unique index if not exists one_pending_application_per_owner
  on merchant_applications (owner_id) where status = 'pending';

-- ------------------------------------------------------------------- slots
create table if not exists slots (
  id           text primary key,
  corridor_id  text not null references corridors(id),
  category_id  text not null references categories(id),
  tier         text not null check (tier in ('boost','billboard')),
  position     smallint not null,
  price_cedis  int not null,
  status       text not null default 'available' check (status in ('sold','available','waitlist')),
  merchant_id  text references merchants(id) on delete set null,
  term_months  smallint not null default 12,
  waitlist     int not null default 0,
  unique (corridor_id, category_id, tier, position)
);

-- ------------------------------------------------------- plans & billing
create table if not exists subscriptions (
  id                uuid primary key default gen_random_uuid(),
  merchant_id       text not null references merchants(id) on delete cascade,
  tier              text not null check (tier in ('boost','billboard')),
  status            text not null default 'trialing' check (status in ('active','trialing','past_due','cancelled')),
  amount_cedis      int not null,
  started_at        timestamptz not null default now(),
  current_period_end timestamptz not null,
  paystack_ref      text,
  channel           text,
  unique (merchant_id, status) deferrable initially deferred
);
create index if not exists subscriptions_merchant on subscriptions (merchant_id);

create table if not exists invoices (
  id            uuid primary key default gen_random_uuid(),
  merchant_id   text not null references merchants(id) on delete cascade,
  subscription_id uuid references subscriptions(id),
  amount_cedis  int not null,
  status        text not null default 'pending' check (status in ('paid','pending','failed')),
  issued_at     timestamptz not null default now(),
  paid_at       timestamptz,
  reference     text unique not null,
  channel       text,
  description   text not null
);

-- --------------------------------------------------------------- analytics
-- Daily pre-aggregates. Raw client events land in analytics_events for
-- real-time dashboards; a nightly job (pg_cron) folds them into this table.
create table if not exists analytics_daily (
  merchant_id       text not null references merchants(id) on delete cascade,
  day               date not null,
  impressions       int not null default 0,
  views             int not null default 0,
  map_clicks        int not null default 0,
  phone_clicks      int not null default 0,
  direction_requests int not null default 0,
  qr_redemptions    int not null default 0,
  uniques           int not null default 0,
  sources           jsonb not null default '{}'::jsonb,
  primary key (merchant_id, day)
);

create table if not exists analytics_events (
  id           bigserial primary key,
  merchant_id  text not null references merchants(id) on delete cascade,
  type         text not null check (type in ('impression','view','map_click','phone_click','direction_request','qr_redemption','mini_open')),
  at           timestamptz not null default now(),
  source       text not null default 'direct',
  session_hash text not null
);
create index if not exists analytics_events_merchant_at on analytics_events (merchant_id, at desc);

-- --------------------------------------------------------------- mini apps
create table if not exists mini_apps (
  id                 text primary key,
  slug               text unique not null,
  name               text not null,
  partner            text not null,
  category           text not null,
  status             text not null default 'loi' check (status in ('live','pilot','loi')),
  blurb              text not null,
  take_rate_bps      int not null default 0,
  monthly_transactions int not null default 0,
  monthly_gmv_cedis  int not null default 0,
  scopes             text[] not null default '{}',
  accent             text not null default '#0B2E4A',
  launched_at        timestamptz
);

create table if not exists mini_consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  mini_app_id text not null references mini_apps(id) on delete cascade,
  scopes      text[] not null,
  granted_at  timestamptz not null default now(),
  revoked_at  timestamptz,
  unique (user_id, mini_app_id)
);

create table if not exists bookings (
  id          uuid primary key default gen_random_uuid(),
  mini_app_id text not null references mini_apps(id),
  user_id     uuid not null references users(id),
  merchant_id text not null references merchants(id),
  service     text not null,
  price_cedis int not null,
  starts_at   timestamptz not null,
  status      text not null default 'confirmed',
  reference   text unique not null,
  created_at  timestamptz not null default now()
);

create table if not exists ticket_orders (
  id          uuid primary key default gen_random_uuid(),
  mini_app_id text not null references mini_apps(id),
  user_id     uuid not null references users(id),
  event_name  text not null,
  quantity    smallint not null,
  total_cedis int not null,
  status      text not null default 'paid',
  reference   text unique not null,
  created_at  timestamptz not null default now()
);

-- Stable product reference data only. Business records are added through the
-- verified application and review flow, never copied from the demo seed.
insert into corridors (
  id, name, city, gps_prefix, center_lat, center_lng, bounds,
  target_storefronts, live, launch_month
) values
  ('osu', 'Osu — Oxford Street', 'Accra', 'GA', 5.5583, -0.1809,
   '{"north":5.5665,"south":5.5515,"east":-0.1735,"west":-0.1885}'::jsonb, 620, true, 'Month 1'),
  ('east-legon', 'East Legon', 'Accra', 'GA', 5.6349, -0.1692,
   '{"north":5.6445,"south":5.6255,"east":-0.1575,"west":-0.1815}'::jsonb, 780, true, 'Month 4'),
  ('kumasi-adum', 'Kumasi — Adum & Asokwa', 'Kumasi', 'AS', 6.6885, -1.6244,
   '{"north":6.7025,"south":6.6745,"east":-1.6075,"west":-1.6415}'::jsonb, 450, false, 'Month 16')
on conflict (id) do nothing;

insert into categories (id, name, slug, blurb, icon, avg_ticket_cedis) values
  ('food', 'Cafés & restaurants', 'food', 'Coffee, meals and local dining.', 'utensils', 72),
  ('beauty', 'Salons, barbers & beauty', 'beauty', 'Hair, nails and personal care.', 'scissors', 140),
  ('repair', 'Phone & electronics repair', 'repair', 'Phone and electronics repair services.', 'smartphone', 260),
  ('health', 'Clinics & pharmacies', 'health', 'Clinics and pharmacies.', 'stethoscope', 190),
  ('fitness', 'Gyms & fitness studios', 'fitness', 'Gyms, classes and fitness studios.', 'dumbbell', 240),
  ('professional', 'Co-working & services', 'professional', 'Workspaces and professional services.', 'briefcase', 380)
on conflict (id) do nothing;

insert into plans (tier, name, price_cedis, cadence, slots_per_category, features, cta, popular) values
  ('starter', 'Starter', 0, 'month', 0, array['Verified listing', 'Photos, hours and directions'], 'Claim your free listing', false),
  ('boost', 'Boost', 99, 'month', 8, array['Priority category placement', 'Weekly performance digest'], 'Boost my visibility', true),
  ('billboard', 'Billboard', 249, 'month', 3, array['Top corridor placement', 'Produced 360-degree tour'], 'Take a Billboard slot', false)
on conflict (tier) do nothing;

-- =========================================================== RLS policies
alter table corridors        enable row level security;
alter table categories       enable row level security;
alter table plans            enable row level security;
alter table users            enable row level security;
alter table merchants        enable row level security;
alter table merchant_applications enable row level security;
alter table slots            enable row level security;
alter table subscriptions    enable row level security;
alter table invoices         enable row level security;
alter table analytics_daily  enable row level security;
alter table analytics_events enable row level security;
alter table mini_apps        enable row level security;
alter table mini_consents    enable row level security;
alter table bookings         enable row level security;
alter table ticket_orders    enable row level security;

-- Public may read catalogue data, but all writes go through trusted server code.
create policy "public reads corridors" on corridors
  for select using (true);
create policy "public reads categories" on categories
  for select using (true);
create policy "public reads plans" on plans
  for select using (true);
create policy "public reads mini apps" on mini_apps
  for select using (true);

-- Users can read their own profile. Profile and role writes use the server key.
create policy "user reads self" on users
  for select using (auth_id = auth.uid());

-- Application records have no client policies: only the trusted server may
-- submit or review them after checking the authenticated account.

-- Public may read verified merchants; merchants may also read their own record.
create policy "public reads verified merchants" on merchants
  for select using (status = 'verified');
create policy "merchant reads self" on merchants
  for select using (
    owner_id = (select id from users where auth_id = auth.uid())
  );

create policy "public reads slot inventory" on slots
  for select using (true);

-- Billing and analytics are private to the owning merchant.
create policy "merchant reads own subscription" on subscriptions
  for select using (
    merchant_id in (select id from merchants where owner_id = (select id from users where auth_id = auth.uid()))
  );
create policy "merchant reads own invoices" on invoices
  for select using (
    merchant_id in (select id from merchants where owner_id = (select id from users where auth_id = auth.uid()))
  );
create policy "merchant reads own analytics" on analytics_daily
  for select using (
    merchant_id in (select id from merchants where owner_id = (select id from users where auth_id = auth.uid()))
  );
create policy "merchant reads own events" on analytics_events
  for select using (
    merchant_id in (select id from merchants where owner_id = (select id from users where auth_id = auth.uid()))
  );
create policy "user reads own consents" on mini_consents
  for all
  using (user_id = (select id from users where auth_id = auth.uid()))
  with check (user_id = (select id from users where auth_id = auth.uid()));

-- Booking and ticket data is private to the customer who created it.
create policy "user reads own bookings" on bookings
  for select using (
    user_id = (select id from users where auth_id = auth.uid())
  );
create policy "user reads own ticket orders" on ticket_orders
  for select using (
    user_id = (select id from users where auth_id = auth.uid())
  );

-- No client write policies are defined for protected tables. Server mutations
-- use the service role only after checking the application session and role.
create policy "service writes events" on analytics_events
  for insert with check (auth.role() = 'service_role');
