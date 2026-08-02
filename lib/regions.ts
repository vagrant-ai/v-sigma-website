import { PROVIDERS } from "./data";
import { lerp, rand } from "./seed";

/**
 * Where GPU capacity physically sits, for the global view.
 *
 * These are real metros that real cloud regions cluster around, with real
 * coordinates — the geography is not invented, and neither are the provider
 * rosters. What *is* synthetic is the availability level, which comes from the
 * same deterministic sampler as the provider board.
 *
 * Nothing here is a quantity. No vendor publishes per-region GPU inventory, so
 * the view deals in what can be known: coordinates, who is present, and — via
 * `latency.ts` — the round-trip time those coordinates imply.
 */
export type Region = {
  id: string;
  /** Metro the capacity is nearest, as an operator would name it. */
  city: string;
  /** Continental grouping, used to summarise the map. */
  area: "Americas" | "Europe" | "Asia Pacific" | "Middle East";
  lat: number;
  lon: number;
  /** Providers with a presence here, by provider id. */
  providerIds: string[];
};

export const REGIONS: Region[] = [
  // Americas
  { id: "us-east", city: "N. Virginia", area: "Americas", lat: 38.95, lon: -77.45, providerIds: ["aws", "gcp", "azure", "coreweave", "lambda", "runpod"] },
  { id: "us-central", city: "Dallas", area: "Americas", lat: 32.78, lon: -96.8, providerIds: ["gcp", "coreweave", "runpod", "together"] },
  { id: "us-west", city: "Oregon", area: "Americas", lat: 45.84, lon: -119.7, providerIds: ["aws", "gcp", "azure", "modal"] },
  { id: "us-sv", city: "Santa Clara", area: "Americas", lat: 37.35, lon: -121.96, providerIds: ["lambda", "together", "modal", "nebius"] },
  { id: "ca-central", city: "Montréal", area: "Americas", lat: 45.5, lon: -73.57, providerIds: ["azure", "runpod"] },
  { id: "sa-east", city: "São Paulo", area: "Americas", lat: -23.55, lon: -46.63, providerIds: ["aws", "azure"] },

  // Europe
  { id: "eu-west", city: "Dublin", area: "Europe", lat: 53.35, lon: -6.26, providerIds: ["aws", "azure", "coreweave"] },
  { id: "eu-central", city: "Frankfurt", area: "Europe", lat: 50.11, lon: 8.68, providerIds: ["aws", "gcp", "azure", "nebius", "runpod"] },
  { id: "eu-north", city: "Stockholm", area: "Europe", lat: 59.33, lon: 18.07, providerIds: ["gcp", "nebius"] },
  { id: "eu-nl", city: "Amsterdam", area: "Europe", lat: 52.37, lon: 4.9, providerIds: ["nebius", "coreweave", "runpod"] },
  { id: "uk-south", city: "London", area: "Europe", lat: 51.51, lon: -0.13, providerIds: ["aws", "gcp", "azure", "coreweave"] },

  // Middle East
  { id: "me-central", city: "Dubai", area: "Middle East", lat: 25.2, lon: 55.27, providerIds: ["azure", "gcp"] },

  // Asia Pacific
  { id: "ap-northeast", city: "Tokyo", area: "Asia Pacific", lat: 35.68, lon: 139.69, providerIds: ["aws", "gcp", "azure", "together"] },
  { id: "ap-southeast", city: "Singapore", area: "Asia Pacific", lat: 1.35, lon: 103.82, providerIds: ["aws", "gcp", "azure", "runpod"] },
  { id: "ap-south", city: "Mumbai", area: "Asia Pacific", lat: 19.08, lon: 72.88, providerIds: ["aws", "azure", "runpod"] },
  { id: "ap-korea", city: "Seoul", area: "Asia Pacific", lat: 37.57, lon: 126.98, providerIds: ["gcp", "azure"] },
  { id: "ap-southeast-2", city: "Sydney", area: "Asia Pacific", lat: -33.87, lon: 151.21, providerIds: ["aws", "gcp", "azure"] },
];

const PROVIDER_IDS = new Set(PROVIDERS.map((p) => p.id));

/** Region rows carry provider ids; this keeps them honest against the catalog. */
export function unknownProviderIds(): string[] {
  return [...new Set(REGIONS.flatMap((r) => r.providerIds))].filter((id) => !PROVIDER_IDS.has(id));
}

export type RegionPresence = {
  region: Region;
  /**
   * How readily this GPU can be scheduled here, 0–1 — same scale as the board.
   *
   * A level and not a quantity, for the reason `Availability` gives in
   * `data.ts`: nobody publishes node counts, so a level is the most this can
   * honestly be. Note that even the level is sampled; only the geography and
   * the provider rosters below are real.
   */
  level: number;
  /** Providers offering this GPU in this region. Real, from `REGIONS`. */
  providerIds: string[];
};

/**
 * Which regions offer one GPU, and how readily.
 *
 * Ordered by provider count — an actual property of the data rather than a
 * sampled one — so the ordering means something even though the levels don't.
 *
 * There used to be a `share` and a `rank` here, sized from a seeded draw and
 * shown as "#1 of 17" and "40% of supply". Both are gone: no provider publishes
 * per-region inventory, so the numbers were invented, and casting an invention
 * as a rank or a percentage only launders it — a reader has no way to tell that
 * "#1 of 17" came from a random number generator. What's left is what the data
 * supports: where capacity is, who offers it, and how easily it schedules.
 */
export function sampleDistribution(gpuId: string): RegionPresence[] {
  return REGIONS.map((region) => ({
    region,
    level: Math.round(lerp(0.08, 1, rand(`level:${gpuId}:${region.id}`)) * 1000) / 1000,
    providerIds: region.providerIds,
  })).sort(
    (a, b) =>
      b.providerIds.length - a.providerIds.length || a.region.city.localeCompare(b.region.city),
  );
}

/**
 * Per-continent roll-up: how many sites, how many distinct providers, how
 * available. Ordered by site count.
 *
 * Counts, not proportions of supply — the number of sites and providers is
 * something the region list actually knows, where a "share of supply" was a
 * percentage of a fabricated total.
 */
export function summariseByArea(rows: RegionPresence[]) {
  const areas = new Map<Region["area"], RegionPresence[]>();
  for (const row of rows) {
    const list = areas.get(row.region.area);
    if (list) list.push(row);
    else areas.set(row.region.area, [row]);
  }

  return [...areas.entries()]
    .map(([area, list]) => ({
      area,
      regions: list.length,
      providers: new Set(list.flatMap((r) => r.providerIds)).size,
      level: list.reduce((sum, r) => sum + r.level, 0) / list.length,
      /**
       * Each site's own level, worst first, for the sidebar's unit plot.
       *
       * The mean above flattens the thing worth seeing: an area with one dry
       * metro and four healthy ones averages to "fine", and a reader picking a
       * region cares that the dry one exists. Sorted so the worst dot leads.
       */
      levels: list.map((r) => r.level).sort((a, b) => a - b),
    }))
    .sort((a, b) => b.regions - a.regions || b.providers - a.providers);
}
