import { GitHubMark } from "@/components/github-mark";
import { NEBULA, VAGRANT_URL } from "@/lib/links";

/**
 * Flat, technical header: monospace throughout, hairline rules, no tiles or
 * shadows. Sticky so the wordmark stays put while the diagram scrolls.
 *
 * No fill — the page's fixed background gradient shows straight through, so the
 * bar reads as part of the page rather than as a panel laid over it.
 *
 * The blur stays. It's what makes "transparent" survive being sticky: the
 * diagram scrolls *under* this bar, and with neither fill nor blur the wordmark
 * would collide with provider rows and chart edges as they passed behind it.
 * Blur alone keeps the bar honest — you can see what's behind it — while holding
 * the text legible. The bottom hairline stays for the same reason: without a
 * fill, it's the only thing marking where the chrome ends.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-transparent backdrop-blur-sm">
      <div className="flex h-14 items-center gap-3 px-8">
        <a href="/" className="flex items-center gap-2" aria-label="v-sigma home">
          <span aria-hidden="true" className="font-mono text-[17px] leading-none text-sigma">
            Σ
          </span>
          {/* The wordmark takes the vivid blue rather than the readable step:
              a logotype is read as a mark, not as prose.

              Orbitron, matching vagrant.ai's own `.brand`. Tracking goes to 0
              from -0.02em: Orbitron is a wide face with generous built-in
              sidebearings, and negative tracking on it closes the counters and
              makes the wordmark look cramped rather than tight. vagrant.ai sets
              `letter-spacing: 0` on its brand for the same reason. */}
          <span className="font-brand text-[15px] leading-none font-semibold tracking-normal text-sigma">
            v-sigma
          </span>
        </a>

        {/* A hairline rule instead of the word "By" — reads as a field
            separator rather than a sentence. */}
        <span aria-hidden="true" className="h-3.5 w-px bg-line" />

        <span className="font-mono text-[12px] tracking-wide text-mute">
          by{" "}
          {/* A faint but always-visible underline: a hover-only one only helps
              people who already suspect it's a link. */}
          <a
            href={VAGRANT_URL}
            className="text-ink-strong/75 underline decoration-mute/40 decoration-1 underline-offset-[3px] transition-colors hover:text-sigma-ink hover:decoration-sigma-ink"
          >
            Vagrant.ai
          </a>
        </span>

        {/* Pushes the repository link to the right edge. `ml-auto` rather than a
            `justify-between` on the bar: the wordmark, the rule and the byline
            are one cluster that has to stay tight, and space-between would have
            spread all four apart. */}
        <a
          href={NEBULA.url}
          target="_blank"
          rel="noreferrer"
          // A square hit area, not just the 16px glyph: 32px is the smallest
          // target that's comfortable to hit, and the negative right margin pulls
          // the glyph itself back onto the 32px page gutter so the padding
          // doesn't read as the header being inset further than the content.
          className="-mr-2 ml-auto flex h-8 w-8 items-center justify-center rounded text-mute transition-colors hover:bg-ink-soft hover:text-ink-strong"
          // Names the destination rather than the icon: "GitHub" alone would
          // leave a screen reader to guess which repository, and there's only one
          // this could be.
          aria-label={`${NEBULA.name} on GitHub`}
        >
          <GitHubMark className="h-4 w-4" />
        </a>
      </div>
    </header>
  );
}
