"use client";

import { useEffect, useMemo, useState } from "react";
import { GPUS, levelStatus, PROVIDERS, type AvailabilityStatus } from "@/lib/data";
import {
  browserTimeZone,
  estimateRttMs,
  greatCircleKm,
  resolveViewerOrigin,
  type ViewerOrigin,
} from "@/lib/latency";
import { REGIONS, sampleDistribution, summariseByArea, type RegionPresence } from "@/lib/regions";
import { MAP_SIZE, project } from "@/lib/world-map";
import { BORDER_PATH, LAND_PATH } from "@/lib/world-map-data";
import { AvailabilityKey } from "./availability-key";
import { GpuPicker } from "./gpu-picker";
import { ProviderMark } from "./provider-icon";

const MARKER_FILL: Record<AvailabilityStatus, string> = {
  healthy: "var(--color-healthy)",
  tight: "var(--color-tight)",
  scarce: "var(--color-scarce)",
  none: "var(--color-mute)",
};

const AREA_DOT: Record<AvailabilityStatus, string> = {
  healthy: "bg-healthy",
  tight: "bg-tight",
  scarce: "bg-scarce",
  none: "bg-mute",
};

/**
 * Where a given GPU physically sits, worldwide.
 *
 * The companion to the provider board: same GPU selection, but grouped by
 * geography instead of by vendor. Marker area encodes how many providers are
 * present and colour encodes availability — the same colour scale the board
 * uses, so one legend covers both views.
 *
 * Marker size used to encode a sampled "share of supply". It doesn't any more:
 * provider count is a real property of the region list, where the share was a
 * number the page made up.
 */
