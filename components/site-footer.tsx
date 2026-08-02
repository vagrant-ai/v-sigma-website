import { CONTACT_EMAIL } from "@/lib/links";

/**
 * One muted line: copyright and contact.
 *
 * The "Powered by Nebula" credit used to sit here as a third field. The header's
 * GitHub link now points at the same repository, and the Open Source feature
 * names and links Nebula in prose — so the footer credit was the third mention
 * of one project, in the least-read spot on the page.
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-line">
      <div className="flex h-14 flex-wrap items-center justify-center gap-x-3 gap-y-1 px-8 font-mono text-[12px] tracking-wide text-mute">
        <span>© {year} Vagrant.ai</span>
        <Dot />
        <span>{CONTACT_EMAIL}</span>
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
