import {
  GPUS,
  PROVIDERS,
  isSelfManaged,
  type Availability,
  type Gpu,
  type Provider,
  type ProviderKind,
} from "./data";
import { lerp, rand } from "./seed";

/**
 * Fake availability data, deterministic in (gpu, provider).
 *
 * Determinism matters so the server and client render the same first frame
 * (no hydration mismatch) and so a GPU's numbers don't churn as you click
 * around. When the real feed lands, replace `sampleAvailability` with the
 * fetch and keep the return shape.
 */

/** Price posture and API distance vary by provider kind. */
const KIND_PROFILE: Record<
  ProviderKind,
  { supply: number; priceFactor: number; responseMin: number; responseMax: number }
> = {
  // `supply` nudges how much of a given GPU a kind of provider tends to have
  // on hand — hyperscalers broadest.
  hyperscaler: { supply: 1, priceFactor: 1.25, responseMin: 18, responseMax: 55 },
  neocloud: { supply: 0.9, priceFactor: 0.85, responseMin: 24, responseMax: 80 },
  // Self-managed capacity is always reachable and has no rate to quote, so
  // these values go unused — see `sampleOne`.
  onprem: { supply: 1, priceFactor: 0, responseMin: 0, responseMax: 0 },
  kubernetes: { supply: 1, priceFactor: 0, responseMin: 0, responseMax: 0 },
  slurm: { supply: 1, priceFactor: 0, responseMin: 0, responseMax: 0 },
  other: { supply: 1, priceFactor: 0, responseMin: 0, responseMax: 0 },
};

function sampleOne(gpu: Gpu, provider: Provider): Availability {
  const kind = KIND_PROFILE[provider.kind];
  const key = `${gpu.id}:${provider.id}`;
  const self = isSelfManaged(provider);

  // Scarce accelerators are harder to schedule everywhere, but even a
  // plentiful GPU should read as plentiful on a good provider. Capacity you
  // own is always shown as available — v-sigma can't know your queue, and
  // guessing that your own cluster is full would be a fabrication.
  const level = self
    ? 1
    : Math.max(
        0,
        Math.min(1, lerp(0.12, 1, rand(`level:${key}`)) * (1 - gpu.scarcity * 0.62) * kind.supply),
      );

  // Your own infrastructure gets neither a rate nor a round-trip: there is no
  // third-party API to time and no price for v-sigma to quote.
  if (self) {
    return { providerId: provider.id, level: 1 };
  }

  const pricePerHour = gpu.basePrice * kind.priceFactor * lerp(0.88, 1.18, rand(`price:${key}`));

  return {
    providerId: provider.id,
    level: Math.round(level * 1000) / 1000,
    pricePerHour: Math.round(pricePerHour * 100) / 100,
    responseMs: Math.round(lerp(kind.responseMin, kind.responseMax, rand(`rt:${key}`))),
  };
}

/** Availability of one GPU across every provider, most available first. */
export function sampleAvailability(gpuId: string): Availability[] {
  const gpu = GPUS.find((g) => g.id === gpuId) ?? GPUS[0];
  return PROVIDERS.map((provider) => sampleOne(gpu, provider)).sort((a, b) => b.level - a.level);
}
