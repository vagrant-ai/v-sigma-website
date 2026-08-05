"use client";

import { useState } from "react";
import { SiteIntro } from "@/components/site-intro";
import { DEFAULT_GPU } from "@/lib/data";
import { FigureTrack } from "./figure-track";
import { FlowBoard } from "./flow-board";
import { GlobalView } from "./global-view";

/**
 * The page's two figures, side by side on a track the reader drives.
 *
 * The flow diagram is first — it's the page's opening statement, and the map is a
 * property of the arrangement it draws, so the map only means anything once that
 * arrangement has been seen.
 *
 * They were stacked vertically before this, which worked and cost a screen of page
 * length: two figures in sequence, ~1700px of section. Side by side in one slot
 * spends none, and the slide is what says "two views of one thing" where vertical
 * sequence said "two sections" — which is why the map needed a heading to explain
 * itself when it was stacked and doesn't need one here.
 *
 * The track was driven by the page's scroll for one revision, which read well and
 * was wrong: it pinned the section for nearly two screens, so the bottom of the page
 * could not be reached without being walked through the map first. Scroll now does
 * only what it says — it goes down the page — and the switch has its own controls.
 *
 * `FigureTrack` owns those controls and the fallback; see its doc comment for the
 * five earlier arrangements this is a response to, and for what it degrades to when
 * the reader has asked for reduced motion.
 *
 * Owns the GPU selection, which is the only state here. Both figures read it, so
 * choosing an H100 in the diagram redraws the map to match — and on a track where the
 * two are adjacent that's visible rather than an invariant taken on trust. It stays at
 * this level because `Board` is the client boundary: `page.tsx` is a server component,
 * and the slogan arrives as `heading` for the same reason — static markup passed down
 * rather than re-declared in a client tree.
 */
export function Board({ heading }: { heading: React.ReactNode }) {
  const [gpuId, setGpuId] = useState(DEFAULT_GPU.id);

  return (
    // No bottom padding: `SiteIntro` brings its own top gap, and padding here would
    // open a dead band between the two.
    <section className="mx-auto max-w-7xl px-6 pt-10 sm:pt-12">
      {/* The slogan, alone on the page's central axis. It used to share this row
          with the view switch, which took four attempts to place and never really
          worked: level with the claim it read as a second item in the headline,
          centred below it read as a heading for the diagram, and pushed to the right
          edge it was the one object off the axis everything else is built on. With
          the switch gone the row is what it should always have been — one claim,
          centred, nothing competing with it. */}
      {heading}

      {/* The gap from the claim to the figure. This has been both too big and too
          small: `mt-16` under the stacked layout left the figure adrift from the
          claim, `mt-10` closed that and then read as crowded once the figure was a
          single bordered card rather than a loose diagram — a card that near the
          headline looks attached to it, so the claim stops being a statement and
          starts being a caption on the figure. `mt-14`/`sm:mt-16` gives the claim
          room to be read on its own before the figure starts. */}
      <div className="mt-14 sm:mt-16">
        <FigureTrack
          figures={[
            /* One word each. These were sentences — "How it works" and "Where it
               runs" — which is the right length for a heading above a figure and
               the wrong length for a tab: two phrases side by side have to be
               read to be told apart, where two nouns are distinguishable at a
               glance, and a tab is a thing you glance at. The sentences also
               described the *page*, not the figures, so they were doing a job the
               slogan above already does.

               "Flow" and "Map" — each naming the *kind of drawing* it switches to,
               which is the pair that tells a reader what they'd get. "Global" was
               tried for the second and is worse in two ways: it describes a
               property of the content rather than the figure, and it's an
               adjective where the other is a noun, so the two didn't read as
               alternatives of one thing. "Map" also happens to be the shortest
               true word for it, which matters in a row this small. */
            {
              title: "Flow",
              /** Read by a screen reader in place of the one-word tab label. */
              hint: "How it works",
              node: <FlowBoard gpuId={gpuId} onSelectGpu={setGpuId} />,
            },
            {
              title: "Map",
              hint: "Where it runs",
              node: <GlobalView gpuId={gpuId} onSelectGpu={setGpuId} />,
            },
          ]}
        />
      </div>

      {/* The pitch, after the track. It used to be conditional on which view
          was up — the map was behind a toggle, and a reader switching views didn't
          want to scroll past the pitch again. Nothing to condition on now: the track
          holds both figures in one slot, so this simply follows them. */}
      <SiteIntro />
    </section>
  );
}
