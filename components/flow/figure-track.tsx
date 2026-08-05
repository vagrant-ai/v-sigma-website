"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Minimum horizontal travel, in px, before a touch drag counts as a swipe.
 *
 * Below this a gesture is almost certainly a tap or the start of a vertical
 * scroll, and switching figures out from under either one is worse than doing
 * nothing.
 */
const SWIPE_PX = 48;

/**
 * How much more horizontal than vertical a drag has to be to count as a swipe.
 *
 * The whole point of this rewrite is that the page's vertical scroll belongs to
 * the reader, and on a touchscreen a scroll is also a drag — so an ambiguous
 * gesture has to resolve as a scroll, not as a switch.
 */
const SWIPE_RATIO = 1.4;

export type Figure = {
  /** One word, for the tab. */
  title: string;
  /**
   * The question the figure answers, in a phrase.
   *
   * Not displayed: it's the accessible name of the tab and of the fallback
   * heading. A one-word tab is legible precisely because the reader can see the
   * figure next to it, and a screen reader user can't — "Flow" on its own says
   * nothing, where "Flow: how it works" says what the other reader gets for free.
   */
  hint: string;
  node: React.ReactNode;
};

/**
 * The page's figures, side by side on a track the reader drives directly.
 *
 * One figure occupies the slot at a time; the labelled tabs beneath it, the arrow
 * keys and a horizontal swipe move between them. The page's own scroll is left
 * alone — scrolling goes down the page, and nothing else.
 *
 * The named tabs go *below* the figure, not above it. Above was tried: two mono
 * labels directly beneath a centred claim read as part of the claim — a second,
 * smaller headline — and the page's opening statement has to be the only thing in
 * that position. Below, the same row is a caption on the figure.
 *
 * There were also chevrons in the gutters either side of the figure, through eight
 * drawings: a bordered disc, a 44px disc with shadow and blur, a bare hairline
 * chevron, a chevron on a pale square, a solid blue chip, a shaft-with-head arrow,
 * a faded double chevron, and a single chevron at three weights. The drawings kept
 * failing for one reason, which only became clear across all of them: this page has
 * a single visual register — hairline borders, pale fills, mono micro-labels, small
 * blue marks — and a free-floating glyph in the gutter is the one mark on the page
 * with no relatives in it. So every weight was wrong in the same way at a different
 * size: light enough to belong and it vanished, heavy enough to find and it
 * outweighed the figure it pointed at. The tab row below *is* in that register, and
 * it already names both figures, which is more than an arrow can say. Cutting them
 * loses one thing worth naming — an arrow is the most conventional "there is more
 * this way" mark there is — and buys back the figure's full column width, which is
 * what the flow diagram was drawn at.
 *
 * This is the sixth arrangement of these two figures, and the fifth was the
 * instructive one. What each got wrong:
 *
 *   - A segmented `Flow`/`Map` switch. Half the page sat behind a control the
 *     reader had to notice and interpret, and the page lied about its length.
 *   - Both figures stacked in the document. Fixed discoverability by giving it
 *     up — the page grew very long, and two large figures in sequence read as
 *     two unrelated sections rather than two views of one selection.
 *   - A slide track with hover-driven edge rails. Compact and discoverable, but
 *     hover is not available on a touchscreen.
 *   - The map folded into the flow board as a filtered rank. Drew the tie
 *     properly, but at the cost of the map as a figure in its own right.
 *   - A pinned track the page's scroll drove. Everything was reachable by the
 *     one gesture every reader already performs, which was the appeal — but it
 *     took the scroll wheel hostage for ~1.8 screens, so the bottom of the page
 *     could not be reached without first being walked through the map. Scroll is
 *     how a reader leaves; a section that spends it is a section that won't let
 *     them.
 *
 * So the trigger moved off scroll and onto controls that say what they do. That
 * gives up the "no control to notice" property the pin had, and the way back is to
 * make the controls plural and conventional rather than clever: a labelled bar per
 * figure for the pointer and for anyone scanning for where they are, arrow keys for
 * the keyboard, a swipe for touch. Three affordances for one action, each the
 * obvious one for its input device.
 */
