import { VAGRANT_URL } from "@/lib/links";

/**
 * Flat, technical header: monospace throughout, hairline rules, no tiles or
 * shadows. Sticky so the wordmark stays put while the diagram scrolls.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur-sm">
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

        <span className="font-mono text-[11px] tracking-wide text-mute">
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
      </div>
    </header>
  );
}
