/**
 * Deterministic seed for Seen's demo dataset.
 *
 * Osu and East Legon, 6 categories, 96 storefronts, a full slot inventory
 * (3 Billboard + 8 Boost per category per corridor), 90 days of aggregated
 * analytics, subscriptions, invoices, and three live mini-apps.
 *
 * All businesses are fictional. Corridor geography, GhanaPostGPS formatting,
 * price points and metric ratios follow the operating model in the business plan.
 */
import type {
  AnalyticsEvent,
  Booking,
  Category,
  Corridor,
  Invoice,
  Merchant,
  MiniApp,
  MiniAppConsent,
  Plan,
  Slot,
  Subscription,
  TicketOrder,
  Tier,
  User,
} from "@/lib/types";

export interface DailyMetric {
  merchantId: string;
  day: string;
  impressions: number;
  views: number;
  mapClicks: number;
  phoneClicks: number;
  directionRequests: number;
  qrRedemptions: number;
  uniques: number;
  sources: Record<string, number>;
}

export interface SeenDb {
  version: number;
  generatedAt: string;
  corridors: Corridor[];
  categories: Category[];
  plans: Plan[];
  merchants: Merchant[];
  slots: Slot[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  users: User[];
  miniApps: MiniApp[];
  consents: MiniAppConsent[];
  bookings: Booking[];
  ticketOrders: TicketOrder[];
  liveEvents: AnalyticsEvent[];
  demoMerchantSlug: string;
}

/* ------------------------------------------------------------------ rng */
function hashSeed(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: () => number, items: T[]): T => items[Math.floor(rng() * items.length)]!;
const between = (rng: () => number, min: number, max: number) =>
  Math.round(min + rng() * (max - min));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ------------------------------------------------------------ reference */
export const CORRIDORS: Corridor[] = [
  {
    id: "osu",
    name: "Osu — Oxford Street",
    city: "Accra",
    gpsPrefix: "GA",
    center: { lat: 5.5583, lng: -0.1809 },
    bounds: { north: 5.5665, south: 5.5515, east: -0.1735, west: -0.1885 },
    targetStorefronts: 620,
    live: true,
    launchMonth: "Month 1",
  },
  {
    id: "east-legon",
    name: "East Legon",
    city: "Accra",
    gpsPrefix: "GA",
    center: { lat: 5.6349, lng: -0.1692 },
    bounds: { north: 5.6445, south: 5.6255, east: -0.1575, west: -0.1815 },
    targetStorefronts: 780,
    live: true,
    launchMonth: "Month 4",
  },
  {
    id: "kumasi-adum",
    name: "Kumasi — Adum & Asokwa",
    city: "Kumasi",
    gpsPrefix: "AS",
    center: { lat: 6.6885, lng: -1.6244 },
    bounds: { north: 6.7025, south: 6.6745, east: -1.6075, west: -1.6415 },
    targetStorefronts: 450,
    live: false,
    launchMonth: "Month 16",
  },
];

export const CATEGORIES: Category[] = [
  {
    id: "food",
    name: "Cafés & restaurants",
    slug: "food",
    blurb: "Coffee, jollof, suya and everything worth leaving the office for.",
    icon: "utensils",
    avgTicketCedis: 72,
  },
  {
    id: "beauty",
    name: "Salons, barbers & beauty",
    slug: "beauty",
    blurb: "Cuts, braids, nails and the chairs that book out by Wednesday.",
    icon: "scissors",
    avgTicketCedis: 140,
  },
  {
    id: "repair",
    name: "Phone & electronics repair",
    slug: "repair",
    blurb: "Screens, batteries and data recovery from people who fix, not guess.",
    icon: "smartphone",
    avgTicketCedis: 260,
  },
  {
    id: "health",
    name: "Clinics & pharmacies",
    slug: "health",
    blurb: "Verified practitioners, opening hours you can trust, no queue surprise.",
    icon: "stethoscope",
    avgTicketCedis: 190,
  },
  {
    id: "fitness",
    name: "Gyms & fitness studios",
    slug: "fitness",
    blurb: "Day passes, classes and memberships within walking distance.",
    icon: "dumbbell",
    avgTicketCedis: 240,
  },
  {
    id: "professional",
    name: "Co-working & services",
    slug: "professional",
    blurb: "Desks, studios, accountants and lawyers who actually pick up.",
    icon: "briefcase",
    avgTicketCedis: 380,
  },
];

export const PLANS: Plan[] = [
  {
    tier: "starter",
    name: "Starter",
    priceCedis: 0,
    cadence: "month",
    slotsPerCategory: 0,
    features: [
      "Verified listing with GhanaPostGPS address",
      "3 photos, hours, phone and directions",
      "Searchable by name and category",
      "Map pin within your corridor",
    ],
    cta: "Claim your free listing",
  },
  {
    tier: "boost",
    name: "Boost",
    priceCedis: 99,
    cadence: "month",
    slotsPerCategory: 8,
    features: [
      "Priority rank in your category and 2 km radius",
      "360° preview slot",
      "Weekly WhatsApp performance digest",
      "Review prompts and 2 campaign pushes per quarter",
      "Impressions, clicks and direction-request dashboard",
    ],
    cta: "Boost my visibility",
    popular: true,
  },
  {
    tier: "billboard",
    name: "Billboard",
    priceCedis: 249,
    cadence: "month",
    slotsPerCategory: 3,
    features: [
      "Top of homepage and top of category search",
      "Category-leader badge in your corridor",
      "Professionally produced 360° tour",
      "Monthly performance call with your Seen rep",
      "First refusal on mini-app placement",
      "24-month price lock for founding merchants",
    ],
    cta: "Take a Billboard slot",
  },
];

export const MINI_APPS: MiniApp[] = [
  {
    id: "quickbook",
    slug: "quickbook",
    name: "QuickBook",
    partner: "QuickBook Ghana Ltd",
    category: "booking",
    status: "live",
    blurb:
      "Appointments at salons, clinics and studios without a phone call. Sees your Seen identity and the chair you already trust.",
    takeRateBps: 500,
    monthlyTransactions: 1840,
    monthlyGmvCedis: 92400,
    scopes: ["identity", "phone", "address", "booking"],
    accent: "#1E6B4F",
    launchedAt: "2026-09-18T09:00:00.000Z",
  },
  {
    id: "accra-live",
    slug: "accra-live",
    name: "Accra Live",
    partner: "Accra Live Events",
    category: "ticketing",
    status: "live",
    blurb:
      "What's on in Accra this weekend, ticketed inside Seen. Mobile money checkout, QR entry, no printout.",
    takeRateBps: 800,
    monthlyTransactions: 726,
    monthlyGmvCedis: 61200,
    scopes: ["identity", "phone", "payments"],
    accent: "#A8442A",
    launchedAt: "2026-10-04T10:00:00.000Z",
  },
  {
    id: "nexus-bills",
    slug: "nexus-bills",
    name: "Nexus Bills",
    partner: "GCB G-Money Nexus (pilot)",
    category: "bills",
    status: "pilot",
    blurb:
      "Electricity, water and airtime in one pass. Pilot integration on licensed rails — no float, no custody.",
    takeRateBps: 150,
    monthlyTransactions: 210,
    monthlyGmvCedis: 47000,
    scopes: ["identity", "phone", "payments"],
    accent: "#0B2E4A",
  },
];

export const DEMO_USERS: User[] = [
  {
    id: "u-ama",
    email: "ama@example.gh",
    name: "Ama Mensah",
    phone: "024 555 0142",
    ghanapost: "GA-585-7449",
    role: "consumer",
    createdAt: "2026-03-11T08:30:00.000Z",
  },
  {
    id: "u-kofi",
    email: "kofi@kenteandkoffee.gh",
    name: "Kofi Boateng",
    phone: "020 774 1180",
    ghanapost: "GA-512-3388",
    role: "merchant",
    merchantId: "m-kente-and-koffee-osu",
    createdAt: "2026-01-14T07:45:00.000Z",
  },
  {
    id: "u-ops",
    email: "ops@seen.gh",
    name: "Nana Adjei",
    phone: "055 301 9022",
    role: "admin",
    createdAt: "2026-01-02T06:00:00.000Z",
  },
];

/* ------------------------------------------------------------- brands */
interface BrandSeed {
  name: string;
  categoryId: Category["id"];
  tagline: string;
  blurb: string;
  priceBand: 1 | 2 | 3;
  amenities: string[];
  corridors: Corridor["id"][];
  founding?: boolean;
  panorama?: string;
  branches?: number;
}

const BRANDS: BrandSeed[] = [
  {
    name: "Kente & Koffee",
    categoryId: "food",
    tagline: "Single-origin Ghanaian coffee, all-day breakfast, fast wifi.",
    blurb:
      "Roasted in Kumasi, brewed on Oxford Street. Kente & Koffee is where Osu takes its 9am calls and its 3pm meetings. The GhanaPostGPS address is on the menu so deliveries stop getting lost.",
    priceBand: 2,
    amenities: ["Wifi", "Outdoor seating", "Card & MoMo", "Work-friendly"],
    corridors: ["osu", "east-legon"],
    founding: true,
    panorama: "/panoramas/cafe-1.png",
    branches: 2,
  },
  {
    name: "Chop Bar Republic",
    categoryId: "food",
    tagline: "Waakye at dawn, grilled tilapia at dusk.",
    blurb:
      "A proper Accra chop bar with a fancier signboard. The waakye runs out by 11, so the regulars order on their way to work. Family-run since 2009.",
    priceBand: 1,
    amenities: ["Takeaway", "Cash", "Family-run"],
    corridors: ["osu"],
    founding: true,
  },
  {
    name: "Adjoa's Kitchen",
    categoryId: "food",
    tagline: "Jollof rice that settles arguments.",
    blurb:
      "Adjoa cooks one thing at lunch and one thing at dinner, and the queue proves the point. Party orders for 20+ need 24 hours.",
    priceBand: 2,
    amenities: ["Takeaway", "Party orders", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "The Jollof Room",
    categoryId: "food",
    tagline: "Jollof flights, kelewele and a small bar.",
    blurb:
      "Three regional jollof styles on one menu, served with a kelewele basket and a very loud playlist. Book ahead on Fridays.",
    priceBand: 2,
    amenities: ["Bar", "Indoor seating", "Live music Fri", "Card & MoMo"],
    corridors: ["osu"],
    panorama: "/panoramas/restaurant-1.png",
  },
  {
    name: "Buka & Grill",
    categoryId: "food",
    tagline: "Suya, grilled chicken and cold Club.",
    blurb:
      "The open grill on the street tells you where to stop. Order the suya with extra yaji, sit on the veranda, stay for the second round.",
    priceBand: 1,
    amenities: ["Outdoor seating", "Takeaway", "Cash", "Late (till 23:00)"],
    corridors: ["east-legon"],
  },
  {
    name: "Nsuo Juice Bar",
    categoryId: "food",
    tagline: "Cold-pressed sobolo, ginger shots and moringa smoothies.",
    blurb:
      "A five-stool juice counter that keeps half of East Legon's gym-goers upright. Everything is pressed to order, nothing sits overnight.",
    priceBand: 1,
    amenities: ["Takeaway", "Vegan options", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "Smoothie Republic",
    categoryId: "food",
    tagline: "Post-gym bowls, toast and terrible jokes.",
    blurb:
      "Protein bowls, ACAI-style smoothies and a loyalty card that socialises more than the staff do. Fill up your own bottle for a small discount.",
    priceBand: 2,
    amenities: ["Wifi", "Vegan options", "Loyalty card"],
    corridors: ["osu"],
  },
  {
    name: "The Labone Table",
    categoryId: "food",
    tagline: "Seasonal menu, terrace, slow lunches.",
    blurb:
      "Thirty seats, a chalkboard menu that changes weekly and a kitchen that respects a long lunch. Reservations open Monday.",
    priceBand: 3,
    amenities: ["Reservations", "Terrace", "Card", "Date night"],
    corridors: ["osu"],
  },
  {
    name: "Yam & Egg",
    categoryId: "food",
    tagline: "Breakfast all day, boiled yam all ways.",
    blurb:
      "The name is the menu, mostly. Add fried plantain, sardines and a hot cup of Milo and you have the office favourite at half the price.",
    priceBand: 1,
    amenities: ["Takeaway", "Breakfast", "Cash & MoMo"],
    corridors: ["osu", "east-legon"],
    branches: 2,
  },
  {
    name: "Toast & Tonic",
    categoryId: "food",
    tagline: "Brunch cocktails and very good sourdough.",
    blurb:
      "Brunch from 10, cocktails from 12. The balcony seats are the reason people book, so book.",
    priceBand: 3,
    amenities: ["Brunch", "Cocktails", "Reservations", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "Osu Barber Lab",
    categoryId: "beauty",
    tagline: "Skin fades, hot towel shaves, walk-ins until 8.",
    blurb:
      "Six chairs, no waiting-room television, and a barber who will tell you not to do that to your hairline. QuickBook appointments recommended after 5pm.",
    priceBand: 2,
    amenities: ["Walk-ins", "Hot towel", "MoMo", "Book on Seen"],
    corridors: ["osu"],
    founding: true,
    panorama: "/panoramas/salon-1.png",
  },
  {
    name: "Bella's Beauty Bar",
    categoryId: "beauty",
    tagline: "Gel nails, lashes and a very calm room.",
    blurb:
      "Bella's runs on appointments and quiet. Nail art books two weeks out; lashes and brows are walk-in friendly on weekday mornings.",
    priceBand: 2,
    amenities: ["Appointments", "Lashes", "Nails", "Card"],
    corridors: ["east-legon"],
    panorama: "/panoramas/salon-1.png",
  },
  {
    name: "Adjoa Braids Studio",
    categoryId: "beauty",
    tagline: "Braids that last twelve weeks, not six.",
    blurb:
      "Twelve braiders, a playlist that never repeats, and a firm 72-hour reminder by SMS. Bring your own hair or buy theirs.",
    priceBand: 2,
    amenities: ["Braids", "Extensions sold", "MoMo", "Long appointments"],
    corridors: ["osu"],
  },
  {
    name: "The Grooming Room",
    categoryId: "beauty",
    tagline: "Men's cuts, beard work and a decent espresso.",
    blurb:
      "A barbershop for men who want a booking, not a queue. Beard trim includes a hot towel and a straight-razor finish.",
    priceBand: 2,
    amenities: ["Appointments", "Beard trim", "Card", "Wifi"],
    corridors: ["east-legon"],
  },
  {
    name: "Crown & Comb",
    categoryId: "beauty",
    tagline: "Natural hair care, kids' cuts and locs.",
    blurb:
      "A salon that treats natural hair as a specialism, not a side note. Kids' chairs on Saturday mornings, loc retwists all day.",
    priceBand: 2,
    amenities: ["Natural hair", "Locs", "Kids", "MoMo"],
    corridors: ["osu", "east-legon"],
    branches: 2,
  },
  {
    name: "Nubian Glow Spa",
    categoryId: "beauty",
    tagline: "Facials, waxing and 60 minutes of silence.",
    blurb:
      "Three treatment rooms, no phones, no upsell. Book the 45-minute facial if it is your first time.",
    priceBand: 3,
    amenities: ["Spa", "Facials", "Appointments", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "Oxford Phone Clinic",
    categoryId: "repair",
    tagline: "Screens replaced while you drink a coffee.",
    blurb:
      "Fifteen years on Oxford Street, a 45-minute iPhone screen turnaround and a written 90-day warranty. Data recovery for water-damaged phones is their specialty.",
    priceBand: 2,
    amenities: ["90-day warranty", "Same-day repair", "MoMo", "Data recovery"],
    corridors: ["osu"],
    founding: true,
  },
  {
    name: "iFix Osu",
    categoryId: "repair",
    tagline: "Board-level repair, not just screen swaps.",
    blurb:
      "Microsoldering and board repair for phones that other shops have given up on. Diagnostics are free if you repair with them.",
    priceBand: 2,
    amenities: ["Board repair", "Data recovery", "Free diagnostics", "Card"],
    corridors: ["osu"],
  },
  {
    name: "Gadget Medics East Legon",
    categoryId: "repair",
    tagline: "Phones, laptops and consoles, fixed properly.",
    blurb:
      "Walk in with a cracked screen or a laptop that won't boot; walk out with a repair note and a warranty. They text you before they order a part.",
    priceBand: 2,
    amenities: ["Laptops", "Consoles", "Warranty", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "ScreenPros",
    categoryId: "repair",
    tagline: "Screen and battery swaps in 30 minutes.",
    blurb:
      "A small, fast, no-frills bench shop. Original-grade parts, transparent pricing on the wall, and a queue system that actually moves.",
    priceBand: 1,
    amenities: ["30-minute service", "Original parts", "Cash", "Walk-ins"],
    corridors: ["east-legon"],
  },
  {
    name: "TechTonic Repairs",
    categoryId: "repair",
    tagline: "Certified technicians for Samsung, Tecno and Infinix.",
    blurb:
      "Authorised parts for the three brands that actually sell in Accra, plus honest advice about when a repair is not worth it.",
    priceBand: 2,
    amenities: ["Certified techs", "Brand parts", "MoMo", "Bookings"],
    corridors: ["osu"],
  },
  {
    name: "Battery Boys",
    categoryId: "repair",
    tagline: "Your phone dies at 2pm. That ends today.",
    blurb:
      "Battery replacements for every model they can source, plus power banks and honest capacity tests. Twenty-minute service.",
    priceBand: 1,
    amenities: ["20-minute service", "Power banks", "Cash & MoMo"],
    corridors: ["osu", "east-legon"],
    branches: 2,
  },
  {
    name: "Labone Wellness Pharmacy",
    categoryId: "health",
    tagline: "Pharmacists who will actually explain the dosage.",
    blurb:
      "A neighbourhood pharmacy with a consultation window, blood-pressure checks and prescription refills by WhatsApp. NHIS accepted.",
    priceBand: 2,
    amenities: ["NHIS", "BP checks", "Refills by WhatsApp", "Card"],
    corridors: ["osu"],
    founding: true,
  },
  {
    name: "East Legon Dental Studio",
    categoryId: "health",
    tagline: "Gentle dentistry, Saturday appointments.",
    blurb:
      "Cleanings, fillings and whitening with a hygienist who explains what she is doing before she does it. Emergency slots held daily.",
    priceBand: 3,
    amenities: ["Saturday", "Emergency slots", "Hygienist", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "Cantonments Clinic",
    categoryId: "health",
    tagline: "GP consultations, same-day results, calm rooms.",
    blurb:
      "General practice, travel vaccines and a small lab that turns around most results the same day. Walk-ins before 10am.",
    priceBand: 3,
    amenities: ["GP", "Lab", "Vaccines", "Walk-ins"],
    corridors: ["osu"],
  },
  {
    name: "Osu Family Health",
    categoryId: "health",
    tagline: "Family medicine with a paediatric focus.",
    blurb:
      "A GP-led practice that sees whole families, with a separate paediatric room and a nurse who calls you back the next day.",
    priceBand: 2,
    amenities: ["Paediatrics", "Family medicine", "NHIS", "MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Danquah Diagnostics",
    categoryId: "health",
    tagline: "Lab tests without the hospital queue.",
    blurb:
      "Bloods, scans and rapid tests, with results delivered by WhatsApp and a doctor's review available same day.",
    priceBand: 2,
    amenities: ["Lab", "Scan", "Results on WhatsApp", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "Smile Accra Dental",
    categoryId: "health",
    tagline: "Braces, whitening and painless extractions.",
    blurb:
      "A dental practice built around nervous patients: numbing first, small talk second, and a payment plan for braces.",
    priceBand: 3,
    amenities: ["Orthodontics", "Payment plans", "Sedation", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "The Compound Gym",
    categoryId: "fitness",
    tagline: "Free weights, no mirrors, real coaching.",
    blurb:
      "A serious gym with a proper rack, three coaches on the floor, and a day pass that does not cost a week's salary.",
    priceBand: 2,
    amenities: ["Day passes", "Coaching", "Free weights", "Showers"],
    corridors: ["osu"],
    founding: true,
    panorama: "/panoramas/gym-1.png",
  },
  {
    name: "Legon Fit Lab",
    categoryId: "fitness",
    tagline: "Small-group strength classes, 45 minutes.",
    blurb:
      "Six people per class, a coach who corrects your form, and a schedule that fits around lectures and stand-ups.",
    priceBand: 2,
    amenities: ["Classes", "Small groups", "Showers", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "Osu Run Club & Studio",
    categoryId: "fitness",
    tagline: "6am runs from Oxford Street, strength after.",
    blurb:
      "A run club that turned into a studio. Tuesday and Thursday 6am runs, strength classes at 7, and a coffee discount next door.",
    priceBand: 1,
    amenities: ["Run club", "Strength", "Day passes", "MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Iron House East Legon",
    categoryId: "fitness",
    tagline: "Powerlifting, strongman, and a very loud playlist.",
    blurb:
      "Plates, chalk and coaching for people who train rather than attend. Monthly memberships, no lock-in.",
    priceBand: 2,
    amenities: ["Powerlifting", "Strongman", "Monthly", "No lock-in"],
    corridors: ["east-legon"],
  },
  {
    name: "Flow Yoga Accra",
    categoryId: "fitness",
    tagline: "Vinyasa and yin, mornings and evenings.",
    blurb:
      "A calm studio above a bookshop, mats provided, and classes small enough that the teacher knows your name by week two.",
    priceBand: 2,
    amenities: ["Yoga", "Mats provided", "Class packs", "Card"],
    corridors: ["osu", "east-legon"],
    branches: 2,
  },
  {
    name: "Pulse Fitness Labone",
    categoryId: "fitness",
    tagline: "Cardio, spin and a 30-day starter plan.",
    blurb:
      "Machines that work, classes that start on time, and a 30-day starter plan with a coach who checks in weekly.",
    priceBand: 2,
    amenities: ["Spin", "Cardio", "Starter plan", "Showers"],
    corridors: ["osu"],
  },
  {
    name: "Akwaaba Cowork",
    categoryId: "professional",
    tagline: "Desks, meeting rooms and coffee that stays hot.",
    blurb:
      "Forty desks, three meeting rooms and a founders' floor. Day passes include printing and a phone booth that actually blocks sound.",
    priceBand: 3,
    amenities: ["Hot desks", "Meeting rooms", "Printing", "Phone booths"],
    corridors: ["osu"],
    founding: true,
  },
  {
    name: "Palm & Pine Coworking",
    categoryId: "professional",
    tagline: "Garden desks and quiet rooms in East Legon.",
    blurb:
      "A converted house with a garden, six private offices and a no-calls-in-the-garden policy. Parking on site.",
    priceBand: 3,
    amenities: ["Garden", "Private offices", "Parking", "Quiet rooms"],
    corridors: ["east-legon"],
  },
  {
    name: "BrightBooks Accounting",
    categoryId: "professional",
    tagline: "Bookkeeping, GRA filings, and sane advice.",
    blurb:
      "A small practice for small businesses: monthly bookkeeping, VAT and PAYE filings, and a founder who will tell you what your numbers mean.",
    priceBand: 2,
    amenities: ["Bookkeeping", "GRA filings", "Payroll", "Remote"],
    corridors: ["osu", "east-legon"],
    branches: 2,
  },
  {
    name: "Adjoa Legal Practice",
    categoryId: "professional",
    tagline: "Business registration, contracts, property.",
    blurb:
      "A three-lawyer practice for founders: company registration, shareholder agreements, commercial leases and employment contracts.",
    priceBand: 3,
    amenities: ["Company registration", "Contracts", "Property", "Appointments"],
    corridors: ["east-legon"],
  },
  {
    name: "Nkrumah Design Studio",
    categoryId: "professional",
    tagline: "Brand, packaging and print for Ghanaian SMEs.",
    blurb:
      "A studio that brands chop bars and fintechs with equal seriousness. Signage, packaging and print, delivered on schedule.",
    priceBand: 2,
    amenities: ["Branding", "Packaging", "Print", "Studio visits"],
    corridors: ["osu"],
  },
  {
    name: "The Accra Mailroom",
    categoryId: "professional",
    tagline: "Packages, notarisations and courier runs.",
    blurb:
      "A small logistics counter that receives parcels, handles courier drop-offs and notarises documents while you wait.",
    priceBand: 1,
    amenities: ["Parcels", "Courier", "Notary", "Cash"],
    corridors: ["osu", "east-legon"],
    branches: 2,
  },
  {
    name: "Coco Bowl Osu",
    categoryId: "food",
    tagline: "Coconut rice bowls and iced cocoa.",
    blurb:
      "A ten-seat counter serving coconut rice, grilled chicken and iced cocoa to the Oxford Street lunch crowd.",
    priceBand: 1,
    amenities: ["Takeaway", "Lunch", "MoMo"],
    corridors: ["osu"],
  },
  {
    name: "East Legon Fish Grill",
    categoryId: "food",
    tagline: "Grilled tilapia and banku, done right.",
    blurb:
      "Whole tilapia grilled to order with banku and hot pepper. Expect a 25-minute wait and a table full of regulars.",
    priceBand: 2,
    amenities: ["Outdoor seating", "Grill", "Card & MoMo", "Family"],
    corridors: ["east-legon"],
  },
  {
    name: "The Fade Factory",
    categoryId: "beauty",
    tagline: "Fades, line-ups and no small talk.",
    blurb:
      "Four chairs, appointments only after 4pm, and the cleanest line-up in East Legon. Cash and MoMo.",
    priceBand: 2,
    amenities: ["Appointments", "Fades", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "Mane & Co",
    categoryId: "beauty",
    tagline: "Wash, blow-dry and silk press specialists.",
    blurb:
      "A hair studio focused on healthy hair: treatments, trims and a silk press that survives Accra humidity.",
    priceBand: 2,
    amenities: ["Silk press", "Treatments", "Appointments", "Card"],
    corridors: ["osu"],
  },
  {
    name: "A&C Repairs",
    categoryId: "repair",
    tagline: "Fridges, ACs and washing machines.",
    blurb:
      "Home appliance repair with a call-out service across East Legon. Diagnostics GH₵80, deducted from the repair.",
    priceBand: 2,
    amenities: ["Call-out", "Appliances", "Warranty", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "Boundary Road Physio",
    categoryId: "health",
    tagline: "Sports physio and post-surgery rehab.",
    blurb:
      "A physio practice for runners, footballers and anyone recovering from a desk. Assessment includes a movement screen.",
    priceBand: 3,
    amenities: ["Physio", "Rehab", "Sports", "Appointments"],
    corridors: ["east-legon"],
  },
  {
    name: "Kelewele Corner",
    categoryId: "food",
    tagline: "Spicy kelewele, fried to order after 5pm.",
    blurb:
      "A street-side kelewele stand that has been on the same corner for eleven years. Cash, MoMo, and a queue that moves fast.",
    priceBand: 1,
    amenities: ["Evening only", "Takeaway", "Cash & MoMo"],
    corridors: ["osu"],
  },
  {
    name: "The Waakye Stand",
    categoryId: "food",
    tagline: "Waakye, gari and shito until it runs out.",
    blurb:
      "One pot, one queue, gone by 11am. Regulars know to come before the church crowd.",
    priceBand: 1,
    amenities: ["Breakfast", "Takeaway", "Cash"],
    corridors: ["osu"],
  },
  {
    name: "Suya Republic",
    categoryId: "food",
    tagline: "Yaji-spiced skewers, grilled on the street.",
    blurb:
      "Beef, chicken and gizzard skewers with a yaji that bites back. Open late, busiest after 20:00.",
    priceBand: 1,
    amenities: ["Late", "Takeaway", "Outdoor"],
    corridors: ["east-legon"],
  },
  {
    name: "Accra Coffee Cart",
    categoryId: "food",
    tagline: "Espresso on the pavement, 06:30 to 11:00.",
    blurb:
      "A two-person cart serving flat whites to the office run. Oat milk, card and MoMo, no seats.",
    priceBand: 1,
    amenities: ["Takeaway", "Early", "Card & MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Nail Bar Labone",
    categoryId: "beauty",
    tagline: "Gel sets, pedicures and a decent playlist.",
    blurb:
      "A nail bar that keeps its tools sterile and its appointments on time. Walk-ins welcome before noon.",
    priceBand: 2,
    amenities: ["Nails", "Pedicure", "Walk-ins", "MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Kinky Curly Studio",
    categoryId: "beauty",
    tagline: "Curl specialists, trims and deep conditioning.",
    blurb:
      "A curl-focused studio that will not force a relaxer on you. Consultations free with any treatment.",
    priceBand: 2,
    amenities: ["Natural hair", "Treatments", "Appointments", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "The Shave Room",
    categoryId: "beauty",
    tagline: "Classic shaves and beard shaping.",
    blurb:
      "Straight-razor shaves, beard oil and a chair that reclines. Walk-in queue is shortest mid-afternoon.",
    priceBand: 1,
    amenities: ["Shaves", "Walk-ins", "Cash"],
    corridors: ["east-legon"],
  },
  {
    name: "Phone Doctor Circle",
    categoryId: "repair",
    tagline: "Diagnostics first, parts second.",
    blurb:
      "A bench shop that tells you what is actually wrong before quoting. No fix, no fee.",
    priceBand: 1,
    amenities: ["No fix no fee", "Diagnostics", "Cash & MoMo"],
    corridors: ["osu"],
  },
  {
    name: "QuickFix Gadgets",
    categoryId: "repair",
    tagline: "Charging ports, speakers and small electronics.",
    blurb:
      "The shop that fixes the things nobody else wants to touch: charging ports, speakers and Bluetooth boxes.",
    priceBand: 1,
    amenities: ["Small electronics", "Same day", "MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Screens & Things",
    categoryId: "repair",
    tagline: "Tablets, laptops and screen protectors.",
    blurb:
      "Repairs for tablets and laptops, plus a protector-fitting service that does not leave bubbles.",
    priceBand: 2,
    amenities: ["Tablets", "Laptops", "Warranty", "Card"],
    corridors: ["east-legon"],
  },
  {
    name: "HealthPlus Chemist",
    categoryId: "health",
    tagline: "Prescriptions, vitamins and a nurse on site.",
    blurb:
      "A chemist with a nurse for blood pressure and sugar checks. NHIS and private prescriptions.",
    priceBand: 2,
    amenities: ["NHIS", "Nurse", "Vitamins", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "The Wellness Room",
    categoryId: "health",
    tagline: "Massage, physio and a quiet hour.",
    blurb:
      "Sports massage and light physio in a room that smells of shea butter, not hospital.",
    priceBand: 2,
    amenities: ["Massage", "Physio", "Appointments", "Card"],
    corridors: ["osu"],
  },
  {
    name: "East Legon Optical",
    categoryId: "health",
    tagline: "Eye tests, frames and same-day lenses.",
    blurb:
      "An optician that stocks frames people actually want to wear, with same-day single-vision lenses.",
    priceBand: 2,
    amenities: ["Eye tests", "Same-day lenses", "Card", "NHIS"],
    corridors: ["east-legon"],
  },
  {
    name: "Spin Room Accra",
    categoryId: "fitness",
    tagline: "45-minute spin classes, towels included.",
    blurb:
      "Twenty bikes, a live playlist and a class that starts on the dot. First class is free.",
    priceBand: 2,
    amenities: ["Spin", "First class free", "Towels", "Card"],
    corridors: ["osu"],
  },
  {
    name: "Box & Burn",
    categoryId: "fitness",
    tagline: "Boxing fitness, no sparring required.",
    blurb:
      "Pad work, bag rounds and conditioning for people who want the workout without the fight.",
    priceBand: 2,
    amenities: ["Boxing", "Classes", "Day passes", "MoMo"],
    corridors: ["east-legon"],
  },
  {
    name: "The Desk Hub",
    categoryId: "professional",
    tagline: "Six desks, one quiet room, fast fibre.",
    blurb:
      "A small coworking floor for freelancers who need reliable fibre and a door that locks.",
    priceBand: 2,
    amenities: ["Desks", "Fibre", "Quiet room", "MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Accra Print & Sign",
    categoryId: "professional",
    tagline: "Signage, banners and same-day printing.",
    blurb:
      "The print shop that saves launch days: banners, stickers and shop signs, often while you wait.",
    priceBand: 1,
    amenities: ["Printing", "Signage", "Same day", "Cash & MoMo"],
    corridors: ["osu"],
  },
  {
    name: "Studio Nine Photo",
    categoryId: "professional",
    tagline: "Product and portrait photography.",
    blurb:
      "A small studio for product shots and portraits, with a lighting setup that flatters food and fabric.",
    priceBand: 2,
    amenities: ["Photography", "Studio", "Product", "Appointments"],
    corridors: ["east-legon"],
  },
];

/** Rotate a photo set so neighbouring storefronts do not render the same plate. */
function rotate<T>(items: T[], by: number): T[] {
  if (items.length === 0) return items;
  const k = ((by % items.length) + items.length) % items.length;
  return [...items.slice(k), ...items.slice(0, k)];
}

const LANDMARKS: Record<Corridor["id"], string[]> = {
  osu: [
    "Oxford Street, opposite Koala",
    "Danquah Circle, behind the pharmacy",
    "Osu Castle Road, next to the clinic",
    "Ako Adjei, 200m from the junction",
    "Ringway Estates, off Cantonments Road",
    "Labone Junction, beside the fuel station",
    "Oxford Street, first floor above the boutique",
    "Nkrumah Close, off Ako Adjei",
  ],
  "east-legon": [
    "Boundary Road, opposite the school",
    "American House, behind the shell shop",
    "Lagos Avenue, next to the salon",
    "Adjiringanor, off the main road",
    "Shiashie, 150m from the roundabout",
    "East Legon Tunnel, beside the gym",
    "Bawaleshie, close to the clinic",
    "A&C Mall area, second floor",
  ],
  "kumasi-adum": ["Adum, near Kejetia", "Asokwa, off the ring road"],
};

const HOURS = [
  "Mon–Sat 08:00–20:00",
  "Mon–Fri 07:30–18:00",
  "Mon–Sat 09:00–21:00",
  "Tue–Sun 10:00–22:00",
  "Mon–Sun 07:00–19:00",
  "Mon–Fri 08:00–17:00",
];

const PHOTO_SETS: Record<Category["id"], string[]> = {
  food: ["/photos/food-1.svg", "/photos/food-2.svg", "/photos/food-3.svg", "/photos/food-4.svg"],
  beauty: ["/photos/beauty-1.svg", "/photos/beauty-2.svg", "/photos/beauty-3.svg"],
  repair: ["/photos/repair-1.svg", "/photos/repair-2.svg", "/photos/repair-3.svg"],
  health: ["/photos/health-1.svg", "/photos/health-2.svg", "/photos/health-3.svg"],
  fitness: ["/photos/fitness-1.svg", "/photos/fitness-2.svg", "/photos/fitness-3.svg"],
  professional: [
    "/photos/professional-1.svg",
    "/photos/professional-2.svg",
    "/photos/professional-3.svg",
  ],
};

/* --------------------------------------------------------- slot inventory */
function buildSlots(merchants: Merchant[]): Slot[] {
  const slots: Slot[] = [];
  for (const corridor of CORRIDORS.filter((c) => c.live)) {
    for (const category of CATEGORIES) {
      for (let position = 1; position <= 3; position++) {
        const id = `s-${corridor.id}-${category.id}-billboard-${position}`;
        const taken = merchants.find((m) => m.slotId === id);
        slots.push({
          id,
          corridorId: corridor.id,
          categoryId: category.id,
          tier: "billboard",
          position,
          priceCedis: catPrice("billboard", position),
          status: taken ? "sold" : "available",
          merchantId: taken?.id,
          termMonths: 12,
          waitlist: taken ? 0 : between(mulberry32(hashSeed(id)), 0, 4),
        });
      }
      for (let position = 1; position <= 8; position++) {
        const id = `s-${corridor.id}-${category.id}-boost-${position}`;
        const taken = merchants.find((m) => m.slotId === id);
        slots.push({
          id,
          corridorId: corridor.id,
          categoryId: category.id,
          tier: "boost",
          position,
          priceCedis: 99,
          status: taken ? "sold" : "available",
          merchantId: taken?.id,
          termMonths: 12,
          waitlist: taken ? 0 : between(mulberry32(hashSeed(id)), 0, 6),
        });
      }
    }
  }
  return slots;
}

/** Billboard prices ladder by position: 249, 199, 199 (position 1 is the hero slot). */
export function catPrice(tier: "billboard" | "boost", position: number): number {
  if (tier === "boost") return 99;
  return position === 1 ? 249 : 199;
}

/* ------------------------------------------------------------------ seed */
export function buildSeed(now = new Date()): { db: SeenDb; analytics: DailyMetric[] } {
  const rng = mulberry32(20261104);
  const merchants: Merchant[] = [];
  const subs: Subscription[] = [];
  const invoices: Invoice[] = [];

  // Expand brands into branches per corridor.
  const rows: { brand: BrandSeed; corridor: Corridor["id"]; branch: number }[] = [];
  for (const brand of BRANDS) {
    const corridors = brand.corridors.filter((c) => c !== "kumasi-adum");
    const wanted = brand.branches ?? corridors.length;
    for (let i = 0; i < Math.min(wanted, corridors.length); i++) {
      rows.push({ brand, corridor: corridors[i]!, branch: i + 1 });
    }
  }

  // Deterministic paying mix per corridor × category: one Billboard slot, one
  // Boost slot, every other storefront on the free Starter tier. This mirrors a
  // sales-led launch: ~34% of onboarded merchants pay, the rest are seeded free.
  const assigned = new Map<string, number>();

  rows.forEach((row, index) => {
    const { brand, corridor } = row;
    const category = CATEGORIES.find((c) => c.id === brand.categoryId)!;
    const cor = CORRIDORS.find((c) => c.id === corridor)!;
    const key = `${corridor}:${brand.categoryId}`;
    const seat = assigned.get(key) ?? 0;
    assigned.set(key, seat + 1);
    const r = mulberry32(hashSeed(`${brand.name}-${corridor}-${index}`));

    let tier: Tier = "starter";
    let slotId: string | undefined;
    if (seat === 0) {
      tier = "billboard";
      slotId = `s-${corridor}-${category.id}-billboard-1`;
    } else if (seat === 1) {
      tier = "boost";
      slotId = `s-${corridor}-${category.id}-boost-1`;
    }

    const name = row.branch === 1 ? brand.name : `${brand.name} ${corridor === "osu" ? "Osu" : "East Legon"}`;
    const slug = `${slugify(name)}-${corridor}`;
    const gpsNumber = corridor === "osu" ? between(r, 500, 619) : between(r, 620, 779);
    const ghanapost = `GA-${String(gpsNumber).padStart(3, "0")}-${String(between(r, 1000, 9999))}`;
    const jitter = () => (r() - 0.5) * 0.011;
    const createdAt = new Date(
      Date.parse("2026-01-06T09:00:00.000Z") + index * 36e5 * 6,
    ).toISOString();

    const merchant: Merchant = {
      id: `m-${slug}`,
      slug,
      name,
      categoryId: brand.categoryId,
      corridorId: corridor,
      tier,
      status: "verified",
      tagline: brand.tagline,
      description: brand.blurb,
      ghanapost,
      gps: { lat: cor.center.lat + jitter(), lng: cor.center.lng + jitter() },
      landmark: pick(r, LANDMARKS[corridor]),
      phone: `0${pick(r, ["20", "24", "26", "27", "55", "59"])} ${between(r, 200, 999)} ${String(
        between(r, 1000, 9999),
      )}`,
      whatsapp: `0${pick(r, ["20", "24", "55"])} ${between(r, 200, 999)} ${between(r, 1000, 9999)}`,
      email: `hello@${slugify(name).slice(0, 18)}.gh`,
      hours: pick(r, HOURS),
      priceBand: brand.priceBand,
      rating: Math.round((3.9 + r() * 1.0) * 10) / 10,
      reviewCount: between(r, 18, 420),
      photos: rotate(PHOTO_SETS[brand.categoryId], index + (brand.branches ?? 1)),
      panoramaUrl: brand.panorama ?? "",
      amenities: brand.amenities,
      verifiedAt: new Date(Date.parse(createdAt) + 86_400_000 * 3).toISOString(),
      founding: Boolean(brand.founding) && row.branch === 1,
      slotId,
      ownerUserId: brand.name === "Kente & Koffee" && corridor === "osu" ? "u-kofi" : `u-${slug}`,
      createdAt,
    };
    merchants.push(merchant);

    if (tier !== "starter") {
      const amount = tier === "billboard" ? 249 : 99;
      const startedAt = new Date(Date.parse(createdAt) + 86_400_000 * 5);
      const periodEnd = new Date(now.getTime() + 86_400_000 * between(r, 4, 27));
      subs.push({
        id: `sub-${slug}`,
        merchantId: merchant.id,
        tier,
        status: r() > 0.94 ? "past_due" : "active",
        amountCedis: amount,
        startedAt: startedAt.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        channel: pick(r, ["mtn-momo", "telecel-cash", "at-money", "card"]),
      });
      for (let m = 5; m >= 0; m--) {
        const issued = new Date(now.getTime() - (m * 30 + 5) * 86_400_000);
        invoices.push({
          id: `inv-${slug}-${m}`,
          merchantId: merchant.id,
          subscriptionId: `sub-${slug}`,
          amountCedis: amount,
          status: m === 0 && r() > 0.82 ? "pending" : "paid",
          issuedAt: issued.toISOString(),
          paidAt:
            m === 0 && r() > 0.82
              ? undefined
              : new Date(issued.getTime() + 6e5 * 90).toISOString(),
          reference: `SEEN-${slug.slice(0, 4).toUpperCase()}${m}${between(r, 100, 999)}`,
          channel: pick(r, ["mtn-momo", "telecel-cash", "at-money"]),
          description: `${tier === "billboard" ? "Billboard" : "Boost"} subscription — ${issued.toLocaleDateString(
            "en-GB",
            { month: "long", year: "numeric" },
          )}`,
        });
      }
    }
  });

  // Guarantee the demo hero merchant is a Billboard with a 360° tour.
  const hero = merchants.find((m) => m.id === "m-kente-and-koffee-osu")!;
  hero.tier = "billboard";
  hero.slotId = "s-osu-food-billboard-1";
  hero.panoramaUrl = "/panoramas/cafe-1.png";
  hero.founding = true;

  // A small verification queue for the ops console: the last three onboarded
  // storefronts are still pending Seen field verification.
  merchants.slice(-3).forEach((pending, index) => {
    pending.status = "pending";
    pending.tier = "starter";
    pending.slotId = undefined;
    // Fresh submissions: the ops queue is a working list, not an archive.
    pending.createdAt = new Date(now.getTime() - (index + 1) * 43_200_000 - 3_600_000).toISOString();
  });

  const slots = buildSlots(merchants);

  const db: SeenDb = {
    version: 3,
    generatedAt: now.toISOString(),
    corridors: CORRIDORS,
    categories: CATEGORIES,
    plans: PLANS,
    merchants,
    slots,
    subscriptions: subs,
    invoices,
    users: DEMO_USERS,
    miniApps: MINI_APPS,
    consents: [
      {
        id: "consent-ama-quickbook",
        userId: "u-ama",
        miniAppId: "quickbook",
        scopes: ["identity", "phone", "address", "booking"],
        grantedAt: "2026-10-02T09:14:00.000Z",
      },
      {
        id: "consent-ama-accra-live",
        userId: "u-ama",
        miniAppId: "accra-live",
        scopes: ["identity", "phone", "payments"],
        grantedAt: "2026-10-19T18:02:00.000Z",
      },
    ],
    bookings: [
      {
        id: "bk-1",
        miniAppId: "quickbook",
        userId: "u-ama",
        merchantId: merchants.find((m) => m.name.startsWith("Osu Barber Lab"))!.id,
        service: "Skin fade + beard",
        priceCedis: 120,
        startsAt: new Date(now.getTime() + 86_400_000 * 2 + 3 * 36e5).toISOString(),
        status: "confirmed",
        reference: "QB-4471A",
        createdAt: new Date(now.getTime() - 86_400_000 * 3).toISOString(),
      },
      {
        id: "bk-2",
        miniAppId: "quickbook",
        userId: "u-ama",
        merchantId: merchants.find((m) => m.name.startsWith("Bella's"))!.id,
        service: "Gel manicure",
        priceCedis: 180,
        startsAt: new Date(now.getTime() + 86_400_000 * 6 + 5 * 36e5).toISOString(),
        status: "confirmed",
        reference: "QB-4488C",
        createdAt: new Date(now.getTime() - 86_400_000 * 1).toISOString(),
      },
    ],
    ticketOrders: [
      {
        id: "tk-1",
        miniAppId: "accra-live",
        userId: "u-ama",
        eventName: "Highlife Nights — Labadi",
        quantity: 2,
        totalCedis: 300,
        status: "paid",
        reference: "AL-90211",
        createdAt: new Date(now.getTime() - 86_400_000 * 9).toISOString(),
      },
    ],
    liveEvents: [],
    demoMerchantSlug: hero.slug,
  };

  const analytics = buildAnalytics(merchants, now);
  return { db, analytics };
}

/* ------------------------------------------------------------- analytics */
function buildAnalytics(merchants: Merchant[], now: Date): DailyMetric[] {
  const rows: DailyMetric[] = [];
  const days = 90;
  for (const merchant of merchants) {
    const r = mulberry32(hashSeed(merchant.id));
    // Base daily impressions by tier — matches the business plan's illustrative
    // M18 figures: Billboard ~9.4k/mo, Boost ~2.6k/mo, Starter ~120/mo.
    const base =
      merchant.tier === "billboard" ? 300 : merchant.tier === "boost" ? 85 : 4;
    let trend = 0.82 + (hashSeed(merchant.slug) % 40) / 100; // 0.82–1.22 launch variance
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 86_400_000);
      const day = date.toISOString().slice(0, 10);
      const dow = date.getUTCDay();
      const weekend = dow === 0 || dow === 6 ? 1.18 : 1;
      // Gentle growth through the sample window.
      trend *= 1.0035;
      const noise = 0.82 + r() * 0.36;
      const impressions = Math.max(0, Math.round(base * weekend * trend * noise));
      const viewRate =
        merchant.tier === "billboard" ? 0.125 : merchant.tier === "boost" ? 0.112 : 0.3;
      const views = Math.round(impressions * viewRate * (0.9 + r() * 0.2));
      const mapClicks = Math.round(views * 0.11 * (0.85 + r() * 0.3));
      const phoneClicks = Math.round(views * 0.07 * (0.85 + r() * 0.3));
      const directionRequests = Math.round(views * 0.1 * (0.85 + r() * 0.3));
      const qrRedemptions = Math.round(views * 0.035 * (0.8 + r() * 0.4));
      const uniques = Math.round(
        impressions * 0.42 * (0.9 + r() * 0.2),
      );
      rows.push({
        merchantId: merchant.id,
        day,
        impressions,
        views,
        mapClicks,
        phoneClicks,
        directionRequests,
        qrRedemptions,
        uniques,
        sources: {
          feed: Math.round(impressions * 0.55),
          search: Math.round(impressions * 0.24),
          map: Math.round(impressions * 0.12),
          qr: Math.round(impressions * 0.05),
          direct: Math.round(impressions * 0.04),
        },
      });
    }
  }
  return rows;
}
