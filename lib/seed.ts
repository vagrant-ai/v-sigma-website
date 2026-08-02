/**
 * Deterministic pseudo-randomness from a string key.
 *
 * Shared by every fake feed on the site so that all of them are stable in the
 * same way: the server and the client render the same first frame (no hydration
 * mismatch), and a GPU's numbers don't churn as you click around.
 */

function hash(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic float in [0, 1) from a string seed. */
export function rand(seed: string): number {
  let h = hash(seed);
  h ^= h << 13;
  h ^= h >>> 17;
  h ^= h << 5;
  return ((h >>> 0) % 100_000) / 100_000;
}

export function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}
