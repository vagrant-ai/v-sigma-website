import { brandMark } from "@/lib/brand-marks";
import type { Provider } from "@/lib/data";
import { ProviderMark } from "./provider-icon";

/**
 * Provider marks riding the edge out of v-sigma toward their own panel, each
 * one a request in flight to that vendor.
 *
 * Carrying the real logos rather than a generic packet makes the diagram say
 * something true: this edge ends at RunPod and Kubernetes and CoreWeave, and
 * you can see which. Each chip is drawn in the vendor's own brand colour, as
 * the row tiles are — the edge stroke already carries the group's availability,
 * so tinting the marks to match it would throw away the identity that is the
 * whole point of showing a logo.
 *
 * Rendered as an HTML overlay rather than as SVG children: `offset-path` is
 * reliable on HTML boxes across browsers, whereas on SVG elements the
 * coordinate system depends on `transform-box` support. The overlay is exactly
 * the diagram container's size, so the SVG's user units and the CSS pixels here
 * are the same numbers — the very `d` string the stroke uses can be handed to
 * `path()` unchanged.
 */
export function FlowChips({
  path,
  providers,
  duration,
}: {
  /** The edge's `d`, shared with the drawn stroke so chips track the wire. */
  path: string;
  /** Who's in flight on this edge, one chip each. */
  providers: Provider[];
  /** Seconds for one end-to-end pass. */
  duration: number;
}) {
  return (
    <>
      {providers.map((provider, i) => (
        <span
          key={provider.id}
          className="flow-chip absolute top-0 left-0 flex h-4 w-4 items-center justify-center rounded-[5px] border border-line bg-surface shadow-[0_1px_3px_rgba(18,28,48,0.12)]"
          style={
            {
              // Quoted for `path()`, which takes a string, not a bare token.
              // Single quotes so the value survives being written into a
              // double-quoted `style` attribute during SSR.
              "--flow-path": `path('${path}')`,
              "--flow-dur": `${duration}s`,
              // Spread evenly through one loop rather than at random: a stray
              // clump reads as a stall. Negative delays start them mid-flight,
              // so the edge is populated on first paint instead of filling up.
              "--flow-delay": `${(-duration * i) / providers.length}s`,
              // The vendor's own hue, as on its row tile. Self-managed kinds
              // have no brand colour, so they ride in the site's blue.
              color: brandMark(provider.id)?.color ?? "var(--color-sigma)",
            } as React.CSSProperties
          }
        >
          {/* A tile, not a bare mark: the marks are many different colours, and
              several are near-white at the edges. A card behind them keeps every
              chip legible over both the wire and the page wash. */}
          <ProviderMark provider={provider} className="h-2.5 w-2.5" />
        </span>
      ))}
    </>
  );
}
