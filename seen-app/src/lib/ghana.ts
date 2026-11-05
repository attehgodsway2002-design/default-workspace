/**
 * Ghana-specific helpers: GhanaPostGPS digital addresses, corridor geofencing,
 * distances, and hand-off links to Google Maps (Seen never competes on
 * navigation — every direction request opens Google Maps).
 */

const GPS_RE = /^([A-Z]{2})-(\d{3})-(\d{4})$/;

/** Validates a digital address such as GA-585-7449. */
export function isValidGhanaPost(code: string): boolean {
  return GPS_RE.test(code.trim().toUpperCase());
}

export function normaliseGhanaPost(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/** GA = Greater Accra, AS = Ashanti, etc. Prefix determines the region. */
export const REGION_BY_PREFIX: Record<string, string> = {
  GA: "Greater Accra",
  AS: "Ashanti",
  CR: "Central",
  ER: "Eastern",
  WR: "Western",
  VR: "Volta",
  NR: "Northern",
  UE: "Upper East",
  UW: "Upper West",
  BA: "Bono",
  AH: "Ahafo",
  BE: "Bono East",
  BO: "Bono",
  NE: "North East",
  OT: "Oti",
  SV: "Savannah",
  TV: "Tivai",
  WP: "Western North",
};

export function regionOf(code: string): string | null {
  const m = GPS_RE.exec(code.trim().toUpperCase());
  if (!m) return null;
  return REGION_BY_PREFIX[m[1]!] ?? null;
}

/** Distance in metres between two points (haversine). */
export function distanceMetres(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function walkingMinutes(metres: number): number {
  return Math.max(1, Math.round(metres / 78)); // ~4.7 km/h through Accra traffic
}

export function distanceLabel(metres: number): string {
  if (metres < 950) return `${Math.round(metres / 10) * 10} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Deep link that hands navigation to Google Maps. */
export function googleMapsDirections(
  destination: { lat: number; lng: number },
  label?: string,
): string {
  const dest = `${destination.lat},${destination.lng}`;
  const query = label ? encodeURIComponent(label) : dest;
  return `https://www.google.com/maps/dir/?api=1&destination=${dest}&destination_place_id=&travelmode=walking&q=${query}`;
}

export function mapboxStaticLink(token: string, point: { lat: number; lng: number }) {
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+0B2E4A(${point.lng},${point.lat})/${point.lng},${point.lat},15,0/640x360?access_token=${token}`;
}

/** Normalises a Ghanaian number to E.164 for tel: links. */
export function ghanaPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+233")) return digits;
  if (digits.startsWith("0")) return `+233${digits.slice(1)}`;
  if (digits.startsWith("233")) return `+${digits}`;
  return `+233${digits}`;
}

export function prettyPhone(raw: string): string {
  const e164 = ghanaPhone(raw);
  const rest = e164.replace("+233", "");
  if (rest.length < 9) return raw;
  return `+233 ${rest.slice(0, 2)} ${rest.slice(2, 5)} ${rest.slice(5, 9)}`;
}

/** Osu and East Legon share the GA region prefix; used in onboarding checks. */
export function corridorFromGhanaPost(code: string): "osu" | "east-legon" | null {
  if (!isValidGhanaPost(code)) return null;
  const numeric = Number(code.split("-")[2]);
  if (!Number.isFinite(numeric)) return null;
  // GA-5xx sits inside the Osu / Oxford Street enumeration block in our corridor census.
  if (numeric >= 500 && numeric < 620) return "osu";
  if (numeric >= 620 && numeric < 780) return "east-legon";
  return null;
}
