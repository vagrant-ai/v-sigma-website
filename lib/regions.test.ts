import { describe, expect, it } from "vitest";
import { GPUS, PROVIDERS } from "./data";
import {
  REGIONS,
  sampleDistribution,
  summariseByArea,
  unknownProviderIds,
} from "./regions";
import { MAP_BOUNDS, MAP_SIZE, project } from "./world-map";
import { BORDER_PATH, LAND_PATH } from "./world-map-data";

describe("REGIONS", () => {
  it("only references providers that exist in the catalog", () => {
    expect(unknownProviderIds()).toEqual([]);
  });

  it("has unique ids", () => {
    expect(new Set(REGIONS.map((r) => r.id)).size).toBe(REGIONS.length);
  });

  it("has plausible coordinates", () => {
    for (const region of REGIONS) {
      expect(Math.abs(region.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(region.lon)).toBeLessThanOrEqual(180);
    }
  });

  it("keeps every region inside the drawn map's bounds", () => {
    // A region outside these bounds would be clipped off the frame entirely.
    for (const region of REGIONS) {
      expect(region.lat).toBeGreaterThan(MAP_BOUNDS.latMin);
      expect(region.lat).toBeLessThan(MAP_BOUNDS.latMax);
    }
  });

  it("gives every region at least one provider", () => {
    for (const region of REGIONS) {
      expect(region.providerIds.length).toBeGreaterThan(0);
    }
  });

  it("lists no provider twice in one region", () => {
    for (const region of REGIONS) {
      expect(new Set(region.providerIds).size).toBe(region.providerIds.length);
    }
  });
});

describe("sampleDistribution", () => {
  it("returns one row per region", () => {
    expect(sampleDistribution("h100")).toHaveLength(REGIONS.length);
  });

  it("is deterministic for the same gpu", () => {
    expect(sampleDistribution("h100")).toEqual(sampleDistribution("h100"));
  });

  it("differs between GPUs", () => {
    expect(sampleDistribution("h100")).not.toEqual(sampleDistribution("gb200"));
  });

  it("sorts by provider count, descending", () => {
    const counts = sampleDistribution("h100").map((r) => r.providerIds.length);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
  });

  it("keeps levels within 0..1 for every GPU", () => {
    for (const gpu of GPUS) {
      for (const row of sampleDistribution(gpu.id)) {
        expect(row.level).toBeGreaterThanOrEqual(0);
        expect(row.level).toBeLessThanOrEqual(1);
      }
    }
  });

  /**
   * The point of the rewrite: capacity used to surface as a sampled `share` and
   * `rank`, shown in the UI as "#1 of 17" and "40% of supply". Nobody publishes
   * per-region inventory, so those were invented numbers wearing the clothes of
   * a measurement. This fails if either ever comes back.
   */
  it("exposes no quantity of capacity", () => {
    for (const row of sampleDistribution("h100")) {
      expect(row).not.toHaveProperty("share");
      expect(row).not.toHaveProperty("rank");
      expect(row).not.toHaveProperty("gpus");
    }
  });
});

describe("summariseByArea", () => {
  it("covers every region exactly once", () => {
    const rows = sampleDistribution("h100");
    const counted = summariseByArea(rows).reduce((sum, a) => sum + a.regions, 0);
    expect(counted).toBe(rows.length);
  });

  it("reports a mean level inside its area's range", () => {
    const rows = sampleDistribution("h100");
    for (const area of summariseByArea(rows)) {
      const levels = rows.filter((r) => r.region.area === area.area).map((r) => r.level);
      expect(area.level).toBeGreaterThanOrEqual(Math.min(...levels));
      expect(area.level).toBeLessThanOrEqual(Math.max(...levels));
    }
  });

  it("counts each area's distinct providers", () => {
    const rows = sampleDistribution("h100");
    for (const area of summariseByArea(rows)) {
      const ids = new Set(
        rows.filter((r) => r.region.area === area.area).flatMap((r) => r.providerIds),
      );
      expect(area.providers).toBe(ids.size);
      // Distinct, so never more than the catalog holds — a plain sum over sites
      // would double-count the providers present in several metros.
      expect(area.providers).toBeLessThanOrEqual(PROVIDERS.length);
    }
  });

  it("reports no share of supply", () => {
    for (const area of summariseByArea(sampleDistribution("h100"))) {
      expect(area).not.toHaveProperty("share");
    }
  });
});

describe("project", () => {
  it("puts the antimeridian and prime meridian at the frame's edge and centre", () => {
    expect(project(-180, 0).x).toBeCloseTo(0);
    expect(project(180, 0).x).toBeCloseTo(MAP_SIZE.width);
    expect(project(0, 0).x).toBeCloseTo(MAP_SIZE.width / 2);
  });

  it("puts north at the top", () => {
    expect(project(0, 60).y).toBeLessThan(project(0, -30).y);
  });

  it("maps the bounds onto the full frame height", () => {
    expect(project(0, MAP_BOUNDS.latMax).y).toBeCloseTo(0);
    expect(project(0, MAP_BOUNDS.latMin).y).toBeCloseTo(MAP_SIZE.height);
  });

  it("scales one degree to one unit on both axes", () => {
    // The generated coastline leans on this: the generator projects with
    // d3-geo at scale 180/π, which is one unit per degree, so the land only
    // lands on top of the markers while both scales here are exactly 1.
    expect(MAP_SIZE.width / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)).toBe(1);
    expect(MAP_SIZE.height / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)).toBe(1);
  });
});

