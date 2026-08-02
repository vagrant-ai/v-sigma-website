import { CONTACT_EMAIL, NEBULA } from "@/lib/links";

/** One muted line: copyright, contact, and the project underneath. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line">
      <div className="flex h-14 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-8 font-mono text-[11px] tracking-wide text-mute">
        <span>© {year} Vagrant.ai</span>
        <Dot />
        <span>{CONTACT_EMAIL}</span>
        <Dot />
        {/* The one link on the page that leaves the site, so it's marked as
            external and the credit line stays readable if it doesn't. */}
        <span>
          Powered by{" "}
          <a
            href={NEBULA.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink-strong/80 underline decoration-line underline-offset-2 transition-colors hover:text-sigma hover:decoration-sigma/50"
          >
            {NEBULA.name}
          </a>
        </span>
      </div>
    </footer>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="text-mute/40">
      ·
    </span>
  );
}
