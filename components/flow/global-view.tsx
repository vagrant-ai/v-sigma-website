"use client";

import { useMemo, useState } from "react";
import { GPUS, levelStatus, PROVIDERS, type AvailabilityStatus } from "@/lib/data";
import { sampleDistribution, summariseByArea, type RegionCapacity } from "@/lib/regions";
import { LANDMASSES, MAP_BOUNDS, MAP_SIZE, project } from "@/lib/world-map";
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
 * geography instead of by vendor. Marker area encodes relative capacity and
 * colour encodes availability — the same colour scale the board uses, so the
 * legend above covers both views.
 */
export function GlobalView({ gpuId }: { gpuId: string }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const rows = useMemo(() => sampleDistribution(gpuId), [gpuId]);
  const areas = useMemo(() => summariseByArea(rows), [rows]);
  const gpu = useMemo(() => GPUS.find((g) => g.id === gpuId) ?? GPUS[0], [gpuId]);

  const active = activeId ? rows.find((r) => r.region.id === activeId) : undefined;
  // Falls back to the largest region so the detail panel is never empty and the
  // layout doesn't jump as the pointer enters and leaves the map.
  const shown = active ?? rows[0];

  return (
    // Same gap below the toolbar as the providers view, so switching between
    // them doesn't shift the content up or down.
    <div className="mt-7">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-lg border border-line bg-surface/70 p-4">
          <svg
            viewBox={`0 0 ${MAP_SIZE.width} ${MAP_SIZE.height}`}
            className="h-auto w-full"
            role="img"
            aria-label={`Regions with ${gpu.name} capacity`}
          >
            {/* Landmass paths are authored in raw lon/lat. The viewBox runs one
                unit per degree, so a flip and a shift is the whole projection —
                no per-point transform needed. Mirrors `project`: x shifts by
                half the width, y flips about the northern bound. */}
            <g transform={`translate(${MAP_SIZE.width / 2}, ${MAP_BOUNDS.latMax}) scale(1, -1)`}>
              {/* Unstroked and pale: these outlines are approximate, and a
                  crisp edge would invite the reader to read them as accurate
                  coastlines. Soft shapes place the markers in the right part of
                  the world without making a claim about geography. */}
              {LANDMASSES.map((d) => (
                <path key={d} d={d} fill="var(--color-line)" fillOpacity={0.45} />
              ))}
            </g>

            {/* Graticule: equator and the tropics, faint. Gives the flat map
                enough structure to read as a map rather than a blob field. */}
            {[0, 23.5, -23.5].map((lat) => (
              <line
                key={lat}
                x1={0}
                x2={MAP_SIZE.width}
                y1={project(0, lat).y}
                y2={project(0, lat).y}
                stroke="var(--color-line)"
                strokeWidth={0.3}
                strokeDasharray="2 3"
                opacity={lat === 0 ? 0.9 : 0.5}
              />
            ))}

            {rows.map((row) => (
              <RegionMarker
                key={row.region.id}
                row={row}
                active={shown?.region.id === row.region.id}
                onEnter={() => setActiveId(row.region.id)}
                onLeave={() => setActiveId(null)}
              />
            ))}
          </svg>

          {/* What marker size means, stated rather than left to be inferred. */}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line/70 pt-3">
            <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] text-mute/80 uppercase">
              <span className="flex items-end gap-1">
                {[2, 3.5, 5].map((r) => (
                  <span
                    key={r}
                    className="rounded-full bg-mute/30"
                    style={{ width: r * 2, height: r * 2 }}
                  />
                ))}
              </span>
              relative capacity
            </div>
            <p className="font-mono text-[9px] text-mute/70">
              {rows.length} regions · illustrative distribution
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {/* Continent roll-up: the map answers "where", this answers "how much
              of the world" without making the reader count dots. Each row gets a
              share bar, so the areas are comparable at a glance rather than only
              via their counts. */}
          <div className="rounded-lg border border-line bg-surface/70 p-3">
            <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-line/70 pb-2">
              <span className="font-mono text-[9px] tracking-[0.18em] text-mute/80 uppercase">
                By area
              </span>
              <span className="font-mono text-[9px] text-mute/60 tabular-nums">
                {rows.length} regions
              </span>
            </div>
            <ul className="space-y-2">
              {areas.map((area) => (
                <li key={area.area}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`h-1.5 w-1.5 shrink-0 rounded-sm ${AREA_DOT[levelStatus(area.level)]}`}
                      />
                      <span className="truncate font-mono text-[11px] text-ink-strong">
                        {area.area}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] text-mute/80 tabular-nums">
                      {area.regions}
                    </span>
                  </div>
                  {/* Width is the area's share of all regions — a proportion of
                      *sites*, not of capacity, which the map's marker sizes
                      already carry. */}
                  <div className="mt-1 ml-3.5 h-0.5 overflow-hidden rounded-full bg-line/70">
                    <div
                      className={AREA_DOT[levelStatus(area.level)]}
                      style={{ width: `${(area.regions / rows.length) * 100}%`, height: "100%" }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {shown && <RegionDetail row={shown} pinned={active !== undefined} />}
        </div>
      </div>
    </div>
  );
}

/**
 * One region. Radius scales with the square root of share so that *area*, not
 * radius, tracks capacity — scaling radius linearly would make a 2× region look
 * 4× bigger.
 */
function RegionMarker({
  row,
  active,
  onEnter,
  onLeave,
}: {
  row: RegionCapacity;
  active: boolean;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const { x, y } = project(row.region.lon, row.region.lat);
  const r = 1.6 + Math.sqrt(row.share) * 4.4;
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
      <circle cx={x} cy={y} r={r} fill={fill} fillOpacity={active ? 0.4 : 0.22} />
      <circle
        cx={x}
        cy={y}
        r={r}
        fill="none"
        stroke={fill}
        strokeWidth={active ? 1.1 : 0.7}
        vectorEffect="non-scaling-stroke"
      />
      <circle cx={x} cy={y} r={1} fill={fill} />
      {active && (
        <text
          x={x}
          y={y - r - 2.5}
          textAnchor="middle"
          className="font-mono"
          fontSize={5}
          fill="var(--color-ink-strong)"
        >
          {row.region.city}
        </text>
      )}
    </g>
  );
}

/** The hovered region: where it is, how it's doing, and who's there. */
function RegionDetail({ row, pinned }: { row: RegionCapacity; pinned: boolean }) {
  const providers = row.providerIds
    .map((id) => PROVIDERS.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);
  const status = levelStatus(row.level);

  return (
    <div className="rounded-lg border border-line bg-surface/70 p-3">
      <div className="mb-2.5 flex items-baseline justify-between gap-2 border-b border-line/70 pb-2">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="truncate font-mono text-[12px] font-medium tracking-tight text-ink-strong">
            {row.region.city}
          </span>
          <span className="shrink-0 font-mono text-[9px] whitespace-nowrap text-mute/60">
            {row.region.area}
          </span>
        </span>
        {/* Says whether you're looking at your hover or the default, so the
            panel's contents are never ambiguous. */}
        <span className="shrink-0 font-mono text-[9px] tracking-[0.14em] whitespace-nowrap text-mute/70 uppercase">
          {pinned ? "hovered" : "largest"}
        </span>
      </div>

      {/* The two things the marker encodes, spelled out — a reader shouldn't
          have to compare circle areas to get a region's numbers. */}
      <dl className="mb-2.5 grid grid-cols-2 gap-2">
        <div>
          <dt className="font-mono text-[9px] tracking-[0.14em] text-mute/70 uppercase">
            Availability
          </dt>
          <dd className="mt-0.5 flex items-center gap-1.5">
            <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-sm ${AREA_DOT[status]}`} />
            <span className="font-mono text-[11px] text-ink-strong">{STATUS_WORD[status]}</span>
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[9px] tracking-[0.14em] text-mute/70 uppercase">
            Capacity
          </dt>
          {/* Relative to the largest region, and labelled as such: providers
              don't publish absolute inventory, so a GPU count would be made up. */}
          <dd className="mt-0.5 font-mono text-[11px] text-ink-strong tabular-nums">
            {Math.round(row.share * 100)}
            <span className="text-mute/70"> / 100</span>
          </dd>
        </div>
      </dl>

      <div className="mb-1.5 font-mono text-[9px] tracking-[0.14em] text-mute/70 uppercase">
        {providers.length} providers
      </div>
      {/* Two-up: rosters run from two to six, and a single column made the panel
          jump in height as the pointer moved across the map. */}
      <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
        {providers.map((provider) => (
          <li key={provider.id} className="flex items-center gap-1.5">
            <ProviderMark provider={provider} className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono text-[10px] text-mute">{provider.name}</span>
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
