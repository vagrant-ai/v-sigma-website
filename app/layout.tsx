import type { Metadata } from "next";
import { Orbitron, Roboto_Mono } from "next/font/google";
import "./globals.css";

/**
 * The two faces vagrant.ai uses, so v-sigma reads as the same company's work:
 * Orbitron for the brand, Roboto Mono for everything else. Parent site loads
 * exactly this pair from Google Fonts (`Orbitron:wght@400..700` and
 * `Roboto+Mono:100..700`); this is the same request made through `next/font`,
 * which self-hosts the files and drops the render-blocking round trip to
 * fonts.googleapis.com.
 *
 * Both are variable, so weight is free. `display: swap` keeps first paint fast.
 */

/**
 * Orbitron — the product's own name only: the `v-sigma` wordmark in the header and
 * the v-sigma unit in the diagram. It's a wide geometric display face with
 * near-uniform stroke and squared bowls, which is why it works as a logotype and why
 * body copy set in it is unreadable. Capped at 700; the family goes to 900 but
 * nothing here needs it.
 *
 * Two rules, both learned by breaking them. This face is for copy that *names*
 * something, not for copy that says something about it, however important the latter
 * is — the slogan was set in it and isn't any more, because it's a sentence and reads
 * as prose. And it's for *this* product's name: `Vagrant.ai` in the header was tried
 * in it and reverted, since a credit line set in the product's logotype face reads as
 * a second wordmark rather than as the attribution it is.
 */
const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-orbitron",
});

/**
 * Roboto Mono — everything else, prose included. That's vagrant.ai's own choice
 * (its `body` is `"Roboto Mono", monospace`) and it collapses this site's former
 * two-face split into one: with a mono as the body face, the old
 * mono-means-something-exact convention no longer distinguishes anything, so
 * emphasis moves to weight and colour instead.
 */
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-roboto-mono",
});

export const metadata: Metadata = {
  title: "v-sigma — Scale Compute. Spark Intelligence.",
  description:
    "v-sigma routes GPU workloads across hyperscalers, neoclouds and on-prem capacity from a single control plane.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${orbitron.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
