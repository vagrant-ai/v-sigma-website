import { describe, expect, it } from "vitest";
import { GPUS } from "./data";
import {
  REGIONS,
  sampleDistribution,
  summariseByArea,
  unknownProviderIds,
} from "./regions";
import { MAP_BOUNDS, MAP_SIZE, project } from "./world-map";

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

  it("sorts by share, descending", () => {
    const shares = sampleDistribution("h100").map((r) => r.share);
    expect(shares).toEqual([...shares].sort((a, b) => b - a));
  });

  it("normalises the largest region to a share of 1", () => {
    for (const gpu of GPUS) {
      expect(sampleDistribution(gpu.id)[0]?.share).toBe(1);
    }
  });

  it("keeps shares and levels within 0..1 for every GPU", () => {
    for (const gpu of GPUS) {
      for (const row of sampleDistribution(gpu.id)) {
        expect(row.share).toBeGreaterThan(0);
        expect(row.share).toBeLessThanOrEqual(1);
        expect(row.level).toBeGreaterThanOrEqual(0);
        expect(row.level).toBeLessThanOrEqual(1);
      }
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
    // The map component leans on this: landmass paths are authored in raw
    // lon/lat and placed with a group transform rather than a per-point
    // projection, which only works while both scales are exactly 1.
    expect(MAP_SIZE.width / (MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin)).toBe(1);
    expect(MAP_SIZE.height / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)).toBe(1);
  });
});
