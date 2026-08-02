import { availabilityStatus, type Availability, type Provider } from "@/lib/data";
import { ProviderIcon } from "./provider-icon";

const STATUS_STYLE = {
  healthy: { dot: "bg-healthy", glow: "bg-healthy/15" },
  tight: { dot: "bg-tight", glow: "bg-tight/15" },
  scarce: { dot: "bg-scarce", glow: "bg-scarce/15" },
  none: { dot: "bg-mute", glow: "bg-mute/15" },
} as const;

/**
 * The halo breathes on any provider that actually has capacity, so a live row
 * is distinguishable from a dead one without reading the colour. `none` stays
 * still — nothing is happening there, and pulsing it would say otherwise.
 */
const PULSES = { healthy: true, tight: true, scarce: true, none: false } as const;

/** Spoken only to screen readers — sighted users read the colour. */
const STATUS_LABEL = {
  healthy: "high availability",
  tight: "moderate availability",
  scarce: "low availability",
  none: "unavailable",
} as const;

/**
 * One provider row. Availability is carried by colour alone — providers don't
 * publish absolute inventory, so a bar or a count would imply precision we
 * don't have.
 */
export function ProviderCard({
  provider,
  availability,
  nodeRef,
}: {
  provider: Provider;
  availability: Availability;
  /** Only set when this row is an edge endpoint in the diagram. */
  nodeRef?: (el: HTMLElement | null) => void;
}) {
  const status = availabilityStatus(availability);
  const style = STATUS_STYLE[status];

  return (
    <div
      ref={nodeRef}
      className="group flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-2 transition-[border-color,box-shadow] hover:border-sigma/60 hover:shadow-[0_1px_2px_rgba(18,28,48,0.04),0_6px_16px_-8px_rgba(50,108,229,0.3)]"
    >
      {/* Status stays the leading mark: the colour is the headline, the icon
          only helps you find the row you were looking for. */}
      <span className="relative flex h-1.5 w-1.5 shrink-0 items-center justify-center">
        <span
          aria-hidden="true"
          className={`absolute h-3.5 w-3.5 rounded-full ${style.glow} ${
            PULSES[status] ? "status-pulse" : ""
          }`}
        />
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-sm ${style.dot}`} />
        <span className="sr-only">{STATUS_LABEL[status]}</span>
      </span>

      <ProviderIcon provider={provider} />

      <div className="min-w-0 flex-1">
        <div className="truncate font-mono text-[13px] font-medium tracking-tight text-ink-strong">
          {provider.name}
        </div>
        {provider.regions !== undefined && (
          <div className="flex items-center gap-1 font-mono text-[10px] text-mute/80 tabular-nums">
            <GlobeIcon />
            {provider.regions} regions
          </div>
        )}
      </div>

      {/* Rate and round-trip are omitted for capacity you run yourself —
          v-sigma has no rate to quote and no third-party API to time. */}
      <div className="shrink-0 text-right font-mono text-[10px] tabular-nums empty:hidden">
        {availability.pricePerHour !== undefined && (
          <div className="text-[11px] font-medium text-ink-strong/85">
            ${availability.pricePerHour.toFixed(2)}
          </div>
        )}
        {availability.responseMs !== undefined && (
          <div className="text-mute/80">
            <span className="sr-only">response time </span>
            {availability.responseMs}ms
          </div>
        )}
      </div>
    </div>
  );
}

/** Globe — marks the provider's regional reach. */
function GlobeIcon() {
  return (
    <svg
      className="h-3 w-3 shrink-0 opacity-70"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      aria-hidden="true"
    >
      <circle cx="6" cy="6" r="4.5" />
      <path d="M1.5 6h9" />
      <ellipse cx="6" cy="6" rx="2.2" ry="4.5" />
    </svg>
  );
}
