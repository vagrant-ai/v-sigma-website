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
export function SigmaPlatform({
  ref,
  children,
}: {
  ref: (el: HTMLElement | null) => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      ref={ref}
      className="relative rounded-lg border border-sigma/45 bg-surface px-5 py-3 shadow-[0_1px_2px_rgba(18,28,48,0.04),0_10px_28px_-14px_rgba(50,108,229,0.35)]"
    >
      {/* Tint as a layer, not a background: keeps the band opaque so the edges
          terminate at it rather than showing through. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-lg bg-sigma/[0.05]"
      />

      {/* The mark, the name, what it is — and then what it's placing. */}
      <div className="relative text-center">
        {/* Identity on the first line, with the Kubernetes badge alongside it —
            the badge is a property of the name, so it belongs on the name's
            line. Set off behind a rule so it stays distinct from the Kubernetes
            row below: that one is a place v-sigma schedules *to*, this is what
            it runs *on*. */}
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
          {/* The header's wordmark at 1.25×, and nothing else changed — same
              full-strength sigma on glyph and name, same 21:19 size ratio
              between them (the glyph rides slightly larger to match the
              wordmark's cap height), same -0.02em tracking, same gap. It was
              drifting on all four: a glyph faded to 55%, the name in the darker
              `sigma-ink` step, both at a flat 22px, and tighter tracking. A
              logotype should be one mark wherever it appears, differing only in
              scale.

              Grouped in its own flex so the glyph-to-name gap is the mark's
              own spacing rather than the row's, which also has to hold the
              badge beside it. */}
          <span className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="font-mono text-[21px] leading-none text-sigma select-none"
            >
              Σ
            </span>
            <span className="font-mono text-[19px] leading-none font-semibold tracking-[-0.02em] text-sigma">
              v-sigma
            </span>
          </span>
          <span aria-hidden="true" className="h-4 w-px bg-line" />
          <span className="flex items-center gap-1.5">
            <KubernetesMark />
            <span className="font-mono text-[11px] tracking-[0.14em] whitespace-nowrap text-mute uppercase">
              Kubernetes-native
            </span>
          </span>
        </div>

        {/* Tagline and picker share a line, separated by a rule rather than
            stacked in a ruled-off block of their own — that cost two rows of
            padding and a divider to say one short thing and hold one control,
            which made the band the tallest thing on the page.

            The picker belongs here at all because the diagram reads "workloads
            → v-sigma placing *this GPU* → who has it", and the control plane is
            what does the placing. Above the workload band it floated loose and
            implied the workloads came out of it; in the toolbar it read as a
            page setting rather than part of that sentence. */}
        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5">
          <span className="font-mono text-[11px] tracking-[0.14em] whitespace-nowrap text-mute uppercase">
            The Control Plane for GPUaaS
          </span>
          {children && (
            <>
              <span aria-hidden="true" className="h-3.5 w-px bg-sigma/25" />
              {children}
            </>
          )}
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
