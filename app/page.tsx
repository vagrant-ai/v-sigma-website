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
    /* Roboto Mono, the text face — the same one the whole page is set in.

       This was Orbitron, the brand face, on the reasoning that the slogan functions
       as a mark rather than as prose. It reads as prose: it's a sentence, with two
       verbs and a full stop, and the thing a display face buys — being recognised
       without being read — is worth nothing on a line whose entire job is to be
       read. Orbitron stays where that trade does pay, on the wordmark in the header
       and on the v-sigma unit in the diagram, which are labels naming one thing.
       Two faces on the page, split by what each piece of copy *is*, rather than by
       which piece is the most important.

       Four settings revert with the face, each of them something Orbitron forced
       and a text face doesn't:

       - Tracking to -0.03em from 0. The 0 was headroom for Orbitron's wide geometric
         counters, which close up and read as cramped when pulled tighter. Roboto
         Mono is already generous at display size — mono advances are uniform and
         sized for a lowercase x, so caps and narrow letters both sit in a wider box
         than they need. Negative pulls the words into units; the exact figure is set
         by the one-line measure below.
       - 30/38px, up from 30/34, and the step moves to `lg`. Orbitron sets much
         wider than a text face at the same size, and 38px of it both wrapped at
         tablet widths and overpowered the diagram below. Neither is true here, so
         the top of the ramp comes back — see the measure note below for why the
         breakpoint moved with it.
       - Weight 600, not 500. 500 was a discount against Orbitron's near-uniform
         strokes and squared bowls, which gain apparent weight faster than a text
         face does. Roboto Mono at 500 reads as body copy set large; 600 is what
         makes it a claim.
       - Leading 1.2, not 1.3. The extra was for Orbitron's caps, tall relative to
         its em. Mono cap height is ordinary, and at 1.3 a two-line wrap drifts
         apart.

       This is deliberately the page's one display size, and the only type that sits
       outside the 10–15px band everything else lives in — the "Features" h2 at 14,
       the card titles at 14, the header wordmark at 15, the panel headings and
       labels at 10–12.

       Pulling it *into* that band was tried, at a flat 14px, on the reasoning that
       a page with one outlier size isn't a scale. It isn't the argument it looks
       like: at 14px the claim was the same size as three labels beneath it and read
       as a fourth, and a slogan that reads as a label has stopped making its claim.
       Colour does mark it out — it's the only line carrying the sigma accent — but
       that doesn't buy it the pause that comes before a statement. Size is what
       says "read this first". Now that the face is the body face, size and weight
       are the *only* things saying it, which is the whole reason the outlier size
       has to stay.

       30 and not 26 at the small step: 26 was a compression for a row the view
       switch used to share, and with the switch gone (see `Board`) there's nothing
       to make room for.

       `mx-auto` with `text-center`: centred on the full rail, which is the page's
       own axis — the same one the workload band, the v-sigma unit and the trunk wire
       sit on.

       One line wherever one line fits, which is what the measure, the tracking and
       the breakpoint are all set by. A mono makes that arithmetic exact rather than
       a matter of trying it: every glyph advances 0.6em, and letter-spacing applies
       per glyph, so this line's 34 characters occupy 34 × (0.6 − 0.03) = 19.4em.
       That's 582px at 30px and 737px at 38px.

       Hence `max-w-3xl` (768px), the first step that clears the wider of the two —
       `max-w-2xl` was 672px, which forced a wrap at 38px on every screen. And the
       ramp fires at `lg` (1024px), not `sm` (640px): 737px of text needs a viewport
       that holds it plus the rail's 24px gutters, so stepping up at `sm` would put
       the big size on exactly the widths too narrow to take it.

       Tracking is -0.03em and not the -0.02em the face would otherwise want, and
       that last 0.01em is load-bearing. At -0.02em the line measures 591.6px,
       against the 592px a 640px viewport leaves inside the gutters — it fits by four
       tenths of a pixel, which is not a fit, it's a coin toss decided by how a
       given browser rounds glyph advances. -0.03em buys ~10px of clearance, so the
       first breakpoint holds one line for real.

       Below 640px it wraps, and it has to: one line there would need ~17px type,
       well under this size. `text-balance` is for that case only — it evens the two
       halves instead of leaving "Spark Intelligence." alone on line two. No
       `whitespace-nowrap`: the guarantee isn't worth a line that runs off the side
       of a phone.

       The two nouns are coloured and the two verbs left in ink, so the accents
       land on what the line is *about* rather than on what it tells you to do.
       `sigma-ink` and not `sigma`: this is prose to be read, which is exactly the
       split those two tokens exist for.

       Both nouns take the same accent. A second, warm accent on `Intelligence` was
       tried and dropped: two colours in one short line set the halves against each
       other, and the pair of them are one claim, not a contrast. One accent, used
       twice, says "these two words are the subject" — which is all the colour is
       here for. */
    <h1 className="mx-auto max-w-3xl text-center font-mono text-balance text-[30px] leading-[1.2] font-semibold tracking-[-0.03em] lg:text-[38px]">
      Scale <span className="text-sigma-ink">Compute</span>. Spark{" "}
      <span className="text-sigma-ink">Intelligence</span>.
    </h1>
  );
}
