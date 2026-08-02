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
      {/* Metrics match ViewSwitch and the legend — same radius, same 30px height
          — so the three controls in the toolbar read as one bar rather than as
          unrelated widgets that happen to be adjacent. */}
      <button
        id="gpu-trigger"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`GPU: ${selected.name}`}
        className={`flex h-[30px] items-center gap-2 rounded-md border bg-surface px-2.5 text-left transition-colors ${
          open ? "border-sigma/60" : "border-line hover:border-mute/50"
        }`}
      >
        <span className="font-mono text-[9px] tracking-[0.16em] text-mute/80 uppercase">gpu</span>
        <span className="font-mono text-[11px] font-medium tracking-tight text-ink-strong">
          {selected.name}
        </span>
        <span className="font-mono text-[10px] text-mute/70">{selected.memory}</span>
        <svg
          className={`h-2.5 w-2.5 shrink-0 text-mute transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M2.5 4.5 L6 8 L9.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-30 mt-2 w-64 overflow-hidden rounded-md border border-line bg-surface shadow-xl shadow-slate-900/12">
          <div className="border-b border-line p-2">
            <div className="relative">
              <svg
                className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-mute"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                aria-hidden="true"
              >
                <circle cx="6.75" cy="6.75" r="4.75" />
                <path d="M10.5 10.5 L14 14" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search all ${GPUS.length} GPUs…`}
                autoComplete="off"
                aria-label="Search GPUs"
                className="w-full rounded border border-line bg-ink-soft py-1.5 pr-2 pl-8 font-mono text-xs text-ink-strong placeholder:text-mute focus:border-sigma/60 focus:outline-none"
              />
            </div>
          </div>

          <div role="listbox" aria-label="GPU" className="max-h-72 overflow-y-auto p-1.5">
            {groups.length === 0 ? (
              <p className="px-2 py-3 font-mono text-xs text-mute">
                No accelerator matches “{query}”.
              </p>
            ) : (
              groups.map((group) => (
                <div key={group.tier.id} className="mb-1 last:mb-0">
                  <div className="px-2 pt-1.5 pb-1 font-mono text-[10px] tracking-wide text-mute uppercase">
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
            <div className="border-t border-line bg-ink-soft/60 px-3 py-2 font-mono text-[10px] text-mute">
              Search to reach all {GPUS.length} accelerators
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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
      className={`flex w-full items-center justify-between gap-3 rounded px-2 py-1.5 text-left transition-colors ${
        selected
          ? "bg-sigma/10 font-medium text-sigma-ink"
          : "text-mute hover:bg-ink-soft hover:text-ink-strong"
      }`}
    >
      <span className="font-mono text-xs">{gpu.name}</span>
      <span className="shrink-0 font-mono text-[10px] opacity-70">
        {gpu.vendor} · {gpu.memory}
      </span>
    </button>
  );
}
