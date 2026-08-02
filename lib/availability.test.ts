import { describe, expect, it } from "vitest";
import { sampleAvailability } from "./availability";
import {
  DEFAULT_GPU,
  FEATURED_GPUS,
  GPUS,
  MARKET_KINDS,
  PROVIDERS,
  PROVIDER_KINDS,
  SELF_KINDS,
  availabilityStatus,
  groupStatus,
  isSelfManaged,
  searchGpus,
  type Availability,
} from "./data";

describe("sampleAvailability", () => {
  it("returns one row per provider", () => {
    expect(sampleAvailability("h100")).toHaveLength(PROVIDERS.length);
  });

  it("is deterministic for the same gpu", () => {
    expect(sampleAvailability("h100")).toEqual(sampleAvailability("h100"));
  });

  it("differs between GPUs", () => {
    expect(sampleAvailability("h100")).not.toEqual(sampleAvailability("a100-80"));
  });

  it("sorts by availability level, descending", () => {
    const levels = sampleAvailability("a100-80").map((r) => r.level);
    expect(levels).toEqual([...levels].sort((a, b) => b - a));
  });

  it("keeps every figure within sane bounds for all GPUs", () => {
    for (const gpu of GPUS) {
      for (const row of sampleAvailability(gpu.id)) {
        expect(row.level).toBeGreaterThanOrEqual(0);
        expect(row.level).toBeLessThanOrEqual(1);
        expect(["healthy", "tight", "scarce", "none"]).toContain(availabilityStatus(row));
      }
    }
  });

  it("quotes a rate for third-party capacity only", () => {
    for (const gpu of GPUS) {
      for (const row of sampleAvailability(gpu.id)) {
        const provider = PROVIDERS.find((p) => p.id === row.providerId)!;
        if (isSelfManaged(provider)) {
          expect(row.pricePerHour).toBeUndefined();
        } else {
          expect(row.pricePerHour).toBeGreaterThan(0);
        }
      }
    }
  });

  it("reports no absolute GPU counts", () => {
    for (const row of sampleAvailability("h100")) {
      expect(row).not.toHaveProperty("available");
      expect(row).not.toHaveProperty("capacity");
    }
  });

  it("times the API hop for third-party providers only", () => {
    for (const gpu of GPUS) {
      for (const row of sampleAvailability(gpu.id)) {
        const provider = PROVIDERS.find((p) => p.id === row.providerId)!;
        if (isSelfManaged(provider)) {
          expect(row.responseMs).toBeUndefined();
        } else {
          expect(row.responseMs).toBeGreaterThan(0);
        }
      }
    }
  });

  it("always reports your own infrastructure as available", () => {
    for (const gpu of GPUS) {
      const rows = sampleAvailability(gpu.id);
      const self = rows.filter((row) =>
        isSelfManaged(PROVIDERS.find((p) => p.id === row.providerId)!),
      );
      expect(self).toHaveLength(SELF_KINDS.length);
      for (const row of self) {
        expect(availabilityStatus(row)).toBe("healthy");
      }
    }
  });

  it("makes scarce accelerators harder to find than plentiful ones", () => {
    const avg = (id: string) => {
      const rows = sampleAvailability(id);
      return rows.reduce((sum, r) => sum + r.level, 0) / rows.length;
    };
    expect(avg("gb300")).toBeLessThan(avg("t4"));
  });

  it("falls back to the first GPU for an unknown id", () => {
    expect(sampleAvailability("nope")).toEqual(sampleAvailability(GPUS[0].id));
  });
});

describe("groupStatus", () => {
  const row = (level: number): Availability => ({ providerId: "x", level });

  it("reads an empty group as unavailable", () => {
    expect(groupStatus([])).toBe("none");
  });

  it("averages rather than taking the best member", () => {
    // One plentiful vendor among dry ones must not read as plentiful.
    expect(groupStatus([row(1), row(0.05), row(0.05), row(0.05)])).not.toBe("healthy");
    expect(groupStatus([row(0.8), row(0.7), row(0.9)])).toBe("healthy");
  });

  it("agrees with the single-row status when the group has one member", () => {
    for (const level of [0, 0.1, 0.3, 0.9]) {
      expect(groupStatus([row(level)])).toBe(availabilityStatus(row(level)));
    }
  });

  it("reads your own infrastructure as high for every GPU", () => {
    for (const gpu of GPUS) {
      const rows = sampleAvailability(gpu.id).filter((r) =>
        isSelfManaged(PROVIDERS.find((p) => p.id === r.providerId)!),
      );
      expect(groupStatus(rows)).toBe("healthy");
    }
  });

  it("gives each provider group a colourable status for every GPU", () => {
    for (const gpu of GPUS) {
      const rows = sampleAvailability(gpu.id);
      for (const kind of PROVIDER_KINDS) {
        const kindRows = rows.filter(
          (r) => PROVIDERS.find((p) => p.id === r.providerId)!.kind === kind.id,
        );
        expect(["healthy", "tight", "scarce", "none"]).toContain(groupStatus(kindRows));
      }
    }
  });
});

