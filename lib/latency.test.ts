import { describe, expect, it } from "vitest";
import { estimateRttMs, greatCircleKm, resolveViewerOrigin } from "./latency";
import { REGIONS } from "./regions";

const NYC = { lat: 40.71, lon: -74.01 };
const LONDON = { lat: 51.51, lon: -0.13 };
const SYDNEY = { lat: -33.87, lon: 151.21 };
const TOKYO = { lat: 35.68, lon: 139.69 };

describe("greatCircleKm", () => {
  it("is zero for a point against itself", () => {
    expect(greatCircleKm(NYC, NYC)).toBe(0);
  });

  it("is symmetric", () => {
    expect(greatCircleKm(NYC, SYDNEY)).toBeCloseTo(greatCircleKm(SYDNEY, NYC), 6);
  });

  // Published great-circle distances, to the nearest 50 km. These are the
  // anchor for the whole latency figure — if the haversine drifts, every
  // number the panel shows drifts with it.
  it("matches known distances", () => {
    expect(greatCircleKm(NYC, LONDON)).toBeCloseTo(5570, -2);
    expect(greatCircleKm(TOKYO, SYDNEY)).toBeCloseTo(7820, -2);
  });

  it("handles the antimeridian without going the long way round", () => {
    // Two points either side of the date line are close together, not ~40,000
    // km apart — the classic failure mode for a naive longitude difference.
    const west = { lat: 0, lon: 179 };
    const east = { lat: 0, lon: -179 };
    expect(greatCircleKm(west, east)).toBeLessThan(300);
  });

  it("never exceeds half the Earth's circumference", () => {
    expect(greatCircleKm({ lat: 90, lon: 0 }, { lat: -90, lon: 0 })).toBeLessThan(20_100);
  });
});

describe("estimateRttMs", () => {
  it("is a few ms for a local hop rather than zero", () => {
    // Switching and queuing dominate at short range; a bare speed-of-light
    // figure would claim sub-millisecond round trips.
    expect(estimateRttMs(0)).toBeGreaterThanOrEqual(3);
    expect(estimateRttMs(0)).toBeLessThan(10);
  });

  it("rises with distance", () => {
    expect(estimateRttMs(1000)).toBeGreaterThan(estimateRttMs(100));
  });

  /**
   * Sanity-checks the model against measured internet latency rather than
   * against itself. Real transatlantic RTT sits around 70–80 ms and
   * trans-Pacific around 100–120 ms; the estimate should land in the same
   * neighbourhood without being tuned to any single pair.
   */
  it("lands in the right range for real long-haul routes", () => {
    const transatlantic = estimateRttMs(greatCircleKm(NYC, LONDON));
    expect(transatlantic).toBeGreaterThan(60);
    expect(transatlantic).toBeLessThan(110);

    const transpacific = estimateRttMs(greatCircleKm(TOKYO, { lat: 37.77, lon: -122.42 }));
    expect(transpacific).toBeGreaterThan(90);
    expect(transpacific).toBeLessThan(160);
  });

  it("never claims to beat light in fibre", () => {
    // 2/3 c is 200 km/ms, so a round trip cannot be quicker than 2·km/200.
    for (const km of [500, 5000, 15_000]) {
      expect(estimateRttMs(km)).toBeGreaterThanOrEqual((2 * km) / 200);
    }
  });
});

describe("resolveViewerOrigin", () => {
  it("returns null rather than guessing when the zone is unknown", () => {
    // A wrong origin makes every figure on the panel wrong, so the UI drops the
    // latency row instead. That only works if this returns null.
    expect(resolveViewerOrigin(undefined)).toBeNull();
    expect(resolveViewerOrigin("Mars/Olympus_Mons")).toBeNull();
  });

  it("resolves exact zones", () => {
    expect(resolveViewerOrigin("Asia/Tokyo")?.label).toBe("Japan");
    expect(resolveViewerOrigin("Europe/Berlin")?.label).toBe("Germany");
  });

  it("falls back to the continent for unlisted zones in a known area", () => {
    const origin = resolveViewerOrigin("Europe/Tallinn");
    expect(origin?.label).toBe("Europe");
  });

  it("gives every resolved origin plausible coordinates", () => {
    for (const zone of ["America/New_York", "Asia/Kolkata", "Australia/Perth", "Africa/Cairo"]) {
      const origin = resolveViewerOrigin(zone);
      expect(origin).not.toBeNull();
      expect(Math.abs(origin!.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(origin!.lon)).toBeLessThanOrEqual(180);
    }
  });
});

describe("region latency", () => {
  it("stays under a physical ceiling for every region pair", () => {
    // Half the Earth's circumference is the worst case, so nothing on the map
    // can legitimately show more than the RTT that implies.
    const ceiling = estimateRttMs(20_100);
    for (const a of REGIONS) {
      for (const b of REGIONS) {
        expect(estimateRttMs(greatCircleKm(a, b))).toBeLessThanOrEqual(ceiling);
      }
    }
  });

  it("puts nearby metros closer than distant ones", () => {
    const frankfurt = REGIONS.find((r) => r.id === "eu-central")!;
    const amsterdam = REGIONS.find((r) => r.id === "eu-nl")!;
    const sydney = REGIONS.find((r) => r.id === "ap-southeast-2")!;
    expect(greatCircleKm(frankfurt, amsterdam)).toBeLessThan(greatCircleKm(frankfurt, sydney));
  });
});
