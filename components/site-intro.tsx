import type { ReactNode } from "react";
import { GitHubMark } from "@/components/github-mark";
import { brandMark } from "@/lib/brand-marks";
import { NEBULA } from "@/lib/links";

/**
 * The three features, below the diagram.
 *
 * The diagram shows the shape of the thing — workloads in, providers out — but
 * not what it does for you. This says that, in three cells and no more: there
 * was a heading and a problem statement above them, and the diagram had already
 * made the same point without the paragraph.
 *
 * Set as three ruled columns, not cards and not a bordered band. Both of those
 * repeated the provider panels' idiom — border, surface, radius, and in the card
 * version a hover lift that led nowhere — directly beneath the panels, so the
 * lightest content on the page arrived in its heaviest treatment. Hairlines
 * between the columns are enough to say "three of these"; the section's top rule
 * and the label do the rest.
 *
 * One sentence each. These are read on the way past, not studied.
 *
 * Copy stays inside what Nebula's README actually claims: no numbers, no
 * superlatives, and no claim about scale or customers.
 */
export function SiteIntro() {
  return (
    // No rail of its own: this renders inside the board's section, which already
    // sets the width and the gutters.
    //
    // A rule to divide the diagram from the features. Without it the cards read
    // as a fourth column of the provider board — same border, same surface, same
    // radius — when they're a different kind of thing entirely: the diagram is
    // the product's shape, these are claims about it.
    <section className="mt-8 border-t border-line/70 pt-8 pb-4">
      {/* Every other group on the page is labelled — WORKLOADS, HYPERSCALERS,
          AVAILABILITY — so an unlabelled one was the odd column out.

          Ink-strong, not the mute grey those labels use. Mute marks a caption on
          a figure, which is what WORKLOADS and AVAILABILITY are; this is the
          page's one section heading, and set in the caption colour it read as a
          fourth caption. Keeps the wide 0.14em tracking, so it's still legible as
          a label rather than as a title — ink-strong at 0.14em is a step the page
          didn't already use for something else.

          An h2 and not a span: this is the page's only real heading under the
          screen-reader h1, so the outline was flat without it.

          14px, and that number is set by the page's label scale rather than
          picked. Every uppercase label here lives in a 10–12px band — the panel
          headings (HYPERSCALERS, NEOCLOUDS) at 12px, WORKLOADS at 12, the
          AVAILABILITY key at 10 — so this heading has exactly two constraints: it
          must sit above the 12px panel headings it outranks, and it must stay
          inside the register those labels establish. 14 is the first step that
          does both.

          The sizes either side were both wrong, in opposite directions. 13 put it
          *below* the card titles it governs, so nothing said "heading". 15 and 18
          left the label band entirely: caps at 0.14em accumulate width fast, and
          past 14 they compound into something that reads as a second title
          competing with the 30px h1 rather than as a divider between sections.

          It shares 14px with the card titles below it and stays distinct anyway —
          those are sentence case at 0.02em tracking, this is caps at 0.14em. On
          this page the label register is carried by caps and tracking, not by
          size, which is exactly why size is the wrong lever to reach for here. */}
      <h2 className="mb-7 text-center font-mono text-[14px] font-medium tracking-[0.14em] text-ink-strong uppercase">
        Features
      </h2>

      {/* Rules between the columns and nothing else — no surface, no outer
          border, no radius. Boxed, this was the provider panels' exact treatment
          (white fill, same hairline, same radius) sitting directly beneath them,
          so the lightest content on the page wore its heaviest frame and read as
          a fourth panel. Unboxed it reads as page copy, which is what it is, and
          the weight below the diagram drops off instead of building.

          `divide-*` puts the rules *between* cells only, so there's no edge rule
          to fight the section's own top border — and cell bottoms can't go ragged
          when the three texts differ in length, since grid cells share a row
          height.

          One column straight to three, skipping a two-up step: `divide-x` keys
          off DOM order, not grid position, so at two columns the third cell would
          take a left rule despite starting a new row. Three features into two
          columns leaves a widow anyway. */}
      <ul className="grid gap-y-7 divide-line/80 md:grid-cols-3 md:gap-y-0 md:divide-x">
        {FEATURES.map(({ title, body, icon }) => (
          /* No hover state: these aren't links or controls, and the lift the
             cards had promised an interaction that didn't exist.

             Padding is horizontal only, and dropped on the outer edges so the
             first and last columns sit flush to the rail the diagram uses. With
             no fill to inset from, vertical padding was just space added to space
             the section margins already provide. */
          /* `gap-4` (16px) between the title row and the body, up from 10px. Two
             reasons it needed more than it looks like it should: the body dropped
             from 15px to 13px, and a smaller paragraph needs more air above it to
             stay a separate block rather than a continuation of the line above;
             and the body's 1.7 leading means its own lines sit ~22px apart, so at
             10px the title was closer to the first line of copy than that line was
             to the second. The gap above a block has to beat the leading inside
             it, or the title reads as part of the paragraph. */
          <li
            key={title}
            className="flex flex-col gap-4 md:px-7 md:first:pl-0 md:last:pr-0"
          >
            <span className="flex items-center gap-2.5">
              {icon}
              <h3 className="font-mono text-[14px] font-medium tracking-[0.02em] text-ink-strong">
                {title}
              </h3>
            </span>
            {/* 13px, down from 15. At 15 this body copy was set *larger* than the
                14px title above it, so each cell was upside down: the sentence
                you read second, and only in passing, carried more weight than the
                feature's name. Colour was doing the whole hierarchy on its own
                (mute against ink-strong) while size actively fought it.

                13 rather than 14, so the step is unambiguous — matched to the
                title it would read as one continuous block of text at two
                colours, which is roughly the problem it has now.

                `font-mono` is declared rather than left to inherit. It was
                inheriting `--font-sans` from `body`, which resolves to the same
                Roboto Mono stack — so the face was already identical to the
                workload labels and the card titles, but only because both tokens
                happen to point at one stack today. globals.css says that split
                may be redrawn, and if it ever is, this paragraph is the one piece
                of the section that would silently change face while everything
                around it held. Saying `font-mono` costs nothing and makes the
                match a declaration instead of a coincidence.

                Weight stays at the inherited 400, and that's the one thing here
                deliberately *unlike* the workload labels, which are 500. Those are
                labels — a label is a fixed token you scan for, and 500 is what
                makes one hold its own at 12px. This is a sentence you read, and
                its weight has a second job: it's the only thing separating the
                body from the 14px/500 title directly above it, since 13 against 14
                is barely a size step. At 500 each cell read flat — title and body
                in one voice — and `mute` grey at 500 is heavier than body copy
                should be at this size. Matching the band exactly was tried and is
                what showed that up.

                1.7 leading, looser than `leading-relaxed`. In a 3-up column the
                lines are short, and short measures need more space between them
                to stop reading as a block — more so now that the text is
                smaller. */}
            <p className="font-mono text-[13px] leading-[1.7] text-mute">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The three features, in the order they were given.
 *
 * Open source is one of them rather than a block of its own: it's a claim about
 * the product on the same footing as the other two, and pulling it out into its
 * own card made it read as a footnote or a badge instead.
 */
const FEATURES: { title: string; body: ReactNode; icon: ReactNode }[] = [
  {
    title: "Kubernetes Native",
    body: "GPU provisioning is as simple as defining Kubernetes labels.",
    icon: (
      <IconTile>
        <KubernetesMark />
      </IconTile>
    ),
  },
  {
    title: "One API, Run Everywhere",
    body: "Hyperscalers, Neoclouds and self-managed infrastructure behind a single interface.",
    icon: (
      <IconTile>
        <ConvergeGlyph />
      </IconTile>
    ),
  },
  {
    title: "Open Source",
    body: (
      <>
        Built on{" "}
        <a
          href={NEBULA.url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-ink-strong underline decoration-line underline-offset-2 transition-colors hover:text-sigma-ink hover:decoration-sigma/50"
        >
          {NEBULA.name}
        </a>
        , licensed <Api>Apache-2.0</Api>. Public, and open to contribution.
      </>
    ),
    /* The GitHub mark, the same glyph the header's repository link uses.
     *
     * Seven glyphs went in this slot before it. Six were rejected for saying
     * something adjacent rather than the thing itself:
     *
     * - A fork, twice. It really means "you may copy this", and it read as a
     *   worse-drawn version of the header's GitHub mark.
     * - An open padlock. A lock reads as *security* first, and an unlocked one at
     *   14px is a lock with an odd shackle — it can land as the opposite of the
     *   point.
     * - `</>`. Says "code", and all three cards here are about code. Marked the
     *   category, not the feature.
     * - Three nodes on a hub. Says "community" — a consequence of open source, not
     *   the thing — and repeated ConvergeGlyph's shape two cards to the left.
     * - A hand-drawn OSI keyhole in the site's line style. The right idea, but at
     *   14px an open ring around a small bore and flare resolves to an "i" in a
     *   circle. Verified in the browser.
     * - The real OSI keyhole, vendored from `simple-icons`. Legible, and correct —
     *   but it's the OSI's certification trademark, so it needed a caveat that
     *   using it claims the licence is open source and not that OSI endorsed us.
     *
     * The repetition with the header is the cost, and it's the smaller one: the
     * card's whole body is a link to that repository, so the mark names its
     * destination instead of illustrating an abstraction. Nothing to decode. */
    icon: (
      <IconTile>
        <GitHubMark className="h-3.5 w-3.5" />
      </IconTile>
    ),
  },
];

/**
 * An API noun inside prose — a kind, a licence, a resource name.
 *
 * Mono, because that's this page's whole convention for text that names
 * something exact rather than describing it: the GPU picker, the prices, the
 * latencies. Setting `Pod` and `Deployment` the same way is what makes the copy
 * read as technical rather than as marketing that happens to mention Kubernetes
 * — and it's a real signal, since these are the actual identifiers you'd type.
 *
 * Not a `<code>`: these are names in a sentence, not code you could run, and
 * `<code>` would say otherwise to a screen reader.
 *
 * Sized to the prose it sits in (13px), not a step above it. It was 14px against
 * 15px body copy, which read as roughly level; left at 14 once the body dropped
 * to 13 it would be visibly *larger* than the sentence containing it, which is
 * not what an inline noun should do. Darker ink and tighter tracking set it apart
 * — the same two levers the page uses everywhere else, and neither of them
 * disturbs the line.
 */
function Api({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[13px] tracking-tight text-ink-strong/85">
      {children}
    </span>
  );
}

/**
 * The tinted frame around each feature's glyph.
 *
 * Deliberately the same 24px rounded tile the provider rows use for a vendor
 * logo, at the same tint — it's the page's established way of saying "this is
 * the mark for the thing beside it". No hover variants: there's no `group` to
 * respond to now that the cells aren't cards.
 */
function IconTile({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-sigma/25 bg-sigma/8 text-sigma"
    >
      {children}
    </span>
  );
}

/**
 * The Kubernetes helm — the real mark, vendored in `brand-marks.ts`, not a
 * lookalike. Left in `currentColor` rather than its brand blue: at 14px inside a
 * tinted tile the two blues are near-identical, and inheriting keeps it in step
 * with the tile's hover.
 */
function KubernetesMark() {
  const mark = brandMark("kubernetes");
  if (!mark) return null;
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox={mark.viewBox}
      fill="currentColor"
      aria-hidden="true"
    >
      {mark.paths.map((path) => {
        const d = typeof path === "string" ? path : path.d;
        return <path key={d} d={d} />;
      })}
    </svg>
  );
}

/**
 * Three sources joining one trunk — the many-providers-one-API claim.
 *
 * Straight elbows rather than curves, and only three strokes. The first attempt
 * bent the outer arms as béziers into a single point; at 14px the curves and the
 * junction dot merged into a smudge. Right angles survive the size, which is the
 * same reason the diagram's own edges are drawn orthogonally.
 */
function ConvergeGlyph() {
  return (
    <svg
      className="h-3.5 w-3.5"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {/* Three stubs on the left, a spine collecting them, one line out. */}
      <path d="M2.6 3.4h2.4M2.6 8h2.4M2.6 12.6h2.4" />
      <path d="M5 3.4v9.2" />
      <path d="M5 8h8.4" />
    </svg>
  );
}
