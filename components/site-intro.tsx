import type { ReactNode } from "react";
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
          AVAILABILITY — so an unlabelled one was the odd column out. Takes the
          mute-at-0.14em idiom the band and the legend use for a section label,
          rather than the panels' ink-strong, which marks a column of data.

          An h2 and not a span: this is the page's only real heading under the
          screen-reader h1, so the outline was flat without it. */}
      <h2 className="mb-7 text-center font-mono text-[11px] font-medium tracking-[0.14em] text-mute uppercase">
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
          <li
            key={title}
            className="flex flex-col gap-2.5 md:px-7 md:first:pl-0 md:last:pr-0"
          >
            <span className="flex items-center gap-2.5">
              {icon}
              <h3 className="font-mono text-[12px] font-medium tracking-[0.02em] text-ink-strong">
                {title}
              </h3>
            </span>
            {/* 1.7 leading, looser than `leading-relaxed`. At 13px in a 3-up
                column the lines are short, and short measures need more space
                between them to stop reading as a block. */}
            <p className="text-[13px] leading-[1.7] text-mute">{body}</p>
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
    body: "Annotations only for integration. The same experience as working with Kubernetes.",
    icon: (
      <IconTile>
        <KubernetesMark />
      </IconTile>
    ),
  },
  {
    title: "One API, Run Everywhere",
    body: "Hyperscalers, neoclouds and self-managed hardware behind a single interface.",
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
    icon: (
      <IconTile>
        <ForkGlyph />
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
 */
function Api({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-[12px] tracking-tight text-ink-strong/85">
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

/**
 * A branch off a trunk — the fork, hence public code.
 *
 * The three nodes are filled discs, not rings: an unfilled 1.6-radius circle at
 * 14px has a hole about a third of a pixel wide, which renders as a grey blur
 * rather than a ring. Solid dots stay crisp.
 */
function ForkGlyph() {
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
      {/* Trunk down the left, one branch leaving it toward the upper right. */}
      <path d="M4.4 5.2v5.6" />
      <path d="M4.4 8.4h4.2c.9 0 1.4-.5 1.4-1.4V5.6" />
      <circle cx="4.4" cy="3.6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="10" cy="3.6" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="4.4" cy="12.4" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
