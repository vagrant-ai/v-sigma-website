"use client";

export type BoardView = "providers" | "global";

/**
 * Two readings of one GPU selection: by provider, or by where it physically is.
 *
 * A segmented control rather than tabs — there are exactly two, both are peers,
 * and the segmented form makes the alternative visible instead of hiding it
 * behind a menu.
 */
export function ViewSwitch({
  view,
  onChange,
}: {
  view: BoardView;
  onChange: (view: BoardView) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="View"
      className="flex h-[30px] items-center gap-0.5 rounded-md border border-line bg-ink-soft/70 p-0.5"
    >
      <Tab
        active={view === "providers"}
        onClick={() => onChange("providers")}
        label="Providers"
        icon={<FlowGlyph />}
      />
      <Tab
        active={view === "global"}
        onClick={() => onChange("global")}
        label="Global"
        icon={<EarthGlyph />}
      />
    </div>
  );
}

function Tab({
  active,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-[11px] tracking-tight transition-colors ${
        active
          ? "bg-surface font-medium text-sigma-ink shadow-[0_1px_2px_rgba(18,28,48,0.06)]"
          : "text-mute hover:text-ink-strong"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

/** Earth — a globe with a meridian and two parallels. */
function EarthGlyph() {
  return (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6" />
      {/* Parallels bow toward the poles, so the sphere reads as a sphere. */}
      <path d="M2.4 6h11.2M2.4 10h11.2" />
      {/* One meridian, as an ellipse — the edge-on great circle. */}
      <ellipse cx="8" cy="8" rx="2.9" ry="6" />
    </svg>
  );
}

/**
 * The provider board — a grid of panels, which is the view's actual shape.
 *
 * Four plain cells: it reads at 14px, where the fan-out lines and the stacked
 * server rows both turned to mush, and it contrasts cleanly with the globe
 * beside it (straight edges against a circle).
 */
function FlowGlyph() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <rect x="2.4" y="2.4" width="5" height="5" rx="1.3" />
      <rect x="8.6" y="2.4" width="5" height="5" rx="1.3" />
      <rect x="2.4" y="8.6" width="5" height="5" rx="1.3" />
      <rect x="8.6" y="8.6" width="5" height="5" rx="1.3" />
    </svg>
  );
}