export function FigureTrack({ figures }: { figures: Figure[] }) {
  /** Which figure is in the slot. An index, not a fraction: nothing continuous
   *  drives this any more, so the track lands on a figure or it's mid-transition
   *  toward one. */
  const [index, setIndex] = useState(0);

  /**
   * Whether to use the track at all — false only for a reader who has asked for
   * reduced motion.
   *
   * Starts **true**, which is what the server renders. It started false for one
   * revision, on the reasoning that the stacked fallback is the safe thing to send
   * and the track can be switched on once the media query has been read. What that
   * actually produced was a visible flash on every load: the server's stack put
   * "How it works" and "Where it runs" on screen as headings, then hydration
   * replaced the whole thing with the track a frame later. A reader who refreshes
   * sees two words that aren't part of the design.
   *
   * Defaulting to the track means the first paint is the final layout and the only
   * correction is in the other direction — reduced-motion readers get one swap to
   * the stack, and asking for reduced motion is precisely asking not to be shown
   * transitions, so a stack appearing in place of a slide is the right end state
   * for them regardless of how it got there.
   *
   * The stack is still the fallback for no-JS: `figures` are rendered by this
   * component either way, so every figure is in the served markup and the page is
   * complete before hydration.
   */
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setEnabled(!reduced.matches);
    apply();
    reduced.addEventListener("change", apply);
    return () => reduced.removeEventListener("change", apply);
  }, []);

  /**
   * Move to a figure, wrapping at both ends.
   *
   * Clamping was tried first, back when edge arrows were the visible control, and
   * it meant one of the two was always dead — with exactly two figures, half the
   * pair. The arrows are gone but the wrap stays, because the arrow keys have the
   * same property: → at the last figure doing nothing is a key that silently
   * doesn't work.
   *
   * This is only defensible because the track is short and unordered: two views of
   * one selection, not a sequence with a beginning and an end. A long ordered set
   * would need the clamp back, since wrapping would hide that you'd reached the
   * end.
   */
  const go = (i: number) => setIndex((i + figures.length) % figures.length);

  /** Start of the current touch, or null between gestures. */
  const touch = useRef<{ x: number; y: number } | null>(null);

  if (!enabled) {
    return (
      <div className="space-y-16">
        {figures.map((figure) => (
          /* The unpinned fallback: every figure in the document, each under its
             own heading. This is what a reduced-motion reader gets and what the
             server renders, so it has to stand on its own rather than look like
             a degraded track. The headings do that work; without them a reader
             scrolling into a world map reads it as an unrelated section. */
          <section key={figure.title}>
            {/* The full phrase here, not the one-word tab label: a heading has the
                room, and standing alone above a figure it has to say what the
                figure is rather than name a tab that no longer exists. */}
            <h2 className="mb-6 font-mono text-[13px] font-medium tracking-[0.1em] text-ink-strong uppercase">
              {figure.hint}
            </h2>
            {figure.node}
          </section>
        ))}
      </div>
    );
  }

  return (
    /* `onKeyDown` on the container, not on a button: the arrow keys should work
       from anywhere inside the figure, including from a control within it, which
       is where a keyboard reader actually is. */
    <div
      className="relative"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") {
          go(index + 1);
        } else if (e.key === "ArrowLeft") {
          go(index - 1);
        } else {
          return;
        }
        // Only for the keys handled above, and only once one has moved the
        // track: ← and → are also how a reader moves the caret in a field or
        // steps a slider, so swallowing them unconditionally would break any
        // control a figure puts inside itself.
        e.preventDefault();
      }}
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        // Horizontal, and decisively so — see SWIPE_RATIO. A vertical drag is
        // the reader scrolling the page and must pass through untouched.
        if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return;
        go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* The viewport: `overflow-hidden` is what crops the off-screen figure, and
          it sits at the page's full column width. There was a `px-14` wrapper
          around it for several revisions, insetting the figure to open a lane for
          edge arrows — see the note above for why those are gone. With no arrows
          there is nothing to make room for, so the figure gets the whole column
          back, which is the width the flow diagram was drawn at.

          The crop has to land exactly on the panel edge. A `-mx-1 px-1` pair
          was tried here to give focus rings a pixel of room, and it widened the
          crop by 4px on each side — which is 4px of the *neighbouring* figure
          showing as a stray hairline down the edge of the one you're looking
          at. A ring clipped by a pixel is invisible; a fragment of another
          figure is not.

          The slot keeps one height for both figures — the taller one's, since
          a plain row of panels is as tall as its tallest child. That is
          deliberate and it's what stops the page moving when you switch: sizing
          the slot to each figure in turn was tried, and the ~60px difference
          between them meant everything below the track — the tabs, the features
          section, the footer — hopped up or down on every switch, and the tab
          you had just clicked slid out from under the pointer. A band of unused
          space under the shorter figure is a much smaller price than a page
          that rearranges itself when you look at it. */}
      <div className="overflow-hidden">
        {/* The track. Each panel is one panel-width wide and the whole thing
            slides by whole panels, so figure n sits at -n × 100%.

            A transition here, unlike the scroll-driven version — there the
            scroll position *was* the animation and a transition on top of it
            lagged the wheel. A button press is instantaneous and has no
            movement of its own, so the slide is the only thing that tells the
            reader the two figures are side by side rather than swapped in
            place.

            `items-start` so each figure hangs from the top of the slot. The
            shorter one would otherwise be centred in the taller one's height,
            which puts it a half-difference lower than the figure it replaced —
            the same jump the fixed height exists to prevent, just applied to
            the figure instead of the page. */}
        <div
          className="flex items-start transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {figures.map((figure, i) => (
            /* `w-full shrink-0` gives every panel exactly one track width,
               which is what makes the translate arithmetic above hold.

               Deliberately *not* `aria-hidden`/`inert` when off screen: it's
               real content, and the focus handler is what keeps that honest —
               focus moving into a panel brings that panel into the slot, so
               tabbing can never land on something invisible. */
            <div
              key={figure.title}
              className="w-full shrink-0"
              onFocus={() => setIndex(i)}
            >
              {figure.node}
            </div>
          ))}
        </div>
      </div>

      {/* The named switch, under the figure and on the page's central axis — the
          only visible control on the track now.

          `tablist`/`tab` markup, which it earns now: these switch which of two
          panels is shown, which is what a tab is. The equivalent row under the
          pinned track was `aria-hidden` decoration, because there the page's
          scroll was the only way to move and a row of buttons that did nothing
          would have been a lie. */}
      <div
        role="tablist"
        aria-label="Figure"
        className="mt-5 flex items-center justify-center gap-4"
      >
        {figures.map((figure, i) => (
          /* A rule and its word, not a pill. The pill was a heavier object than
             this row should be — two filled capsules read as a button group
             competing with the figure, where a rule under a word reads as a
             caption that happens to be clickable, which is what the page wants
             here. The bar carries selection: it lengthens and takes the site's
             blue, so the state is legible without a fill.

             Both words stay legible either way. The version of this under the
             pinned track labelled only the *current* figure and left the other a
             bare 12px dash — so the one thing the row has to say, that there is
             another figure and here is its name, was the thing it left out. */
          <button
            key={figure.title}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`${figure.title}: ${figure.hint}`}
            onClick={() => go(i)}
            className="group/tab flex cursor-pointer items-center gap-2 rounded-full px-2 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sigma"
          >
            <span
              className={`h-[3px] rounded-full transition-all duration-200 ${
                i === index ? "w-7 bg-sigma" : "w-3 bg-line group-hover/tab:bg-mute/50"
              }`}
            />
            <span
              className={`font-mono text-[11px] tracking-[0.14em] uppercase transition-colors duration-200 ${
                i === index
                  ? "text-sigma"
                  : "text-mute/45 group-hover/tab:text-ink-strong"
              }`}
            >
              {figure.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
