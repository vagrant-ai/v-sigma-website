/**
 * Generates lib/world-map-data.ts from real geography.
 *
 * Run with `npm run generate:map`. Only needed when the projection bounds or the
 * simplification change — the output is committed, so a normal build and a
 * normal `npm install` never touch d3-geo, topojson-client, topojson-simplify or
 * world-atlas. They are devDependencies for exactly that reason: shipping a
 * topology file and a projection library to the browser would cost hundreds of
 * kilobytes to draw a backdrop behind seventeen dots.
 *
 * Emits two paths:
 *  - LAND_PATH, the coastline, used as a clip for the dotted land fill;
 *  - BORDER_PATH, an interior mesh of country boundaries.
 *
 * Source: world-atlas 50m (Natural Earth), simplified. 50m raw is 599 kB of
 * path data, absurd for a backdrop; 110m is 51 kB but loses the Mediterranean's
 * shape, the Great Lakes, the Baltic and the Red Sea — the very features a
 * reader uses to place a marker. Simplifying 50m keeps those and lands between
 * the two.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import { geoEquirectangular, geoPath } from "d3-geo";
import { feature, mesh } from "topojson-client";
import { presimplify, quantile, simplify } from "topojson-simplify";

const require = createRequire(import.meta.url);

// Must match MAP_BOUNDS in lib/world-map.ts.
const BOUNDS = { lonMin: -180, lonMax: 180, latMin: -48, latMax: 76 };
const WIDTH = BOUNDS.lonMax - BOUNDS.lonMin;
const HEIGHT = BOUNDS.latMax - BOUNDS.latMin;

/**
 * Plate carrée at one unit per degree, so the generated paths share the
 * coordinate system `project()` uses for the region markers and the two stay
 * registered. `geoEquirectangular` at scale 180/π is exactly one unit per
 * degree; translate puts 0°,0° where the bounds say it belongs.
 */
const projection = geoEquirectangular()
  .scale(180 / Math.PI)
  .translate([WIDTH / 2, ((BOUNDS.latMax - 0) / (BOUNDS.latMax - BOUNDS.latMin)) * HEIGHT]);

/**
 * Fraction of arc detail *kept* before projecting, as a quantile of
 * Visvalingam's area threshold. Lower keeps less.
 *
 * The two layers get different budgets because they're doing different work.
 *
 * Land is filled through a 2-unit dot matrix, which is a hard limit on what any
 * coastline detail can show: below that grid, extra vertices change nothing on
 * screen. So the coastline is thinned hard and judged on silhouette alone —
 * enough to keep the Mediterranean open, the Great Lakes present, the Red Sea a
 * gap, and Denmark from fusing with Sweden.
 *
 * Borders are hairlines drawn at full resolution with no matrix in the way, so
 * they show every vertex they're given, and they're what makes the map worth
 * reading — a marker "in Germany" is a fact the coastline can't convey. They get
 * the larger share of the budget despite being the thinner mark.
 */
const LAND_DETAIL = 0.12;
const BORDER_DETAIL = 0.22;

/**
 * Smallest island kept, as bounding-box area in square degrees.
 *
 * The 50m topology carries ~1,400 separate rings, most of them islets a fraction
 * of a pixel across. They cost about a third of the file and render as noise —
 * or as nothing, since the land is filled through a 2-unit dot matrix that can't
 * resolve them. 2 units² is roughly a 1.4° box, which keeps Hawaii, the Azores,
 * Fiji and the Falklands while dropping the specks.
 */
const MIN_ISLAND_AREA = 4;

/** Bounding-box area of one subpath, in square units. */
function subpathArea(subpath) {
  const nums = subpath.match(/-?[\d.]+/g);
  if (!nums || nums.length < 4) return 0;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = Number(nums[i]);
    const y = Number(nums[i + 1]);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return (maxX - minX) * (maxY - minY);
}

/**
 * Drops subpaths below the area threshold.
 *
 * Operates on the projected path string rather than on the topology because the
 * threshold is a screen-space judgement — what is too small to see — and only
 * the projected coordinates know that.
 */
function dropSpecks(d, minArea) {
  const subpaths = d.split(/(?=M)/).filter(Boolean);
  const kept = subpaths.filter((s) => subpathArea(s) >= minArea);
  return { d: kept.join(""), kept: kept.length, total: subpaths.length };
}

/** Simplify a topology by fraction of detail discarded. */
function thin(topology, detail) {
  const pre = presimplify(topology);
  return simplify(pre, quantile(pre, detail));
}

/**
 * One decimal — about 11 km at this scale, finer than the dot matrix the land is
 * filled through, so nothing more is perceptible. Two decimals costs ~20% more
 * for detail no one can see; integer precision risks collapsing the smaller
 * islands to zero area.
 */
const path = geoPath(projection).digits(1);

const landTopo = thin(
  JSON.parse(readFileSync(require.resolve("world-atlas/land-50m.json"), "utf8")),
  LAND_DETAIL,
);
const land = dropSpecks(path(feature(landTopo, landTopo.objects.land)), MIN_ISLAND_AREA);
if (!land.d) throw new Error("geoPath produced no land output");

/**
 * Country boundaries as an interior mesh: `(a, b) => a !== b` keeps only edges
 * between two different countries, so coastlines aren't drawn a second time over
 * LAND_PATH and each shared border appears once rather than once per neighbour.
 * That is what makes this layer affordable at all.
 */
const borderTopo = thin(
  JSON.parse(readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8")),
  BORDER_DETAIL,
);
const borders = path(mesh(borderTopo, borderTopo.objects.countries, (a, b) => a !== b));
if (!borders) throw new Error("geoPath produced no border output");

const out = `// @generated by scripts/generate-world-map.mjs — do not edit by hand.
// Real geography from Natural Earth (world-atlas 50m, simplified), projected to
// plate carrée at one unit per degree. Regenerate with \`npm run generate:map\`.
//
// Antarctica and the high Arctic are in the source but fall outside MAP_BOUNDS
// and are clipped away by the viewBox.

/** Every landmass as one path, in the same units as \`project()\`. */
export const LAND_PATH =
  ${JSON.stringify(land.d)};

/**
 * Country boundaries, interior edges only — coastlines are already in
 * LAND_PATH, so this holds just the lines between neighbours.
 */
export const BORDER_PATH =
  ${JSON.stringify(borders)};
`;

writeFileSync(new URL("../lib/world-map-data.ts", import.meta.url), out);

const kb = (s) => (s.length / 1024).toFixed(1);
const gz = (s) => (gzipSync(Buffer.from(s)).length / 1024).toFixed(1);
console.log(
  `wrote lib/world-map-data.ts (${kb(out)} kB, ${gz(out)} kB gzipped)\n` +
    `  land:    ${kb(land.d)} kB, ${land.kept}/${land.total} subpaths kept\n` +
    `  borders: ${kb(borders)} kB`,
);
