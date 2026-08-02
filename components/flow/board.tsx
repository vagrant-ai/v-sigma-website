"use client";

import { useState } from "react";
import { DEFAULT_GPU } from "@/lib/data";
import { BoardToolbar } from "./board-toolbar";
import { FlowBoard } from "./flow-board";
import { GlobalView } from "./global-view";
import { ViewSwitch, type BoardView } from "./view-switch";

/**
 * The board and its controls.
 *
 * Owns both pieces of state so the toolbar renders once above whichever view is
 * showing. The GPU selection in particular has to live here rather than inside a
 * view: the two views are two readings of the same choice, so switching between
 * them must not reset which GPU you were looking at.
 */
export function Board() {
  const [gpuId, setGpuId] = useState(DEFAULT_GPU.id);
  const [view, setView] = useState<BoardView>("providers");

  return (
    // Tight to the header: the toolbar is a control strip, so it should read as
    // attached to the chrome above it rather than floating in the page. The
    // generous space belongs below it, around the diagram.
    <section className="mx-auto max-w-7xl px-6 pt-5 pb-10">
      <BoardToolbar
        gpuId={gpuId}
        onSelectGpu={setGpuId}
        views={<ViewSwitch view={view} onChange={setView} />}
      />

      {view === "providers" ? <FlowBoard gpuId={gpuId} /> : <GlobalView gpuId={gpuId} />}
    </section>
  );
}
