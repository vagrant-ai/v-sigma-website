import { Board } from "@/components/flow/board";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* The slogan is passed *into* `Board` rather than rendered here in a
            section of its own.

            It shares a row with the view switch, and the switch is driven by state
            `Board` owns — so one of the two had to move. This direction is the
            cheaper one: the h1 is static markup and travels down as a prop, where
            lifting the view state up here would make the whole page a client
            component to position a control.

            It was its own `<section>` above `Board` until then, which is what put
            an empty band between the claim and the figure — and anything sitting
            in that band read as a heading for the diagram beneath it.

            The intro prose is inside `Board` for a related reason: it's shown only
            on the providers view, and `Board` knows which view is up. */}
        <Board heading={<Slogan />} />
      </main>

      <SiteFooter />
    </div>
  );
}

/**
 * The page's real h1.
 *
 * This heading used to be `sr-only`, on the reasoning that the v-sigma band in the
 * diagram already said what this is — true of a *label*, and the reason there's
 * still no "v-sigma" wordmark here, but not of a claim. A slogan is the one thing
 * the diagram can't draw.
 *
 * One line and nothing else. A tagline and a closing hairline both lived with it
 * and both went: the tagline said what the features section says twenty lines
 * further down, and a rule under a single line of text closes something that never
 * opened.
 *
 * Extracted from the markup above only because it's now passed as a prop, and a
 * sixty-line JSX expression inline in a prop is unreadable. It has no state and no
 * parameters; it's the same element it always was.
 */
function Slogan() {
  return (
    /* Orbitron, the brand face — this is the one piece of copy on the page that
       functions as a mark rather than as prose, which is exactly what vagrant.ai
       reserves Orbitron for. Everything else on the page is Roboto Mono.

       Four things this face forces, all of them about giving it room:

       - Tracking to 0 from -0.02em. Orbitron is wide by design; pulling it tighter
         closes the counters and reads as cramped.
       - 26/34px, not 30/38. Orbitron sets much wider than a text face at the same
         size, so 38px both wrapped at tablet widths and overpowered the diagram
         below it.
       - Weight 500, not 600. Orbitron's strokes are near-uniform and its bowls are
         squared, so it gains apparent weight faster than a humanist face does — at
         600 a 34px line of it reads as a heavy slab. 500 keeps the mark quality
         without the density.
       - Leading 1.3, not 1.2. This line wraps on any narrow screen, and Orbitron's
         caps are tall relative to its em; at 1.2 the two lines nearly touch.

       `mx-auto max-w-2xl` with `text-center`: centred on the full rail, which is
       the page's own axis — the same one the workload band, the v-sigma unit and
       the trunk wire sit on. The view switch shares this row but is positioned
       absolutely out of the flow precisely so it can't shift this off that axis.

       `max-w-2xl` caps the measure so the line breaks between its two clauses
       rather than stretching, and `text-balance` evens the halves when it does wrap
       instead of leaving "Spark Intelligence." alone on line two. Down from 3xl now
       that the switch shares the row: at 3xl the two overlap at tablet widths,
       since an absolutely-positioned sibling can't push text out of its way.

       The two nouns are coloured and the two verbs left in ink, so the accents
       land on what the line is *about* rather than on what it tells you to do.
       `sigma-ink` and not `sigma`: this is prose to be read, which is exactly the
       split those two tokens exist for.

       Both nouns take the same accent. A second, warm accent on `Intelligence` was
       tried and dropped: two colours in one short line set the halves against each
       other, and the pair of them are one claim, not a contrast. One accent, used
       twice, says "these two words are the subject" — which is all the colour is
       here for. */
    <h1 className="mx-auto max-w-2xl text-center font-brand text-balance text-[26px] leading-[1.3] font-medium tracking-normal sm:text-[34px]">
      Scale <span className="text-sigma-ink">Compute</span>. Spark{" "}
      <span className="text-sigma-ink">Intelligence</span>.
    </h1>
  );
}
