"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { cx } from "@/lib/class-names";

export type FilterBarProps = {
  title?: string;
  activeCount?: number;
  /** Always-visible search input; use form="..." to associate with the GET form in filters. */
  search?: ReactNode;
  /** Optional alias for existing children; only one subtree is mounted. */
  filters?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  /** Optional list toolbar actions; render only controls the page actually implements. */
  views?: ReactNode;
  columns?: ReactNode;
  exportAction?: ReactNode;
  className?: string;
};

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function FilterBar({ title = "Filters", activeCount = 0, search, filters, children, action, views, columns, exportAction, className }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const { availableHeight } = useOverlayWebview({ open, dismissible: true, onDismiss: () => setOpen(false) });
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const count = Number.isFinite(activeCount) ? Math.max(0, Math.trunc(activeCount)) : 0;
  const hasFilters = (filters !== undefined && filters !== null) || (children !== undefined && children !== null);

  useEffect(() => {
    if (!open) return;
    // Some embedded mobile WebViews do not expose matchMedia. A resize-based
    // width check keeps the filter drawer dismissible and the page usable.
    const media = typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 640px)") : null;
    const isDesktop = () => media?.matches ?? window.innerWidth >= 640;
    function resize() { if (isDesktop()) setOpen(false); }
    media?.addEventListener("change", resize);
    window.addEventListener("resize", resize);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = panel.current?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    function keys(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); setOpen(false); return; }
      if (event.key !== "Tab" || !panel.current) return;
      const tabbable = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!tabbable.length) return;
      const firstControl = tabbable[0]!, lastControl = tabbable[tabbable.length - 1]!;
      if (event.shiftKey && document.activeElement === firstControl) { event.preventDefault(); lastControl.focus(); }
      else if (!event.shiftKey && document.activeElement === lastControl) { event.preventDefault(); firstControl.focus(); }
    }
    document.addEventListener("keydown", keys);
    return () => {
      media?.removeEventListener("change", resize);
      window.removeEventListener("resize", resize);
      document.removeEventListener("keydown", keys);
      document.body.style.overflow = priorOverflow;
      if(isDesktop()) panel.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      else launcher.current?.focus();
    };
  }, [open]);

  return <section data-slot="filter-bar" data-open={open} data-active-count={count} aria-label={title} className={cx("min-w-0 space-y-[var(--lms-space-3)]", className)}>
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
      {search ? <div className="min-w-0 flex-1 basis-40 sm:basis-[220px] sm:max-w-[380px]">{search}</div> : null}
      {hasFilters ? <div className="sm:hidden">
        <Button ref={launcher} variant="secondary" aria-label={count > 0 ? `${title}, ${count} active` : title} aria-expanded={open} aria-controls={panelId}
          onClick={() => setOpen(true)}>{title}{count > 0 ? ` (${count})` : ""}</Button>
      </div> : null}
      {views || columns || exportAction ? <div role="toolbar" aria-label="List actions" className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">{views}{columns}{exportAction}</div> : null}
      {action}
    </div>
    {open ? <button type="button" aria-label="Close filters" onClick={() => setOpen(false)}
      className="fixed inset-0 z-30 bg-[rgba(30,54,63,0.1)] sm:hidden"/> : null}
    <div id={panelId} ref={panel} style={{ "--lms-visual-height": availableHeight ?? "100dvh" } as CSSProperties} role={open ? "dialog" : undefined} aria-modal={open ? true : undefined}
      aria-label={open ? `${title} options` : undefined}
      className={cx("min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-[var(--lms-space-4)] sm:static sm:z-auto sm:block sm:max-h-none sm:w-full sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
        open ? "fixed inset-0 z-40 flex max-h-[var(--lms-visual-height)] min-h-0 w-full flex-col overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--lms-overlay-shadow)]" : "hidden sm:block")}>
      <div className="mb-[var(--lms-space-4)] flex shrink-0 items-center justify-between gap-[var(--lms-space-3)] sm:hidden">
        <h2 className="m-0 text-[18px] font-semibold leading-6 text-[var(--lms-heading)]">{title}</h2>
        <Button variant="ghost" aria-label="Close filters" onClick={() => setOpen(false)}>×</Button>
      </div>
      <ScrollCue axis="y" label={`${title} options`} className={open ? "min-h-0 flex-1" : undefined}
        viewportClassName={open ? "h-full min-h-0 pb-[var(--lms-space-4)]" : "overflow-visible"}>{filters ?? children}</ScrollCue>
    </div>
  </section>;
}
