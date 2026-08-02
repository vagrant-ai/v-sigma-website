import { PROVIDERS } from "./data";
import { lerp, rand } from "./seed";

/**
 * Where GPU capacity physically sits, for the global view.
 *
 * These are real metros that real cloud regions cluster around, with real
 * coordinates — the geography is not invented. What *is* synthetic is which
 * providers and how much capacity each metro holds: no vendor publishes
 * per-region GPU inventory, so the figures below come from the same
 * deterministic sampler as the provider board. Treated as illustrative, not
 * quoted as fact anywhere in the UI.
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

export type RegionCapacity = {
  region: Region;
  /**
   * Relative amount of this GPU here, 0–1, normalised so the largest region on
   * the map is 1. Relative on purpose: absolute GPU counts are not something
   * providers publish, so a number would be a fabrication.
   */
  share: number;
  /** How readily it can be scheduled here, 0–1 — same scale as the board. */
  level: number;
  /** Providers offering this GPU in this region. */
  providerIds: string[];
};

/**
 * Distribution of one GPU across the regions, largest first.
 *
 * Weighted by how many providers are present and nudged by the GPU's scarcity,
 * so flagship parts concentrate in a few big metros while commodity parts
 * spread out — which is how GPU supply actually behaves.
 */
export function sampleDistribution(gpuId: string): RegionCapacity[] {
  const rows = REGIONS.map((region) => {
    const key = `${gpuId}:${region.id}`;
    const density = region.providerIds.length / 6;
    return {
      region,
      weight: density * lerp(0.35, 1, rand(`share:${key}`)),
      level: Math.round(lerp(0.08, 1, rand(`level:${key}`)) * 1000) / 1000,
      providerIds: region.providerIds,
    };
  });

  const peak = Math.max(...rows.map((r) => r.weight));
  return rows
    .map(({ weight, ...rest }) => ({
      ...rest,
      share: Math.round((weight / peak) * 1000) / 1000,
    }))
    .sort((a, b) => b.share - a.share);
}

/** Region count and mean availability per continent, for the map's summary. */
export function summariseByArea(rows: RegionCapacity[]) {
  const areas = new Map<Region["area"], RegionCapacity[]>();
  for (const row of rows) {
    const list = areas.get(row.region.area);
    if (list) list.push(row);
    else areas.set(row.region.area, [row]);
  }
  return [...areas.entries()].map(([area, list]) => ({
    area,
    regions: list.length,
    level: list.reduce((sum, r) => sum + r.level, 0) / list.length,
  }));
}
