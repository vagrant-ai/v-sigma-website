import { WORKLOADS } from "@/lib/data";

/**
 * The top band of the stack: what you point at v-sigma.
 *
 * Deliberately the lightest of the three layers — no fill, a dashed border, and
 * muted type. It's the demand side, and the page's subject is the supply side
 * below it; a solid panel here would compete with the provider rosters for
 * attention. The dashes also read as "your side of the boundary", which is what
 * it is.
 */
export function WorkloadBand({ ref }: { ref: (el: HTMLElement | null) => void }) {
  return (
    <div ref={ref} className="rounded-lg border border-dashed border-line px-5 py-3">
      {/* One centred row: label, rule, then the workloads. Centred because the
          wire leaves from the band's middle, and stacking the label above would
          make this the tallest thing in the layout for the least information. */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <span className="font-mono text-[11px] font-medium tracking-[0.14em] whitespace-nowrap text-mute uppercase">
          Workloads
        </span>
        <span aria-hidden="true" className="h-3.5 w-px bg-line" />

        {WORKLOADS.map((workload) => (
          <span key={workload.id} className="flex items-baseline gap-1.5">
            <span className="font-mono text-[11px] font-medium tracking-tight text-ink-strong/85">
              {workload.label}
            </span>
            <span className="font-mono text-[9px] whitespace-nowrap text-mute/70">
              {workload.detail}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
