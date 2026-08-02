import { describe, expect, it } from "vitest";
import { BRAND_MARKS, brandMark, type BrandMark } from "@/lib/brand-marks";
import { PROVIDERS, SELF_KINDS, isSelfManaged } from "@/lib/data";
import { iconSourceFor, monogramFor } from "./provider-icon";

/** Just the `d` attributes, flattening the two-tone path form. */
function geometry(mark: BrandMark): string[] {
  return mark.paths.map((p) => (typeof p === "string" ? p : p.d));
}

/** Colours set on individual paths by two-tone marks. */
function perPathColors(mark: BrandMark): string[] {
  return mark.paths.flatMap((p) => (typeof p === "string" ? [] : [p.color]));
}

/** WCAG relative-luminance contrast of a hex colour against white. */
function contrastOnWhite(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return 1.05 / (luminance + 0.05);
}

describe("brand marks", () => {
  it("maps every mark to a provider that exists", () => {
    for (const id of Object.keys(BRAND_MARKS)) {
      expect(PROVIDERS.some((p) => p.id === id)).toBe(true);
    }
  });

  it("gives the vendors we recognise their real logo", () => {
    // Named explicitly: a logo silently dropping to a monogram is exactly the
    // regression this file exists to catch.
    for (const id of [
      "aws",
      "gcp",
      "azure",
      "coreweave",
      "runpod",
      "nebius",
      "lambda",
      "together",
      "modal",
    ]) {
      const provider = PROVIDERS.find((p) => p.id === id)!;
      expect(iconSourceFor(provider)).toBe("logo");
    }
  });

  it("draws every logo in a colour that reads on white", () => {
    for (const [id, mark] of Object.entries(BRAND_MARKS)) {
      for (const color of [mark.color, ...perPathColors(mark)]) {
        expect(color, id).toMatch(/^#[0-9a-f]{6}$/);
        // ~3:1 is the floor for a 24px mark to register as a shape at all.
        expect(contrastOnWhite(color), `${id} (${color})`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("keeps the published hex whenever it was legible as-is", () => {
    for (const [id, mark] of Object.entries(BRAND_MARKS)) {
      if (mark.official === undefined) continue;
      // An `official` override is only justified by the colour being too light.
      expect(contrastOnWhite(mark.official), id).toBeLessThan(3);
      expect(mark.official, id).not.toBe(mark.color);
    }
  });

  it("carries drawable path data for every mark", () => {
    for (const [id, mark] of Object.entries(BRAND_MARKS)) {
      expect(mark.viewBox, id).toMatch(/^0 0 [\d.]+ [\d.]+$/);
      expect(mark.paths.length, id).toBeGreaterThan(0);
      for (const d of geometry(mark)) {
        expect(d.startsWith("M"), `${id} path starts at a move`).toBe(true);
        expect(d.length, id).toBeGreaterThan(20);
      }
    }
  });

  it("holds no duplicate subpaths, which would double-draw", () => {
    for (const [id, mark] of Object.entries(BRAND_MARKS)) {
      const ds = geometry(mark);
      expect(new Set(ds).size, id).toBe(ds.length);
    }
  });

  it("returns nothing for a provider we have no logo for", () => {
    expect(brandMark("nope")).toBeUndefined();
  });
});

describe("ProviderIcon mapping", () => {
  it("never falls back to letters — every provider has a logo or a glyph", () => {
    const monogrammed = PROVIDERS.filter((p) => iconSourceFor(p) === "monogram");
    expect(monogrammed.map((p) => p.id)).toEqual([]);
  });

  it("gives every third-party vendor its real logo, not a stand-in", () => {
    for (const p of PROVIDERS.filter((p) => !isSelfManaged(p))) {
      expect(iconSourceFor(p), p.id).toBe("logo");
    }
  });

  it("gives every provider exactly one resolved icon source", () => {
    for (const p of PROVIDERS) {
      expect(["logo", "glyph", "monogram"]).toContain(iconSourceFor(p));
    }
  });

  it("still has a monogram behind every vendor, as the fallback", () => {
    for (const p of PROVIDERS.filter((p) => !isSelfManaged(p))) {
      expect(p.monogram, p.id).toBeTruthy();
      expect(monogramFor(p).length).toBeLessThanOrEqual(2);
    }
  });

  it("never shows the same monogram for two providers", () => {
    const marks = PROVIDERS.filter((p) => !isSelfManaged(p)).map(monogramFor);
    expect(new Set(marks).size).toBe(marks.length);
  });

  it("never falls back to letters for self-managed capacity", () => {
    for (const kind of SELF_KINDS) {
      const p = PROVIDERS.find((p) => p.kind === kind.id)!;
      expect(iconSourceFor(p), kind.id).not.toBe("monogram");
      expect(p.monogram).toBeUndefined();
    }
  });

  it("falls back to initials when a provider has no monogram", () => {
    expect(monogramFor({ id: "x", name: "Nimbus Compute", kind: "neocloud" })).toBe("NI");
  });
});