describe("GPUS catalog", () => {
  it("has unique ids", () => {
    expect(new Set(GPUS.map((g) => g.id)).size).toBe(GPUS.length);
  });

  it("keeps scarcity in [0, 1) so capacity stays positive", () => {
    for (const gpu of GPUS) {
      expect(gpu.scarcity).toBeGreaterThanOrEqual(0);
      expect(gpu.scarcity).toBeLessThan(1);
      expect(gpu.basePrice).toBeGreaterThan(0);
    }
  });
});

describe("PROVIDERS", () => {
  it("has unique ids", () => {
    expect(new Set(PROVIDERS.map((p) => p.id)).size).toBe(PROVIDERS.length);
  });

  it("has at least one provider for every declared kind", () => {
    for (const kind of PROVIDER_KINDS) {
      expect(PROVIDERS.some((p) => p.kind === kind.id)).toBe(true);
    }
  });

  it("declares a kind for every provider", () => {
    const declared = new Set(PROVIDER_KINDS.map((k) => k.id));
    for (const p of PROVIDERS) {
      expect(declared.has(p.kind)).toBe(true);
    }
  });

  it("splits kinds into market and self-managed branches", () => {
    expect(MARKET_KINDS.length).toBeGreaterThan(0);
    expect(SELF_KINDS.length).toBeGreaterThan(0);
    expect(MARKET_KINDS.length + SELF_KINDS.length).toBe(PROVIDER_KINDS.length);
  });

  it("gives every market kind a roster of named vendors", () => {
    for (const kind of MARKET_KINDS) {
      expect(PROVIDERS.filter((p) => p.kind === kind.id).length).toBeGreaterThan(1);
    }
  });

  it("gives every self-managed kind exactly one target", () => {
    for (const kind of SELF_KINDS) {
      expect(PROVIDERS.filter((p) => p.kind === kind.id)).toHaveLength(1);
    }
  });

  it("carries a real roster of neoclouds", () => {
    // The long list on the board — it earns the wide panel and the two-up grid.
    expect(PROVIDERS.filter((p) => p.kind === "neocloud").length).toBeGreaterThanOrEqual(5);
  });

  it("names no single region, since a GPU is served from many at once", () => {
    for (const p of PROVIDERS) {
      expect(p).not.toHaveProperty("region");
    }
  });

  it("gives self-managed capacity no regional reach, since it is yours", () => {
    const selfManaged = PROVIDERS.filter((p) => isSelfManaged(p));
    expect(selfManaged.length).toBeGreaterThan(0);
    for (const p of selfManaged) {
      expect(p.regions).toBeUndefined();
    }
  });

  it("gives every third-party provider a plausible regional reach", () => {
    const market = PROVIDERS.filter((p) => !isSelfManaged(p));
    expect(market.length).toBeGreaterThan(0);
    for (const p of market) {
      expect(p.regions).toBeGreaterThan(0);
      expect(Number.isInteger(p.regions)).toBe(true);
    }
  });
});

describe("FEATURED_GPUS", () => {
  it("is a short highlight list, not the whole catalog", () => {
    expect(FEATURED_GPUS.length).toBeGreaterThan(0);
    expect(FEATURED_GPUS.length).toBeLessThan(GPUS.length);
  });

  it("includes the default selection so a chip is always lit", () => {
    expect(FEATURED_GPUS.map((g) => g.id)).toContain(DEFAULT_GPU.id);
  });

  it("spans more than one vendor", () => {
    expect(new Set(FEATURED_GPUS.map((g) => g.vendor)).size).toBeGreaterThan(1);
  });
});

describe("searchGpus", () => {
  it("returns everything for an empty or blank query", () => {
    expect(searchGpus("")).toHaveLength(GPUS.length);
    expect(searchGpus("   ")).toHaveLength(GPUS.length);
  });

  it("matches on name, case-insensitively", () => {
    expect(searchGpus("h100").map((g) => g.id)).toContain("h100");
    expect(searchGpus("H100").map((g) => g.id)).toContain("h100");
  });

  it("matches on vendor", () => {
    const amd = searchGpus("amd");
    expect(amd.length).toBeGreaterThan(0);
    expect(amd.every((g) => g.vendor === "AMD")).toBe(true);
  });

  it("matches on architecture aliases", () => {
    expect(searchGpus("blackwell").map((g) => g.id)).toContain("gb200");
    expect(searchGpus("hopper").map((g) => g.id)).toContain("h100");
  });

  it("matches on memory size", () => {
    expect(searchGpus("80 GB").every((g) => g.memory === "80 GB")).toBe(true);
  });

  it("requires all terms to match", () => {
    const hits = searchGpus("nvidia blackwell");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((g) => g.vendor === "NVIDIA")).toBe(true);
    expect(searchGpus("amd hopper")).toHaveLength(0);
  });

  it("returns nothing for gibberish", () => {
    expect(searchGpus("zzzznope")).toHaveLength(0);
  });
});
