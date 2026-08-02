import { CONTACT_EMAIL } from "@/lib/links";

/** One static muted line — plain text, nothing clickable. */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line">
      <div className="flex h-14 items-center justify-center gap-3 px-8 font-mono text-[11px] tracking-wide text-mute">
        <span>© {year} Vagrant.ai</span>
        <span aria-hidden="true" className="text-mute/40">
          ·
        </span>
        <span>{CONTACT_EMAIL}</span>
      </div>
    </footer>
  );
}
