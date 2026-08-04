import { WORKLOADS } from "@/lib/data";

/**
 * One pass of the highlight, in seconds. Each label lights for a fraction of
 * this, so the whole cycle is one sweep across the band.
 *
 * 5.5s is slow on purpose. The wires below run at 48px/s and emit a chip every
 * few seconds, and a scan up here that kept that pace would read as a second
 * animation competing with them rather than as the demand feeding them. Slow
 * enough that you notice it once and then read past it.
 *
 * Raised from 4.5s: with the lit window narrowed to 28% of the cycle, a shorter
 * period put the highlight back on `Training` before the previous pass had
 * cleared `Notebooks`, which reads as a loop restarting rather than a sweep. At
 * 5.5s there's a visible dark beat between passes, and the beat is what makes it
 * feel deliberate.
 */
const SCAN_SECONDS = 5.5;

/**
 * The top band of the stack: what you point at v-sigma.
 *
 * Deliberately the lightest of the three layers — no fill, a dashed border, and
 * muted type. It's the demand side, and the page's subject is the supply side
 * below it; a solid panel here would compete with the provider rosters for
 * attention. The dashes also read as "your side of the boundary", which is what
 * it is.
 *
 * One line, five labels, nothing under them. Both a prose gloss and the
 * Kubernetes kind have been tried as a second field per item and both went — see
 * `WORKLOADS` in `lib/data.ts` for why.
 *
 * A highlight travels the row left to right, one label at a time. The band was
 * the only static layer in a diagram whose whole subject is work in flight: the
 * wires pulse, the chips ride them, the status dots breathe, and the demand side
 * that supposedly *causes* all of it sat still. The scan says these are arriving,
 * and it aims at the same reading the wires give — something is being placed
 * right now.
 *
 * Colour only. See `workload-scan` in globals.css for why nothing here moves or
 * fades.
 */
export function WorkloadBand({ ref }: { ref: (el: HTMLElement | null) => void }) {
  return (
    <div ref={ref} className="rounded-lg border border-dashed border-line px-5 py-3">
      {/* One centred row: label, rule, then the workloads. Centred because the
          wire leaves from the band's middle, and stacking the label above would
          make this the tallest thing in the layout for the least information. */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5">
        <span className="font-mono text-[12px] font-medium tracking-[0.14em] whitespace-nowrap text-mute uppercase">
          Workloads
        </span>

        {WORKLOADS.map((workload, i) => (
          <span key={workload.id} className="flex items-center gap-3">
            {/* The same divider before every item, including the first — one
                separator doing one job, so the band reads as a row of fields.

                Two earlier versions were too faint to see at 1×: a `·` at
                mute/40 (a 12px middle dot at 40% has almost no ink), then a
                `bg-line` rule — but `line` is #d7dfec, which against this band's
                near-white has barely any contrast at 1px wide. `mute/55` is a
                grey with somewhere to fall from, so a single pixel of it actually
                registers. Height went 3.5 → 4 for the same reason: at 1px wide,
                length is the only other lever on how much ink there is. */}
            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-mute/55" />
            {/* `text-ink-strong/85` is still the resting colour and still lives
                here rather than in the keyframe's business — the class is what
                the label looks like with animation off (reduced motion, or CSS
                not yet applied), and the keyframe restates the same value as the
                colour it settles to. */}
            <span
              className="workload-scan font-mono text-[12px] font-medium tracking-tight whitespace-nowrap text-ink-strong/85"
              style={
                {
                  "--workload-cycle": `${SCAN_SECONDS}s`,
                  // Each label starts one fifth of a cycle later than the one
                  // before it, so the lit label walks left to right in DOM order.
                  //
                  // The offset is subtracted from a full cycle rather than being
                  // applied as a bare negative, which is what this was and it ran
                  // the sweep *backwards*: a negative delay starts an animation
                  // already partway through, so `-i × step` put later items
                  // further ahead and `Notebooks` lit first. Negating the whole
                  // expression keeps the useful half of that trick — every label
                  // is mid-cycle on first paint, so the band never sits dark
                  // waiting to start — while restoring the intended direction.
                  //
                  // `i - length` is always negative, so the value stays a negative
                  // delay: item 0 gets a full cycle back, item 4 gets one fifth.
                  "--workload-delay": `${(SCAN_SECONDS * (i - WORKLOADS.length)) / WORKLOADS.length}s`,
                } as React.CSSProperties
              }
            >
              {workload.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