describe("LAND_PATH", () => {
  // The coastline is generated and committed, and it's used as a clip path —
  // where a malformed or empty `d` fails silently by clipping everything away
  // rather than throwing. These guard a botched regeneration.
  it("is a non-empty path starting with a move", () => {
    expect(LAND_PATH.length).toBeGreaterThan(1000);
    expect(LAND_PATH.startsWith("M")).toBe(true);
  });

  it("contains only path commands the clip can use", () => {
    expect(LAND_PATH).not.toMatch(/[^MLZmlz0-9.,\s-]/);
  });

  /**
   * Catches the failure that matters: a generator whose projection or bounds
   * have drifted out of step with MAP_BOUNDS, which would slide the land off the
   * markers without any error. Checks that the path lands in the frame's
   * coordinate space, not that it fits inside the frame — it doesn't, and
   * shouldn't. The source spans the whole globe while the bounds crop to the
   * inhabited band, so Antarctica hangs below the bottom edge and the high
   * Arctic above the top; the viewBox clips both.
   *
   * Expectations are derived from MAP_BOUNDS rather than written as literals, so
   * retuning the crop doesn't require editing numbers in here to match.
   */
  it("is projected into the frame's coordinate space", () => {
    /** Extent of the source topology, in degrees. */
    const SOURCE = { north: 83.6, south: -90 };

    const xs: number[] = [];
    const ys: number[] = [];
    for (const [, x, y] of LAND_PATH.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)) {
      xs.push(Number(x));
      ys.push(Number(y));
    }

    expect(xs.length).toBeGreaterThan(500);
    // Land touches both meridional edges, so x should fill the frame exactly.
    expect(Math.min(...xs)).toBeCloseTo(0, 0);
    expect(Math.max(...xs)).toBeCloseTo(MAP_SIZE.width, 0);
    // One unit per degree, measured down from the top edge.
    expect(Math.min(...ys)).toBeCloseTo(MAP_BOUNDS.latMax - SOURCE.north, 0);
    expect(Math.max(...ys)).toBeCloseTo(MAP_BOUNDS.latMax - SOURCE.south, 0);
  });
});

describe("BORDER_PATH", () => {
  it("is a non-empty path starting with a move", () => {
    expect(BORDER_PATH.length).toBeGreaterThan(1000);
    expect(BORDER_PATH.startsWith("M")).toBe(true);
  });

  it("contains only line commands", () => {
    expect(BORDER_PATH).not.toMatch(/[^MLZmlz0-9.,\s-]/);
  });

  /**
   * An interior mesh: only edges between two different countries, which is what
   * makes this layer cheap enough to ship. If the filter were dropped the mesh
   * would include every coastline as well, duplicating LAND_PATH's outline and
   * several times the size — so a border path that has grown past the land it
   * subdivides is the signature of that bug.
   */
  it("stays smaller than the coastline it subdivides", () => {
    expect(BORDER_PATH.length).toBeLessThan(LAND_PATH.length);
  });

  it("shares the coastline's coordinate space", () => {
    // Both paths come off the same projection in the same run, so a drift
    // between them means the generator was edited inconsistently.
    const xs: number[] = [];
    for (const [, x] of BORDER_PATH.matchAll(/[ML](-?[\d.]+),(-?[\d.]+)/g)) xs.push(Number(x));
    expect(xs.length).toBeGreaterThan(500);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThanOrEqual(MAP_SIZE.width);
  });
});
