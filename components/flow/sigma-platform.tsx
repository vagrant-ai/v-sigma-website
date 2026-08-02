import { brandMark } from "@/lib/brand-marks";

/**
 * The v-sigma layer — the middle band of the stack, between the workloads above
 * and the capacity below.
 *
 * Sized to its content and centred, not stretched to the width of the provider
 * grid below. The stack already reads as layers from the vertical order and the
 * wires between them; matching the widest band's width only makes the two upper
 * layers into long, sparse strips.
 *
 * Pale and flat like everything else — white surface, hairline border, brand
 * blue as tint only. It leads by being the one band with a saturated border and
 * a sigma-tinted shadow, not by a different treatment.
 */
export function SigmaPlatform({ ref }: { ref: (el: HTMLElement | null) => void }) {
  return (
    <div
      ref={ref}
      className="relative rounded-lg border border-sigma/45 bg-surface px-7 py-4 shadow-[0_1px_2px_rgba(18,28,48,0.04),0_10px_28px_-14px_rgba(50,108,229,0.35)]"
    >
      {/* Tint as a layer, not a background: keeps the band opaque so the edges
          terminate at it rather than showing through. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg bg-sigma/[0.05]"
      />

      {/* Just the mark, the name, and what it is — centred on the band. The GPU
          and the target count are already on the page (the picker above, the
          per-panel counts below), so repeating them here only adds clutter. */}
      <div className="relative text-center">
        {/* Identity on the first line, with the Kubernetes badge alongside it —
            the badge is a property of the name, so it belongs on the name's
            line. Set off behind a rule so it stays distinct from the Kubernetes
            row below: that one is a place v-sigma schedules *to*, this is what
            it runs *on*. */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          <span
            aria-hidden="true"
            className="font-mono text-[22px] leading-none text-sigma/55 select-none"
          >
            Σ
          </span>
          <span className="font-mono text-[22px] leading-none font-semibold tracking-[-0.03em] text-sigma-ink">
            v-sigma
          </span>
          <span aria-hidden="true" className="h-4 w-px bg-line" />
          <span className="flex items-center gap-1.5">
            <KubernetesMark />
            <span className="font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute uppercase">
              Kubernetes-native
            </span>
          </span>
        </div>

        <div className="mt-2 font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-mute uppercase">
          The Control Plane for GPUaaS
        </div>
      </div>
    </div>
  );
}

/**
 * The Kubernetes helm, in its own brand blue — the same vendored path the
 * provider rows use, so there is one copy of the logo on the page.
 */
function KubernetesMark() {
  const mark = brandMark("kubernetes");
  if (!mark) return null;
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox={mark.viewBox}
      fill={mark.color}
      fillRule="evenodd"
      aria-hidden="true"
    >
      {mark.paths.map((path) => (
        <path key={typeof path === "string" ? path : path.d} d={typeof path === "string" ? path : path.d} />
      ))}
    </svg>
  );
}
