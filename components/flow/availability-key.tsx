/** The availability scale, high → low, so the key reads as one ramp. */
const SCALE = [
  ["bg-healthy", "high"],
  ["bg-tight", "moderate"],
  ["bg-scarce", "low"],
] as const;

/**
 * What the colours mean.
 *
 * Lives with the diagram rather than in the toolbar above it. It was a bordered
 * chip up there, sized to match the picker and the switch, which lined the bar
 * up neatly but put a static key in a row of things you can click — and left it
 * a long way from the dots it explains. As a caption it sits next to its
 * subject and the toolbar holds only controls.
 */
export function AvailabilityKey() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span className="font-mono text-[9px] tracking-[0.14em] whitespace-nowrap text-mute/60 uppercase">
        Availability
      </span>
      {SCALE.map(([dot, label]) => (
        <span
          key={label}
          className="flex items-center gap-1.5 font-mono text-[10px] whitespace-nowrap text-mute"
        >
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-sm ${dot}`} />
          {label}
        </span>
      ))}
    </div>
  );
}