export function GlobalView({
  gpuId,
  onSelectGpu,
}: {
  gpuId: string;
  onSelectGpu: (id: string) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Resolved in an effect, not during render: the time zone is a client-only
  // fact, and reading it while rendering would make the server and client
  // markup disagree. Null until it lands, which is also the permanent state for
  // an unrecognised zone — the panel drops its latency row rather than guessing.
  const [origin, setOrigin] = useState<ViewerOrigin | null>(null);
  useEffect(() => setOrigin(resolveViewerOrigin(browserTimeZone())), []);

  const rows = useMemo(() => sampleDistribution(gpuId), [gpuId]);
  const areas = useMemo(() => summariseByArea(rows), [rows]);
  const gpu = useMemo(() => GPUS.find((g) => g.id === gpuId) ?? GPUS[0], [gpuId]);

  // Marker area scales against the busiest region on the map, so the largest
  // marker is always full-size regardless of which GPU is selected.
  const peakProviders = useMemo(
    () => Math.max(...REGIONS.map((r) => r.providerIds.length)),
    [],
  );

  const active = activeId ? rows.find((r) => r.region.id === activeId) : undefined;
  // Falls back to the nearest region when we know where the reader is, and to
  // the busiest one otherwise — either way the panel is never empty and the
  // layout doesn't jump as the pointer enters and leaves the map.
  const fallback = useMemo(() => {
    if (!origin) return rows[0];
    return rows.reduce((best, row) =>
      greatCircleKm(origin, row.region) < greatCircleKm(origin, best.region) ? row : best,
    );
  }, [origin, rows]);
  const shown = active ?? fallback;

  return (
    // Same gap below the toolbar as the providers view, so switching between
    // them doesn't shift the content up or down.
    <div className="mt-7">
      {/* `items-start` so the sidebar cards keep their natural height instead of
          stretching to match the map, which is much the taller of the two. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="rounded-lg border border-line bg-surface/70 p-4">
          {/* The picker heads the map card, ruled off from the figure below it:
              it's the map's own subject line, so it belongs inside the card
              rather than floating above it. */}
          <div className="mb-3.5 flex items-center justify-between gap-3 border-b border-line/70 pb-3.5">
            <GpuPicker selectedId={gpuId} onSelect={onSelectGpu} />
            <p className="font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute/60 uppercase">
              worldwide
            </p>
          </div>

          <svg
            viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Regions with ${gpu.name} capacity`}
          >
            <defs>
              {/* Dot matrix over a flat wash, both clipped to the coastline.
                  Dots alone were too sparse to read as continents — the wash
                  carries the silhouette and the dots keep the mono, hairline
                  texture the rest of the site uses; a solid fill would compete
                  with the markers, which are the actual content.

                  Grid tightened from 2 to 1.4 units with proportionally smaller
                  dots. The finer coastline resolves countries the size of
                  Switzerland, and on a 2-unit grid those held one dot or none —
                  so the texture broke up exactly where the new detail was worth
                  seeing. Same ink coverage, three times the sample rate. */}
              <pattern id="land-dots" width="1.4" height="1.4" patternUnits="userSpaceOnUse">
                <circle cx="0.7" cy="0.7" r="0.3" fill="var(--color-mute)" opacity="0.45" />
              </pattern>
              <clipPath id="land-clip">
                {/* No transform: the generator already projects into this
                    viewBox's coordinates. Note that clipPath only honours shape
                    children — a wrapping <g> is ignored outright, which empties
                    the clip and erases the land silently. */}
                <path d={LAND_PATH} />
              </clipPath>
            </defs>

            <g clipPath="url(#land-clip)">
              <rect
                width={MAP_SIZE.width}
                height={MAP_SIZE.height}
                fill="var(--color-ink-soft)"
              />
              <rect width={MAP_SIZE.width} height={MAP_SIZE.height} fill="url(#land-dots)" />

              {/* Country boundaries, clipped to land so the mesh's few
                  coast-adjacent strays can't stroke out over open water.

                  These are the reason to carry a finer source at all: a coastline
                  says "somewhere in western Europe", a border says "Germany", and
                  placing a region is the whole job of this figure. Drawn lighter
                  than the coastline it sits inside — a border is a subdivision of
                  land, so it should read as internal structure, not as an edge
                  competing with the silhouette. */}
              <path
                d={BORDER_PATH}
                fill="none"
                stroke="var(--color-mute)"
                strokeWidth={0.22}
                strokeOpacity={0.4}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </g>

            {/* Just the equator, and only across the ocean stretches — a rule
                drawn over the dotted land competed with the same texture it was
                crossing. Kept because it anchors the vertical scale, which a
                cropped map otherwise leaves ambiguous. */}
            <line
              x1={0}
              x2={MAP_SIZE.width}
              y1={project(0, 0).y}
              y2={project(0, 0).y}
              stroke="var(--color-line)"
              strokeWidth={0.3}
              strokeDasharray="1.5 3"
              opacity={0.7}
            />

            {/* `rows` is sorted largest-first, which is the order these must be
                painted in: later siblings sit on top in SVG, so drawing small
                markers last keeps them from disappearing under a big neighbour's
                halo. The hovered one is lifted out and re-drawn below. */}
            {rows.map((row) => (
              <RegionMarker
                key={row.region.id}
                row={row}
                peak={peakProviders}
                active={false}
                onEnter={() => setActiveId(row.region.id)}
                onLeave={() => setActiveId(null)}
              />
            ))}

            {/* The active marker again, last, so its ring and label clear every
                other marker rather than being overlapped by whatever happens to
                come after it in the list. */}
            {shown && (
              <RegionMarker
                key={`${shown.region.id}:active`}
                row={shown}
                peak={peakProviders}
                active
                onEnter={() => setActiveId(shown.region.id)}
                onLeave={() => setActiveId(null)}
              />
            )}
          </svg>

          {/* Both of the marker's channels, keyed in one strip beneath the map:
              size on the left, colour on the right. They belong together — a
              marker encodes both at once, so splitting the two keys across the
              page would make the reader hunt for half the legend. */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-line/70 pt-3">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute/60 uppercase">
              <span className="flex items-end gap-1">
                {/* Roughly the on-screen size of the smallest, a middling, and
                    the largest marker. */}
                {[1.5, 2.1, 2.7].map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-mute/30"
                    style={{ width: r * 2, height: r * 2 }}
                  />
                ))}
              </span>
              providers per site
            </div>
            <AvailabilityKey />
          </div>

          {/* Demoted out of the key strip: it's a caption on the whole figure,
              not a third thing to decode. Says which channel is real and which
              is modelled, because they're mixed — size comes from the provider
              rosters, colour from the sampler. */}
          <p className="mt-2 font-mono text-[10px] text-mute/60">
            {rows.length} regions · {PROVIDERS.length} providers · availability illustrative
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {/* Continent roll-up: the map answers "where", this counts it up so the
              reader doesn't have to tally dots.

              Counts, not percentages. This used to read "40% · share of supply",
              which was a proportion of a total nobody publishes — sites and
              providers are things the region list actually knows. */}
          <div className="rounded-lg border border-line bg-surface/70 p-3">
            <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-line/70 pb-2">
              <span className="font-mono text-[10px] tracking-[0.18em] text-mute/80 uppercase">
                By area
              </span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-mute/60 uppercase">
                sites · providers
              </span>
            </div>
            <ul className="space-y-1.5">
              {areas.map((area) => (
                <li key={area.area} className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    {/* A unit plot, not a status icon: one dot per site, each in
                        its own colour. The single averaged dot that used to sit
                        here hid the case that matters — four healthy metros and
                        one dry one average to "fine", and someone choosing a
                        region needs to see the dry one. At these counts the dots
                        also *are* the tally, so the number beside them is a
                        readout of the plot rather than a second encoding. */}
                    <span
                      className="flex shrink-0 items-center gap-[3px]"
                      role="img"
                      aria-label={`${area.regions} sites: ${area.levels
                        .map((l) => STATUS_WORD[levelStatus(l)].toLowerCase())
                        .join(", ")}`}
                    >
                      {area.levels.map((level, i) => (
                        <span
                          key={i}
                          className={`h-2 w-[3px] rounded-[1px] ${AREA_DOT[levelStatus(level)]}`}
                        />
                      ))}
                    </span>
                    <span className="truncate font-mono text-[12px] text-ink-strong">
                      {area.area}
                    </span>
                  </span>
                  {/* No bar: with counts this small the number is exact and a bar
                      would only re-encode it approximately. */}
                  <span className="flex shrink-0 items-baseline gap-1 font-mono text-[11px] tabular-nums">
                    <span className="text-ink-strong">{area.regions}</span>
                    <span className="text-mute/40">·</span>
                    <span className="text-mute/80">{area.providers}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {shown && <RegionDetail row={shown} origin={origin} />}
        </div>
      </div>
    </div>
  );
}

/**
 * One region. Radius scales with the square root of the provider count so that
 * *area*, not radius, tracks it — scaling radius linearly would make a site with
 * twice the providers look four times bigger.
 *
 * Three elements and no more: a halo to separate neighbours, a wash to give the
 * disc body, and a ring to define its edge. There was a fourth, a filled dot at
 * the centre, which is gone — the ring and wash are the same hue, so a third
 * concentric circle in that hue marked a position the disc already marked, and
 * on the smaller markers it filled most of the disc and turned it into a blob.
 */
function RegionMarker({
  row,
  peak,
  active,
  onEnter,
  onLeave,
}: {
  row: RegionPresence;
  /** Provider count of the busiest region, so sizes are comparable map-wide. */
  peak: number;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { x, y } = project(row.region.lon, row.region.lat);
  // Tuned so the largest marker is roughly the size of a metro at this scale
  // rather than the size of a country — big discs over Europe read as one
  // smear, and a marker wider than the landmass it sits on stops locating
  // anything. The floor keeps the smallest region clickable-looking.
  //
  // Trimmed again once the map gained borders: the point of a marker is to sit
  // *in* a country, which needs the country to still be visible around it. At
  // the old scale the London/Amsterdam/Frankfurt cluster covered most of
  // north-west Europe, so the extra geography went to waste exactly where the
  // map is busiest.
  const r = 0.7 + Math.sqrt(row.providerIds.length / peak) * 1.5;
  const fill = MARKER_FILL[levelStatus(row.level)];

  return (
    <g
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      tabIndex={0}
      className="cursor-pointer focus:outline-none"
      aria-label={`${row.region.city}: ${row.providerIds.length} providers`}
    >
      {/* Generous transparent hit area — the visible dots are only a few pixels
          across at this scale, which is too small to reliably point at. */}
      <circle cx={x} cy={y} r={Math.max(r + 3, 5)} fill="transparent" />
      {/* Separation from neighbouring markers, as a stroke rather than a filled
          disc. Western Europe packs four metros into a few degrees, so without a
          gap the discs fuse into one blob — but the old version was an opaque
          `surface` circle at r+0.5, which also erased the coastline and borders
          underneath. A ring only spends ink where two markers actually touch,
          and now that the map has real geography in it that difference is the
          whole point: the backdrop stays visible through the gap. */}
      <circle
        cx={x}
        cy={y}
        r={r + 0.25}
        fill="none"
        stroke="var(--color-surface)"
        strokeWidth={0.5}
      />
      {/* Opaque body. The fill can't be translucent now — the dot matrix and
          borders show through and muddle the colour, which is the marker's
          availability channel and has to stay readable. */}
      <circle cx={x} cy={y} r={r} fill="var(--color-surface)" />
      <circle cx={x} cy={y} r={r} fill={fill} fillOpacity={active ? 0.55 : 0.32} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={fill}
        strokeWidth={active ? 1.1 : 0.75}
        vectorEffect="non-scaling-stroke"
      />
      {active && (
        // Drawn twice: a fat `surface`-coloured stroke first, then the fill over
        // it. That's a halo the exact shape of the glyphs, which is what the
        // label needs now that it sits over a dotted, bordered landmass — a
        // rectangle would blank out a chunk of the map, and unbacked text on
        // this texture is unreadable at 5px. `paintOrder` is what makes it work:
        // without it the stroke covers the fill and the text turns solid white.
        <text
          x={x}
          y={y - r - 2.5}
          textAnchor="middle"
          className="font-mono"
          fontSize={5}
          fill="var(--color-ink-strong)"
          stroke="var(--color-surface)"
          strokeWidth={1}
          strokeLinejoin="round"
          paintOrder="stroke"
        >
          {row.region.city}
        </text>
      )}
    </g>
  );
}

/** The hovered region: where it is, how far away, how it's doing, who's there. */
function RegionDetail({
  row,
  origin,
}: {
  row: RegionPresence;
  /** Where we think the reader is, or null if the time zone was unrecognised. */
  origin: ViewerOrigin | null;
}) {
  const providers = row.providerIds
    .map((id) => PROVIDERS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const status = levelStatus(row.level);
  const km = origin ? greatCircleKm(origin, row.region) : null;

  return (
    <div className="rounded-lg border border-line bg-surface/70 p-3">
      <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-line/70 pb-2">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-mono text-[13px] font-medium tracking-tight text-ink-strong">
            {row.region.city}
          </span>
          <span className="shrink-0 font-mono text-[10px] whitespace-nowrap text-mute/60">
            {row.region.area}
          </span>
        </span>
      </div>

      {/* Availability and round-trip time.
          This slot used to hold "Capacity #1 of 17", which was a rank over a
          sampled weight — an invented quantity dressed as a comparison. Latency
          replaces it because it's the one figure here that genuinely follows from
          the data: the coordinates are real and the speed of light in fibre is
          known, so the number is derived rather than drawn. */}
      <dl className="mb-2.5 grid grid-cols-2 gap-x-2 gap-y-2">
        <div>
          <dt className="font-mono text-[10px] tracking-[0.14em] text-mute/70 uppercase">
            Availability
          </dt>
          <dd className="mt-0.5 flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-sm ${AREA_DOT[status]}`} />
            <span className="font-mono text-[12px] text-ink-strong">{STATUS_WORD[status]}</span>
          </dd>
        </div>
        {km !== null && (
          <div>
            <dt className="font-mono text-[10px] tracking-[0.14em] text-mute/70 uppercase">
              Latency
            </dt>
            {/* Rounded to 5 ms and prefixed "~": the model is good to maybe
                ±20%, and a figure like "83ms" would imply a measurement nobody
                took.

                Floored at "<10ms" rather than printing the model's 5 ms
                switching term. This estimates backbone fibre only — it has no
                model of the access network, which adds 5–20 ms on real
                broadband — so a single-digit figure is below what the maths can
                support. Matters here because the nearest region is often in the
                reader's own metro, where the raw number came out as ~5ms. */}
            <dd className="mt-0.5 font-mono text-[12px] text-ink-strong tabular-nums">
              {estimateRttMs(km) < 10 ? "<10" : `~${Math.round(estimateRttMs(km) / 5) * 5}`}ms
              <span className="text-mute/70"> rtt</span>
            </dd>
          </div>
        )}
      </dl>


      <div className="mb-1.5 font-mono text-[10px] tracking-[0.14em] text-mute/70 uppercase">
        {providers.length} providers
      </div>
      {/* Two-up: rosters run from two to six, and a single column made the panel
          jump in height as the pointer moved across the map. */}
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
        {providers.map((provider) => (
          <li key={provider.id} className="flex items-center gap-1.5">
            <ProviderMark provider={provider} className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono text-[11px] text-mute">{provider.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Availability as a word, for the detail panel. */
const STATUS_WORD: Record<AvailabilityStatus, string> = {
  healthy: "High",
  tight: "Moderate",
  scarce: "Low",
  none: "None",
};
