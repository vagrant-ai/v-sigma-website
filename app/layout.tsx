import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/**
 * Inter for prose and JetBrains Mono for anything data-shaped. Both are
 * variable fonts, so weight is free; `display: swap` keeps first paint fast.
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "v-sigma — by Vagrant.ai",
  description:
    "v-sigma routes GPU workloads across hyperscalers, neoclouds and on-prem capacity from a single control plane.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
