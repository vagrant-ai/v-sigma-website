"use client";

import { useMemo, useState } from "react";
import { sampleAvailability } from "@/lib/availability";
import {
  DEFAULT_GPU,
  MARKET_KINDS,
  PROVIDERS,
  SELF_KINDS,
  availabilityStatus,
  groupStatus,
  type Availability,
  type AvailabilityStatus,
  type Provider,
} from "@/lib/data";
import { BoardToolbar } from "./board-toolbar";
import { FlowChips } from "./flow-chip";
import { ProviderCard } from "./provider-card";
import { SigmaPlatform } from "./sigma-platform";
import { WorkloadBand } from "./workload-band";
import { edgeLength, edgePathVertical, useAnchors } from "./use-anchors";

/** Edge colour per group status, so the flow itself carries the headline. */
const EDGE_COLOR: Record<AvailabilityStatus, string> = {
  healthy: "var(--color-healthy)",
  tight: "var(--color-tight)",
  scarce: "var(--color-scarce)",
  none: "var(--color-mute)",
};

/**
 * The dot on each panel heading, matching that panel's incoming edge so the
 * eye can tie the two together. Full class strings, since Tailwind can't see
 * through interpolation.
 */
const PANEL_DOT: Record<AvailabilityStatus, string> = {
  healthy: "bg-healthy",
  tight: "bg-tight",
  scarce: "bg-scarce",
  none: "bg-mute",
};

/** The halo behind each panel dot, matching it. */
const PANEL_GLOW: Record<AvailabilityStatus, string> = {
  healthy: "bg-healthy/15",
  tight: "bg-tight/15",
  scarce: "bg-scarce/15",
  none: "bg-mute/15",
};

/**
 * Speed of everything moving along an edge, in px/s.
 *
 * Kept identical for the dashes and the provider chips so a chip travels
 * *with* the data rather than drifting through it — at different speeds the two
 * read as unrelated animations on the same wire instead of one flow.
 *
 * Must match `.flow-packets` in globals.css, whose `flow-dash` keyframe shifts
 * 24 units per cycle: 24 / 0.5s = 48px/s.
 */
const FLOW_PX_PER_SEC = 48;

/**
 * Share of a chip's cycle spent travelling; the rest is spent parked and
 * invisible at the far end. Must match the `flow-chip` keyframes.
 */
const CHIP_TRAVEL_FRACTION = 0.7;

const GROUP_LABEL: Record<AvailabilityStatus, string> = {
  healthy: "high availability overall",
  tight: "moderate availability overall",
  scarce: "low availability overall",
  none: "no availability",
};

