"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FEATURED_GPUS, GPUS, GPU_TIERS, searchGpus, type Gpu } from "@/lib/data";

/**
 * GPU selector: a dropdown that opens onto the popular list, with a search
 * box that widens the choice to the whole catalog.
 */
export function GpuPicker({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => GPUS.find((gpu) => gpu.id === selectedId) ?? GPUS[0],
    [selectedId],
  );

  const searching = query.trim().length > 0;
  const matches = useMemo(() => (searching ? searchGpus(query) : FEATURED_GPUS), [query, searching]);

  /** Search results bucketed by tier; the popular list stays unbucketed. */
  const groups = useMemo(() => {
    if (!searching) return [{ tier: { id: "popular", label: "Popular" }, gpus: FEATURED_GPUS }];
    return GPU_TIERS.map((tier) => ({
      tier,
      gpus: matches.filter((gpu) => gpu.tier === tier.id),
    })).filter((group) => group.gpus.length > 0);
  }, [searching, matches]);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Focus the search box whenever the menu opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
    else setQuery("");
  }, [open]);

  function choose(id: string) {
    onSelect(id);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Compact, and no `GPU` prefix. The label was there when this sat in a
          bare toolbar and needed to name itself; inside the v-sigma band the
          context is already given, so the prefix was three glyphs of padding
          around the one thing that matters — the model name.

          22px tall, down from 26, on `px-1.5` and `gap-1`. Every step is small
          because this is a real control at the centre of the diagram: 22px is
          about the floor for something clickable, and the row it sits in is the
          band's second line, so shaving its height shortens the band the wires
          anchor to. Below this, the next thing to give would be the memory chip
          or the caret, and both are load-bearing — the chip distinguishes an H100
          80GB from a 94GB, the caret is the only thing marking this as a menu
          rather than a static label.

          The `aria-label` carries the full reading, so nothing was lost to a
          screen reader by tightening the visible text. */}
      <button
        id="gpu-trigger"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`GPU: ${selected.name}, ${selected.memory}`}
        className={`flex h-[22px] items-center gap-1 rounded border bg-surface px-1.5 text-left transition-colors ${
          open ? "border-sigma/60" : "border-line hover:border-mute/50"
        }`}
      >
        <span className="font-mono text-[11px] leading-none font-medium tracking-tight text-ink-strong">
          {selected.name}
        </span>
        {/* Memory in a tint rather than beside the name in plain grey: at this
            size the two runs of mono ran together into one string, and the model
            is what you read first. */}
        <span className="rounded-sm bg-ink-soft px-1 py-px font-mono text-[9px] leading-none text-mute">
          {selected.memory}
        </span>
        <svg
          className={`-mr-0.5 h-2.5 w-2.5 shrink-0 text-mute transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M2.5 4.5 L6 8 L9.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* The menu, scaled to match the 22px trigger: 224px wide (was 256), a
          1.5px gap (was 2), and every inner step down one — search box, tier
          labels, rows, footer. A menu that stays at its old scale under a control
          you've shrunk reads as belonging to something else, and this one opens
          in the middle of the diagram, where a large panel covers the wires it's
          meant to be filtering.

          `max-h-64` (was 72) for the same reason: 256px of scroller under a 22px
          trigger was most of the diagram's height. */}
      {open && (
        <div className="absolute z-30 mt-1.5 w-56 overflow-hidden rounded-md border border-line bg-surface shadow-lg shadow-slate-900/10">
          <div className="border-b border-line p-1.5">
            <div className="relative">
              <svg
                className="pointer-events-none absolute top-1/2 left-2 h-3 w-3 -translate-y-1/2 text-mute"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="6.75" cy="6.75" r="4.75" />
                <path d="M10.5 10.5 L14 14" strokeLinecap="round" />
              </svg>
              {/* Placeholder shortened with the box: "Search all 47 GPUs…" no
                  longer fits at this width, and a truncated placeholder is worse
                  than a shorter one. The count still appears in the footer. */}
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search GPUs…"
                autoComplete="off"
                aria-label={`Search all ${GPUS.length} GPUs`}
                className="w-full rounded border border-line bg-ink-soft py-1 pr-1.5 pl-7 font-mono text-[12px] text-ink-strong placeholder:text-mute focus:border-sigma/60 focus:outline-none"
              />
            </div>
          </div>

          <div role="listbox" aria-label="GPU" className="max-h-64 overflow-y-auto p-1">
            {groups.length === 0 ? (
              <p className="px-2 py-2.5 font-mono text-[12px] text-mute">
                No accelerator matches “{query}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.tier.id} className="mb-0.5 last:mb-0">
                  <div className="px-1.5 pt-1 pb-0.5 font-mono text-[10px] tracking-wide text-mute uppercase">
                    {group.tier.label}
                  </div>
                  {group.gpus.map((gpu) => (
                    <GpuOption
                      key={gpu.id}
                      gpu={gpu}
                      selected={gpu.id === selectedId}
                      onChoose={choose}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {!searching && (
            <div className="border-t border-line bg-ink-soft/60 px-2.5 py-1.5 font-mono text-[10px] text-mute">
              Search to reach all {GPUS.length} accelerators
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One row in the menu.
 *
 * `py-1` on a 2-unit gap, down from 1.5 and 3: the rows are what set the menu's
 * height, so this is where scaling it down actually pays. Still ~26px tall, which
 * keeps a comfortable pointer target even though the trigger above is 22.
 */
function GpuOption({
  gpu,
  selected,
  onChoose,
}: {
  gpu: Gpu;
  selected: boolean;
  onChoose: (id: string) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onChoose(gpu.id)}
      className={`flex w-full items-center justify-between gap-2 rounded px-1.5 py-1 text-left transition-colors ${
        selected
          ? "bg-sigma/10 font-medium text-sigma-ink"
          : "text-mute hover:bg-ink-soft hover:text-ink-strong"
      }`}
    >
      <span className="font-mono text-[12px]">{gpu.name}</span>
      <span className="shrink-0 font-mono text-[10px] opacity-70">
        {gpu.vendor} · {gpu.memory}
      </span>
    </button>
  );
}
