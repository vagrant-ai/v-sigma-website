import { Board } from "@/components/flow/board";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* The slogan, as the page's real h1.

            This heading used to be `sr-only`, on the reasoning that the v-sigma
            band in the diagram already said what this is — true of a *label*, and
            the reason there's still no "v-sigma" wordmark here, but not of a
            claim. A slogan is the one thing the diagram can't draw.

            Its own section on the board's rail (`max-w-7xl px-6`), so the text
            aligns to the diagram's edges rather than to a narrower prose measure
            of its own.

            One line and nothing else. A tagline and a closing hairline both lived
            here and both went: the tagline said what the features section says
            twenty lines further down, and a rule under a single line of text
            closes something that never opened — it only put a second horizontal
            element ~20px above the view switch, which is the crowding `Board`
            dropped its own rule to avoid.

            `pt-8` (`pt-9` from `sm`), down from a flat `pt-14`. 56px of air under
            a 56px header read as a gap the page had forgotten to fill; at 32px the
            slogan sits close enough to the chrome to belong to it, while still
            clearing the header's bottom hairline by more than the hairline's own
            optical weight. Slightly more room from `sm` because the h1 is larger
            there too.

            Bottom padding stays small: `Board` opens with `pt-5` on the view
            switch, and the switch belongs to the figure below it, not to this. */}
        <section className="mx-auto max-w-7xl px-6 pt-8 pb-1 text-center sm:pt-9">
          {/* Orbitron, the brand face — this is the one piece of copy on the page
              that functions as a mark rather than as prose, which is exactly what
              vagrant.ai reserves Orbitron for. Everything else on the page is
              Roboto Mono.

              Four things this face forces, all of them about giving it room:

              - Tracking to 0 from -0.02em. Orbitron is wide by design; pulling it
                tighter closes the counters and reads as cramped.
              - 26/34px, not 30/38. Orbitron sets much wider than a text face at
                the same size, so 38px both wrapped at tablet widths and
                overpowered the diagram below it.
              - Weight 500, not 600. Orbitron's strokes are near-uniform and its
                bowls are squared, so it gains apparent weight faster than a
                humanist face does — at 600 a 34px line of it reads as a heavy
                slab. 500 keeps the mark quality without the density.
              - Leading 1.3, not 1.2. This line wraps on any narrow screen, and
                Orbitron's caps are tall relative to its em; at 1.2 the two lines
                nearly touch.

              `max-w-3xl` caps the measure so it breaks between the two clauses
              instead of stretching across a 7xl rail, and `text-balance` evens the
              halves when it does wrap rather than leaving "Spark Intelligence."
              alone on line two.

              The two nouns are coloured and the two verbs left in ink, so the
              accents land on what the line is *about* rather than on what it
              tells you to do. `sigma-ink` and not `sigma` for `Compute`: this is
              prose to be read, which is exactly the split those two tokens
              exist for. */}
          <h1 className="mx-auto max-w-3xl font-brand text-balance text-[26px] leading-[1.3] font-medium tracking-normal sm:text-[34px]">
            Scale <span className="text-sigma-ink">Compute</span>. Spark{" "}
            <span className="text-spark">Intelligence</span>.
          </h1>
        </section>

        {/* The intro prose lives inside Board, not here: it's shown only on the
            providers view, and Board owns which view is up. */}
        <Board />
      </main>

      <SiteFooter />
    </div>
  );
}
