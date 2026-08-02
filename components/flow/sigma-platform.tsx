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

      {/* The Kubernetes helm, pinned to the top-right corner.

          The words "Kubernetes-native" are gone from beside the wordmark; the
          logo alone now carries that claim, the way a "built on" mark usually
          does. It's a badge on the band rather than an item in the name's row —
          absolutely positioned, so the identity line is left centred on the
          wordmark alone instead of being pushed off-centre by a glyph sitting
          next to it.

          Inset to `top-2.5 right-3`, inside the band's `py-3 px-5` padding, so it
          sits within the rounded corner rather than on it.

          `title` and a `<title>`-less svg would leave it unlabelled once the text
          is gone, so the claim moves to `aria-label` on the wrapper — the mark is
          now the only thing saying "Kubernetes", and that has to survive for a
          screen reader. */}
      <span
        role="img"
        aria-label="Kubernetes-native"
        className="absolute top-2.5 right-3 z-10 flex items-center"
      >
        <KubernetesMark />
      </span>

      {/* The mark, the name — and then what it's placing. */}
      <div className="relative text-center">
        {/* The header's wordmark at 1.25×, and nothing else changed — same
            full-strength sigma on glyph and name, same 21:19 size ratio between
            them (the glyph rides slightly larger to match the wordmark's cap
            height), same -0.02em tracking, same gap. It was drifting on all four:
            a glyph faded to 55%, the name in the darker `sigma-ink` step, both at
            a flat 22px, and tighter tracking. A logotype should be one mark
            wherever it appears, differing only in scale — including the face:
            Orbitron on the name, matching the header and vagrant.ai's `.brand`,
            with tracking at 0 for the same reason it is up there.

            Padded on both sides by the width of the corner badge, so the wordmark
            stays optically centred in the band rather than centred in the space
            the badge leaves over. Symmetric — pad one side only and the centring
            is fixed at the cost of the text no longer being centred on the band
            itself. */}
        <div className="flex items-center justify-center gap-2 px-5">
          <span
            aria-hidden="true"
            className="font-mono text-[21px] leading-none text-sigma select-none"
          >
            Σ
          </span>
          <span className="font-brand text-[19px] leading-none font-semibold tracking-normal text-sigma">
            v-sigma
          </span>
        </div>

        {/* The picker, on its own second line.

            A tagline ("The Control Plane for GPUaaS") used to share this row,
            behind a hairline. It's gone from the page entirely — the features
            section below the diagram already says what v-sigma is — leaving this
            band with just identity and the control, which is all a node in a
            diagram needs.

            The picker belongs here at all because the diagram reads "workloads
            → v-sigma placing *this GPU* → who has it", and the control plane is
            what does the placing. Above the workload band it floated loose and
            implied the workloads came out of it; in the toolbar it read as a
            page setting rather than part of that sentence.

            `mt-1` and no wrap handling: one item can't wrap, and with the tagline
            gone the row is only as wide as the control itself. */}
        {children && <div className="mt-1 flex items-center justify-center">{children}</div>}
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
