/**
 * Distance-derived latency estimates.
 *
 * Unlike capacity, this is something the page can honestly put a number on:
 * light in fibre has a known speed and the region coordinates are real, so a
 * round-trip time follows from geometry rather than from a random draw. It's
 * still an estimate — actual paths detour around oceans and politics — so it's
 * always labelled as one and always rounded coarsely.
 */

/** Mean Earth radius, km. */
const EARTH_RADIUS_KM = 6371;

/** Great-circle distance between two points, in km (haversine). */
export function greatCircleKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLon = (b.lon - a.lon) * toRad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Round-trip time for a great-circle distance, in ms.
 *
 * Three terms, each with a reason:
 *  - light in single-mode fibre travels at about 2/3 c, so 200 km/ms;
 *  - real cable runs are roughly 1.4× the great circle, because they follow
 *    coastlines and existing rights of way rather than the shortest arc;
 *  - a few ms of switching and queuing at the ends, which dominates for short
 *    hops and is why nothing on this page ever reads as 1 ms.
 *
 * Sanity check against published figures: New York–London great-circles at
 * 5,570 km, giving ~83 ms here against a measured ~76 ms. Close enough for a
 * figure presented as an estimate, and deliberately not closer — tuning it to
 * match a specific pair would be false precision.
 */
export function estimateRttMs(km: number): number {
  const FIBRE_KM_PER_MS = 200;
  const PATH_FACTOR = 1.4;
  const SWITCHING_MS = 5;
  return Math.round((2 * PATH_FACTOR * km) / FIBRE_KM_PER_MS + SWITCHING_MS);
}

/** A guess at where the reader is, and how it was arrived at. */
export type ViewerOrigin = {
  /** Human-readable, so the reader can see the guess and discount it. */
  label: string;
  lat: number;
  lon: number;
};

/**
 * Representative coordinates for common IANA time zones.
 *
 * A time zone is a coarse proxy for location, but it's the only signal
 * available without asking for permission or calling out to a geo service, and
 * for a latency figure quoted to the nearest 10 ms it's good enough. The label
 * is shown in the UI precisely so a reader in the wrong place can tell.
 */
const ZONE_ORIGINS: Record<string, ViewerOrigin> = {
  "America/Los_Angeles": { label: "US West", lat: 37.77, lon: -122.42 },
  "America/Vancouver": { label: "US West", lat: 49.28, lon: -123.12 },
  "America/Denver": { label: "US Mountain", lat: 39.74, lon: -104.99 },
  "America/Phoenix": { label: "US Mountain", lat: 33.45, lon: -112.07 },
  "America/Chicago": { label: "US Central", lat: 41.88, lon: -87.63 },
  "America/Mexico_City": { label: "Mexico", lat: 19.43, lon: -99.13 },
  "America/New_York": { label: "US East", lat: 40.71, lon: -74.01 },
  "America/Toronto": { label: "Eastern Canada", lat: 43.65, lon: -79.38 },
  "America/Sao_Paulo": { label: "Brazil", lat: -23.55, lon: -46.63 },
  "Europe/London": { label: "UK", lat: 51.51, lon: -0.13 },
  "Europe/Dublin": { label: "Ireland", lat: 53.35, lon: -6.26 },
  "Europe/Paris": { label: "France", lat: 48.86, lon: 2.35 },
  "Europe/Madrid": { label: "Spain", lat: 40.42, lon: -3.7 },
  "Europe/Berlin": { label: "Germany", lat: 52.52, lon: 13.4 },
  "Europe/Amsterdam": { label: "Netherlands", lat: 52.37, lon: 4.9 },
  "Europe/Zurich": { label: "Switzerland", lat: 47.38, lon: 8.54 },
  "Europe/Stockholm": { label: "Sweden", lat: 59.33, lon: 18.07 },
  "Europe/Warsaw": { label: "Poland", lat: 52.23, lon: 21.01 },
  "Europe/Moscow": { label: "Western Russia", lat: 55.76, lon: 37.62 },
  "Asia/Jerusalem": { label: "Israel", lat: 31.77, lon: 35.21 },
  "Asia/Dubai": { label: "UAE", lat: 25.2, lon: 55.27 },
  "Asia/Karachi": { label: "Pakistan", lat: 24.86, lon: 67.01 },
  "Asia/Kolkata": { label: "India", lat: 19.08, lon: 72.88 },
  "Asia/Calcutta": { label: "India", lat: 19.08, lon: 72.88 },
  "Asia/Bangkok": { label: "Thailand", lat: 13.76, lon: 100.5 },
  "Asia/Singapore": { label: "Singapore", lat: 1.35, lon: 103.82 },
  "Asia/Jakarta": { label: "Indonesia", lat: -6.21, lon: 106.85 },
  "Asia/Hong_Kong": { label: "Hong Kong", lat: 22.32, lon: 114.17 },
  "Asia/Shanghai": { label: "Eastern China", lat: 31.23, lon: 121.47 },
  "Asia/Taipei": { label: "Taiwan", lat: 25.03, lon: 121.57 },
  "Asia/Seoul": { label: "South Korea", lat: 37.57, lon: 126.98 },
  "Asia/Tokyo": { label: "Japan", lat: 35.68, lon: 139.69 },
  "Australia/Sydney": { label: "Eastern Australia", lat: -33.87, lon: 151.21 },
  "Australia/Melbourne": { label: "Eastern Australia", lat: -37.81, lon: 144.96 },
  "Australia/Perth": { label: "Western Australia", lat: -31.95, lon: 115.86 },
  "Pacific/Auckland": { label: "New Zealand", lat: -36.85, lon: 174.76 },
  "Africa/Johannesburg": { label: "South Africa", lat: -26.2, lon: 28.05 },
  "Africa/Lagos": { label: "West Africa", lat: 6.52, lon: 3.38 },
  "Africa/Cairo": { label: "Egypt", lat: 30.04, lon: 31.24 },
};

/** Coarser fallback, by IANA area, for zones not listed above. */
const AREA_ORIGINS: Record<string, ViewerOrigin> = {
  America: { label: "the Americas", lat: 40.71, lon: -74.01 },
  Europe: { label: "Europe", lat: 50.11, lon: 8.68 },
  Asia: { label: "Asia", lat: 1.35, lon: 103.82 },
  Australia: { label: "Australia", lat: -33.87, lon: 151.21 },
  Pacific: { label: "the Pacific", lat: -36.85, lon: 174.76 },
  Africa: { label: "Africa", lat: 6.52, lon: 3.38 },
  Atlantic: { label: "Europe", lat: 50.11, lon: 8.68 },
  Indian: { label: "Asia", lat: 1.35, lon: 103.82 },
};

/**
 * Best guess at the reader's location from an IANA time zone name, or null when
 * the zone isn't recognised — a wrong origin would make every figure on the
 * panel wrong, so no guess is better than a bad one.
 */
export function resolveViewerOrigin(timeZone: string | undefined): ViewerOrigin | null {
  if (!timeZone) return null;
  const exact = ZONE_ORIGINS[timeZone];
  if (exact) return exact;
  const area = timeZone.split("/")[0];
  return AREA_ORIGINS[area] ?? null;
}

/**
 * The reader's time zone, as the browser reports it. Undefined on the server,
 * where there is no reader to ask.
 */
export function browserTimeZone(): string | undefined {
  if (typeof Intl === "undefined") return undefined;
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
