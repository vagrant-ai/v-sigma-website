"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type Point = { x: number; y: number };
export type Anchor = { left: Point; right: Point; top: Point; bottom: Point };

/**
 * Tracks the on-screen position of registered nodes relative to a container,
 * so edges can be drawn between them in an overlaid SVG. Re-measures on
 * container/node resize and whenever `layoutKey` changes.
 */
export function useAnchors(layoutKey: string) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef(new Map<string, HTMLElement>());
  const [anchors, setAnchors] = useState<Record<string, Anchor>>({});
  const [size, setSize] = useState({ width: 0, height: 0 });

  const registerNode = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) nodesRef.current.set(id, el);
      else nodesRef.current.delete(id);
    },
    [],
  );

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const base = container.getBoundingClientRect();
    const next: Record<string, Anchor> = {};
    for (const [id, el] of nodesRef.current) {
      const r = el.getBoundingClientRect();
      const top = r.top - base.top;
      const left = r.left - base.left;
      const midX = left + r.width / 2;
      const midY = top + r.height / 2;
      next[id] = {
        left: { x: left, y: midY },
        right: { x: left + r.width, y: midY },
        top: { x: midX, y: top },
        bottom: { x: midX, y: top + r.height },
      };
    }
    setAnchors(next);
    setSize({ width: base.width, height: base.height });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    measure();

    const observer = new ResizeObserver(() => measure());
    observer.observe(container);
    for (const el of nodesRef.current.values()) observer.observe(el);

    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [layoutKey, measure]);

  return { containerRef, registerNode, anchors, size };
}

/**
 * Orthogonal edge: down out of `from`, across at the midpoint, then down into
 * `to`. Segments stay horizontal/vertical — the two turns are filleted with a
 * quarter-arc so the wire reads as routed trace rather than a hard elbow, and
 * so a chip travelling it doesn't jerk through the corner.
 *
 * Collapses to a single straight line when the two nodes are already aligned.
 *
 * `radius` is clamped to half of each leg it touches, so a short run degrades
 * to a smaller fillet instead of overshooting into a cusp.
 */
export function edgePathVertical(from: Point, to: Point, radius = 12): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) < 1) {
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
  }

  const midY = from.y + dy / 2;
  // Each turn consumes `r` of the vertical leg above/below it and `r` of the
  // horizontal run, so the budget is half of the smallest of the three.
  const r = Math.max(0, Math.min(radius, Math.abs(dy) / 4, Math.abs(dx) / 2));
  if (r < 1) {
    return `M ${from.x} ${from.y} L ${from.x} ${midY} L ${to.x} ${midY} L ${to.x} ${to.y}`;
  }

  const sx = Math.sign(dx);
  const sy = Math.sign(dy);
  return [
    `M ${from.x} ${from.y}`,
    `L ${from.x} ${midY - r * sy}`,
    `Q ${from.x} ${midY} ${from.x + r * sx} ${midY}`,
    `L ${to.x - r * sx} ${midY}`,
    `Q ${to.x} ${midY} ${to.x} ${midY + r * sy}`,
    `L ${to.x} ${to.y}`,
  ].join(" ");
}

/** Straight-line length of an orthogonal edge, for pacing motion along it. */
export function edgeLength(from: Point, to: Point): number {
  return Math.abs(to.x - from.x) + Math.abs(to.y - from.y);
}
