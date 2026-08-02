import { Board } from "@/components/flow/board";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* No visible page title: the v-sigma band in the diagram already states
            what this is, and a heading above it said the same thing twice. Kept
            for screen readers and document outline, which still need an h1. */}
        <h1 className="sr-only">v-sigma — the control plane for GPU as a Service</h1>

        <Board />
      </main>

      <SiteFooter />
    </div>
  );
}
