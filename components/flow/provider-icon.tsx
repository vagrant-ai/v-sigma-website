import { brandMark } from "@/lib/brand-marks";
import type { Provider, ProviderKind } from "@/lib/data";

/**
 * The tile at the head of each provider row, in priority order:
 *
 *  1. the vendor's real logo, where a published icon set has one;
 *  2. a drawn glyph — for the self-managed kinds, which are categories of
 *     infrastructure rather than brands, and for the two vendors with no
 *     published mark. A glyph suggests *what* the provider is without passing
 *     itself off as their logo, which an invented brand mark would;
 *  3. the monogram, as the last resort for anything unrecognised.
 *
 * A real logo is drawn in the vendor's own brand colour, and its tile tints and
 * borders from that same hue via `color-mix`, so each row is recognisable at a
 * glance. Fallbacks keep the site's blue — an invented brand colour would be a
 * worse lie than no logo at all.
 */
/** Glyphs take a size class, since the tile and the travelling chips differ. */
type GlyphProps = { className?: string };
type Glyph = (props: GlyphProps) => React.ReactElement;

export function ProviderIcon({ provider }: { provider: Provider }) {
  const mark = brandMark(provider.id);
  const Glyph = ID_GLYPH[provider.id] ?? KIND_GLYPH[provider.kind];

  if (mark) {
    return (
      <span
        aria-hidden="true"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors group-hover:[background-color:var(--tile-hover-bg)] group-hover:[border-color:var(--tile-hover-border)]"
        style={
          {
            color: mark.color,
            // Mixed here rather than in Tailwind: the hue is per-provider data,
            // so there is no class name to generate.
            borderColor: `color-mix(in oklab, ${mark.color} 30%, transparent)`,
            backgroundColor: `color-mix(in oklab, ${mark.color} 9%, transparent)`,
            // Hover targets go through custom properties because the group-hover
            // variant needs a class, and the value is per-provider data.
            "--tile-hover-border": `color-mix(in oklab, ${mark.color} 55%, transparent)`,
            "--tile-hover-bg": `color-mix(in oklab, ${mark.color} 16%, transparent)`,
          } as React.CSSProperties
        }
      >
        <ProviderMark provider={provider} className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      aria-hidden="true"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-sigma/25 bg-sigma/8 text-sigma-ink transition-colors group-hover:border-sigma/50 group-hover:bg-sigma/15"
    >
      {Glyph ? (
        <Glyph />
      ) : (
        <span className="font-mono text-[10px] leading-none font-semibold tracking-tight">
          {monogramFor(provider)}
        </span>
      )}
    </span>
  );
}

/**
 * A provider's mark on its own, with no tile around it — for the chips
 * travelling the diagram's edges, which need the logo without the frame.
 *
 * Falls back to the same glyph the tile uses, so a provider with no published
 * logo still travels as *something* recognisable rather than vanishing. Colour
 * comes from `currentColor` unless the mark is two-tone, so a caller can tint
 * it (the chips do, to match their edge) without special-casing.
 */
export function ProviderMark({
  provider,
  className,
}: {
  provider: Provider;
  className?: string;
}) {
  const mark = brandMark(provider.id);
  if (!mark) {
    const Glyph = ID_GLYPH[provider.id] ?? KIND_GLYPH[provider.kind];
    return Glyph ? <Glyph className={className} /> : null;
  }

  return (
    <svg className={className} viewBox={mark.viewBox} fill="currentColor" fillRule="evenodd">
      {mark.paths.map((path) =>
        typeof path === "string" ? (
          <path key={path} d={path} />
        ) : (
          <path key={path.d} d={path.d} fill={path.color} />
        ),
      )}
    </svg>
  );
}

/**
 * Per-vendor glyphs, for a vendor with no published logo. Keyed by id rather
 * than kind, since its neighbours in the same kind do have real marks. Empty
 * today — every listed vendor has a real mark — but the lookup stays so adding
 * a logo-less provider doesn't mean reaching for a fabricated brand mark.
 */
const ID_GLYPH: Record<string, Glyph> = {};

/** Self-managed kinds are categories of infrastructure, so they draw a glyph. */
const KIND_GLYPH: Partial<Record<ProviderKind, Glyph>> = {
  onprem: RackGlyph,
  other: EllipsisGlyph,
};

/** What the tile will actually render, so the mapping can be asserted in tests. */
export function iconSourceFor(provider: Provider): "logo" | "glyph" | "monogram" {
  if (brandMark(provider.id)) return "logo";
  if (ID_GLYPH[provider.id] ?? KIND_GLYPH[provider.kind]) return "glyph";
  return "monogram";
}

/**
 * The letters on a vendor's tile. The initials fallback keeps a new provider
 * legible before someone picks a monogram for it.
 */
export function monogramFor(provider: Provider): string {
  return provider.monogram ?? provider.name.slice(0, 2).toUpperCase();
}

/** Shared drawing surface for the glyphs: 16-unit box, stroked, not filled. */
function Frame({ children, className = "h-3.5 w-3.5" }: GlyphProps & { children: React.ReactNode }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/** Stacked rack units — bare metal you own. */
function RackGlyph({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <rect x="2.5" y="2.5" width="11" height="3.5" rx="0.8" />
      <rect x="2.5" y="10" width="11" height="3.5" rx="0.8" />
      <path d="M5 4.25h0.01M5 11.75h0.01" strokeWidth="1.6" />
    </Frame>
  );
}

/** Anything else we integrate with on request. */
function EllipsisGlyph({ className }: GlyphProps) {
  return (
    <Frame className={className}>
      <path d="M4 8h0.01M8 8h0.01M12 8h0.01" strokeWidth="1.8" />
    </Frame>
  );
}
