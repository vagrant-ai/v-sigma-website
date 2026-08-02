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
              a logotype is read as a mark, not as prose. */}
          <span className="font-mono text-[15px] leading-none font-semibold tracking-[-0.02em] text-sigma">
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
          <GitHubMark />
        </a>
      </div>
    </header>
  );
}

/**
 * The GitHub mark — the official Octocat glyph path, not a lookalike.
 *
 * Inlined here rather than added to `brand-marks.ts`: that file is keyed by
 * provider id and documents itself as vendor logos for the rows in the diagram.
 * GitHub isn't a provider, so an entry there would need a fake id and would
 * break the "every key is a provider" invariant the file relies on.
 *
 * `currentColor` so it inherits the link's hover, which is what makes the whole
 * 32px square feel like one control rather than a glyph inside a box.
 */
function GitHubMark() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.07-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A7.995 7.995 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
