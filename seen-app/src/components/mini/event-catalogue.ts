/**
 * Accra Live's demo listings. All events are fictional, the venues are real
 * Accra rooms, and dates are projected forward from the request time so the
 * store never shows a past event.
 */
export interface LiveEvent {
  id: string;
  name: string;
  venue: string;
  area: string;
  blurb: string;
  startsAt: string;
  priceCedis: number;
  capacity: number;
  remaining: number;
}

const DAY_MS = 86_400_000;

function at(nowIso: string, days: number, hourUtc: number): string {
  const date = new Date(Date.parse(nowIso) + days * DAY_MS);
  date.setUTCHours(hourUtc, 0, 0, 0);
  return date.toISOString();
}

export function liveEvents(nowIso: string): LiveEvent[] {
  return [
    {
      id: "highlife-labadi",
      name: "Highlife Nights — Labadi",
      venue: "Labadi Beach Hotel",
      area: "La",
      blurb: "A live highlife band, a beach terrace and the last good excuse for a Thursday.",
      startsAt: at(nowIso, 12, 19),
      priceCedis: 150,
      capacity: 800,
      remaining: 164,
    },
    {
      id: "jazz-233",
      name: "Jazz at +233",
      venue: "+233 Jazz Bar & Grill",
      area: "Osu",
      blurb: "Two sets, one horn section, and table service that actually finds you.",
      startsAt: at(nowIso, 5, 20),
      priceCedis: 200,
      capacity: 220,
      remaining: 38,
    },
    {
      id: "afrobeat-block-party",
      name: "Afrobeat Block Party",
      venue: "Alliance Française",
      area: "Airport Residential",
      blurb: "Five DJs, one courtyard, food stalls from the Osu night market.",
      startsAt: at(nowIso, 19, 18),
      priceCedis: 120,
      capacity: 1200,
      remaining: 540,
    },
    {
      id: "founders-table",
      name: "Founders' Table Accra",
      venue: "Akwaaba Cowork",
      area: "Osu",
      blurb: "Twenty founders, four operators and a no-pitch dinner. Seats are deliberately limited.",
      startsAt: at(nowIso, 26, 18),
      priceCedis: 90,
      capacity: 150,
      remaining: 96,
    },
  ];
}
