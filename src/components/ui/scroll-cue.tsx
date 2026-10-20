"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cx } from "@/lib/class-names";

type ScrollAxis = "x" | "y";

/** UX scroll-motion: hidden scrollbars need truthful edge cues. A focusable
 * region is only added when there is overflow. Works with wheel, touch,
 * browser keyboard scrolling, and changes to content/viewport dimensions.
 * Fades never intercept clicks, selection or dragging.
 */
export function ScrollCue({ children, axis, label, className, viewportClassName }: {
  children: ReactNode;
  axis: ScrollAxis;
  label: string;
  className?: string;
  viewportClassName?: string;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ scrollable: false, start: false, end: false });
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const update = () => {
      const max = axis === "x" ? node.scrollWidth - node.clientWidth : node.scrollHeight - node.clientHeight;
      const position = axis === "x" ? node.scrollLeft : node.scrollTop;
      const next = {
        scrollable: max > 2,
        start: max > 2 && position > 1,
        end: max > 2 && position < max - 1,
      };
      setEdges(previous => previous.scrollable === next.scrollable &&
        previous.start === next.start && previous.end === next.end ? previous : next);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    // Multi-child overflow regions (e.g. filters + table) can grow in a
    // sibling after the first child without changing the viewport box.
    const observeContents = () => {
      observer?.disconnect();
      observer?.observe(node);
      for (const child of node.children) observer?.observe(child);
    };
    observeContents();
    const mutations = typeof MutationObserver === "undefined" ? null :
      new MutationObserver(() => {
        observeContents();
        update();
      });
    mutations?.observe(node, { childList: true, subtree: true });
    return () => {
      node.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      observer?.disconnect();
      mutations?.disconnect();
    };
  }, [axis]);
  return <div data-slot="scroll-cue" data-axis={axis} data-scroll-start={edges.start}
    data-scroll-end={edges.end} className={cx("relative min-w-0", className)}>
    <div ref={viewport} role={edges.scrollable ? "region" : undefined}
      aria-label={edges.scrollable ? label : undefined}
      tabIndex={edges.scrollable ? 0 : -1}
      className={cx(axis === "x" ? "min-w-0 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" :
        "min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]",
        viewportClassName)}>{children}</div>
    {edges.start ? <span aria-hidden="true" data-scroll-fade="start" className={cx(
      "pointer-events-none absolute z-20 from-surface to-transparent motion-reduce:transition-none",
      axis === "x" ? "inset-y-0 left-0 w-5 bg-gradient-to-r" : "inset-x-0 top-0 h-5 bg-gradient-to-b"
    )}/> : null}
    {edges.end ? <span aria-hidden="true" data-scroll-fade="end" className={cx(
      "pointer-events-none absolute z-20 from-surface to-transparent motion-reduce:transition-none",
      axis === "x" ? "inset-y-0 right-0 w-5 bg-gradient-to-l" : "inset-x-0 bottom-0 h-5 bg-gradient-to-t"
    )}/> : null}
  </div>;
}
