"use client";

import { GpuPicker } from "./gpu-picker";

/**
 * The control bar above the board: what you're looking at on the left, how to
 * read it on the right.
 *
 * `views` is the slot for the view switcher — the provider board and the coming
 * global-distribution view are two readings of the same GPU selection, so the
 * picker sits outside the switcher and keeps its value across both. Left as a
 * slot rather than a hardcoded control so adding the second view doesn't mean
 * re-cutting this layout.
 */
export function BoardToolbar({
  gpuId,
  onSelectGpu,
  views,
}: {
  gpuId: string;
  onSelectGpu: (id: string) => void;
  views?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-line/70 pb-4">
      {/* The one control that changes everything below it, so it leads. */}
      <GpuPicker selectedId={gpuId} onSelect={onSelectGpu} />

      {views}

      {/* Pushed right, but as a labelled key rather than three loose words: at
          this distance from the diagram an unlabelled row of dots doesn't say
          what it's keying. */}
      {/* Same 30px height and radius as the picker and the switch, and the label
          gets the picker's `gpu` treatment, so all three read as one bar. */}
      <div className="ml-auto flex h-[30px] items-center gap-2 rounded-md border border-line bg-surface/70 px-2.5">
        <span className="font-mono text-[9px] tracking-[0.12em] whitespace-nowrap text-mute/70 uppercase">
          Availability
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-line" />
        {/* Ordered high → low so it reads as one scale. Compacted by dropping
            type size and tracking rather than by abbreviating: three words at
            full tracking made the key the widest control in the bar for the
            least information in it, but "mod" for moderate saves a few pixels
            at the cost of being a puzzle. */}
        <div className="flex items-center gap-2">
          {(
            [
              ["bg-healthy", "high"],
              ["bg-tight", "moderate"],
              ["bg-scarce", "low"],
            ] as const
          ).map(([dot, label]) => (
            <span
              key={label}
              className="flex items-center gap-1 font-mono text-[9px] tracking-[0.06em] whitespace-nowrap text-mute uppercase"
            >
              <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-sm ${dot}`} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
