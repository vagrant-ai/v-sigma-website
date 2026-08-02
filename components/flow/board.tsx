"use client";

import { useState } from "react";
import { SiteIntro } from "@/components/site-intro";
import { DEFAULT_GPU } from "@/lib/data";
import { FlowBoard } from "./flow-board";
import { GlobalView } from "./global-view";
import { ViewSwitch, type BoardView } from "./view-switch";

/**
 * The board and its view switch.
 *
 * Owns both pieces of state. The GPU selection in particular has to live here
 * rather than inside a view even though each view renders its own picker: the
 * two views are two readings of the same choice, so switching between them must
 * not reset which GPU you were looking at.
 *
 * Only the switch sits in the chrome up here. The picker moved down into the
 * views themselves — it belongs to the figure it drives, and the two controls
 * side by side left most of a full-width bar empty.
 */
export function Board() {
  const [gpuId, setGpuId] = useState(DEFAULT_GPU.id);
  const [view, setView] = useState<BoardView>("providers");

  return (
    // Tight to the header: this is a control strip, so it should read as
    // attached to the chrome above it rather than floating in the page. The
    // generous space belongs below it, around the diagram.
    <section className="mx-auto max-w-7xl px-6 pt-5 pb-10">
      <div className="flex justify-end border-b border-line/70 pb-3.5">
        <ViewSwitch view={view} onChange={setView} />
      </div>

      {view === "providers" ? (
        <>
          <FlowBoard gpuId={gpuId} onSelectGpu={setGpuId} />
          {/* Prose only on the providers view. It introduces the product, and
              the providers view is the landing view — on the map it would sit
              under a figure that's asking a different question, and a reader
              switching views doesn't want to scroll past the pitch again. */}
          <SiteIntro />
        </>
      ) : (
        <GlobalView gpuId={gpuId} onSelectGpu={setGpuId} />
      )}
    </section>
  );
}