export function FlowBoard() {
  const [gpuId, setGpuId] = useState(DEFAULT_GPU.id);

  const availability = useMemo(() => sampleAvailability(gpuId), [gpuId]);
  const byProvider = useMemo(
    () => new Map<string, Availability>(availability.map((a) => [a.providerId, a])),
    [availability],
  );

  /**
   * One panel per destination group. Market kinds keep their own panel, while
   * the self-managed kinds collapse into a single "Your infrastructure" panel —
   * they have no vendor roster, so a panel each would just look empty.
   *
   * Widths are proportional to the roster: the neocloud list is the long one,
   * so it gets half the row and lays its providers out two-up, while the two
   * short panels stay narrow single columns.
   */
  const panels = useMemo(() => {
    const rowsFor = (providers: Provider[]) =>
      providers.map((p) => byProvider.get(p.id)).filter((a): a is Availability => a !== undefined);

    /**
     * Rows keep their catalog order, which never changes with the selected GPU.
     * Sorting by availability would reshuffle every row on each pick, so the
     * one thing you want to compare — how this GPU's colours differ from the
     * last — would be buried under everything moving at once.
     */
    const build = (id: string, label: string, wide: boolean, providers: Provider[]) => ({
      id,
      label,
      wide,
      providers,
      status: groupStatus(rowsFor(providers)),
      /**
       * Which vendors ride this edge as chips. Only ones with capacity for the
       * selected GPU: a mark travelling toward a provider that has nothing
       * would claim a request is being served when it isn't. Capped at three so
       * a six-vendor panel doesn't turn its wire into a parade.
       */
      inFlight: providers
        .filter((p) => {
          const a = byProvider.get(p.id);
          return a !== undefined && availabilityStatus(a) !== "none";
        })
        .slice(0, 3),
    });

    const market = MARKET_KINDS.map((kind) =>
      build(
        kind.id,
        kind.label,
        kind.id === "neocloud",
        PROVIDERS.filter((p) => p.kind === kind.id),
      ),
    );

    const selfIds = new Set(SELF_KINDS.map((k) => k.id));
    return [
      ...market,
      build(
        "self",
        "Your infrastructure",
        false,
        PROVIDERS.filter((p) => selfIds.has(p.kind)),
      ),
    ];
  }, [byProvider]);

  const { containerRef, registerNode, anchors, size } = useAnchors(gpuId);
  const sigma = anchors["sigma"];
  const workloads = anchors["workloads"];


  return (
    <section className="mx-auto max-w-7xl px-6 py-10">
      <BoardToolbar gpuId={gpuId} onSelectGpu={setGpuId} />

      {/* One source, one rank of edges, three panels. */}
      <div ref={containerRef} className="relative pt-12">
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          width={size.width}
          height={size.height}
          aria-hidden="true"
        >
          {/* Upper rank: workloads arriving at the control plane. Drawn in the
              site's blue rather than a status colour — this is the API surface,
              and it's up whatever the providers below are doing. Straight down
              the middle: both bands are full-width, so the two anchors already
              share an x and any routing would be invented. */}
          {sigma && workloads && (
            <g>
              <path
                d={edgePathVertical(workloads.bottom, sigma.top)}
                fill="none"
                stroke="var(--color-sigma)"
                strokeOpacity={0.3}
                strokeWidth={1.5}
                strokeLinejoin="round"
              />
              <path
                className="flow-packets"
                d={edgePathVertical(workloads.bottom, sigma.top)}
                fill="none"
                stroke="var(--color-sigma)"
                strokeOpacity={0.9}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* Lower rank: the control plane placing work with each group. */}
          {sigma &&
            panels.map((panel) => {
              const target = anchors[`panel:${panel.id}`];
              if (!target) return null;
              const d = edgePathVertical(sigma.bottom, target.top);
              const color = EDGE_COLOR[panel.status];
              return (
                <g key={panel.id}>
                  <path
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeOpacity={0.35}
                    strokeWidth={1.5}
                    strokeLinejoin="round"
                  />
                  <path
                    className="flow-packets"
                    d={d}
                    fill="none"
                    stroke={color}
                    strokeOpacity={1}
                    strokeWidth={2.5}
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
        </svg>

        {/* Chips ride above the wires but below the cards, so one passing a
            panel slides behind it rather than over its text. */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {/* Upper rank carries no provider marks: what travels here is a request
              for a GPU, and it hasn't been placed with anyone yet — a vendor logo
              on this segment would name a provider before the scheduling
              decision that picks one. The dashes alone carry it. */}
          {sigma &&
            panels.map((panel) => {
              const target = anchors[`panel:${panel.id}`];
              if (!target) return null;
              const d = edgePathVertical(sigma.bottom, target.top);
              // Travel is paced by distance, so a chip moves at the same speed
              // on every edge and the outer panels' longer runs simply take
              // longer. A shared duration would make the short hop crawl and the
              // long one look frantic.
              //
              // The keyframes spend only the first `CHIP_TRAVEL_FRACTION` of a
              // cycle travelling, so dividing by that fraction sizes the cycle
              // such that the travel segment itself lands at exactly
              // `FLOW_PX_PER_SEC`. The remainder of the cycle is an idle tail
              // that spaces the emissions out — it changes how often a chip is
              // emitted, not how fast it moves. (Adding a flat number of seconds
              // here would *not* be neutral: it stretches the travel segment
              // along with the tail, and the chip would fall behind the dashes.)
              const travel = edgeLength(sigma.bottom, target.top) / FLOW_PX_PER_SEC;
              const seconds = travel / CHIP_TRAVEL_FRACTION;
              return (
                <FlowChips
                  key={panel.id}
                  path={d}
                  providers={panel.inFlight}
                  duration={seconds}
                />
              );
            })}
        </div>

        {/* Three bands, top to bottom: demand, control plane, supply.
            The gaps are the runs the wires travel, and they're sized by what
            each carries rather than kept equal. The upper gap is short — one
            straight line with nothing on it, so length there is just dead
            space. The lower gap has to fit a rank of edges fanning out to three
            panels plus the provider marks riding them, so it gets roughly twice
            as much room. */}
        <div className="relative flex flex-col items-center">
          <WorkloadBand ref={registerNode("workloads")} />

          <div className="mt-11">
            <SigmaPlatform ref={registerNode("sigma")} />
          </div>

          {/* 4 columns: the long neocloud roster takes two, the short panels one each. */}
          <div className="mt-20 grid w-full items-start gap-5 md:grid-cols-4">
            {panels.map((panel) => (
              <div
                key={panel.id}
                ref={registerNode(`panel:${panel.id}`)}
                className={`rounded-lg border border-line bg-ink-soft/60 p-3 shadow-[0_1px_2px_rgba(18,28,48,0.03)] ${
                  panel.wide ? "md:col-span-2" : ""
                }`}
              >
                {/* Heading reads as a field label: mono, tracked out, ruled off
                    from the rows below. */}
                <div className="mb-3 flex items-center justify-between gap-2 border-b border-line/80 px-0.5 pb-2.5">
                  <div className="flex items-center gap-2">
                    {/* Ringed rather than bare: this dot terminates an edge, so
                        it should look like a landing point. */}
                    <span
                      className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center"
                      aria-hidden="true"
                    >
                      <span
                        className={`absolute h-3.5 w-3.5 rounded-full ${PANEL_GLOW[panel.status]}`}
                      />
                      <span className={`h-1.5 w-1.5 rounded-sm ${PANEL_DOT[panel.status]}`} />
                    </span>
                    <span className="font-mono text-[11px] font-medium tracking-[0.1em] text-ink-strong uppercase">
                      {panel.label}
                    </span>
                    <span className="sr-only">— {GROUP_LABEL[panel.status]}</span>
                  </div>
                  <div className="font-mono text-[11px] text-mute/70 tabular-nums">
                    {panel.providers.length}
                  </div>
                </div>

                {/* The wide panel goes two-up so panel heights stay comparable. */}
                <div className={`grid gap-1 ${panel.wide ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                  {panel.providers.map((provider) => {
                    const a = byProvider.get(provider.id);
                    if (!a) return null;
                    return <ProviderCard key={provider.id} provider={provider} availability={a} />;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
