"use client";

import { useEffect, useId, useRef, type ReactNode, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { cx } from "@/lib/class-names";
import { OverlayCloseIcon } from "@/components/ui/overlay-close-icon";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";

export type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  historyMode?: "marker" | "route";
  className?: string;
  bodyClassName?: string;
  /** Left-side navigation uses the legacy 82vw / 300px mobile drawer geometry. */
  side?: "right" | "left";
  headerLeading?: ReactNode;
};

export function Drawer({ open, onOpenChange, title, description, children, footer, dismissible = true, historyMode = "marker", className, bodyClassName, side = "right", headerLeading }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { availableHeight, viewportTop } = useOverlayWebview({ open, dismissible, historyMode, onDismiss: () => onOpenChange(false) });
  useEffect(() => {
    const modal = ref.current;
    if (!modal) return;
    if (open && !modal.open) { opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; modal.showModal(); }
    else if (!open && modal.open) { modal.close(); opener.current?.focus(); }
  }, [open]);
  return <dialog ref={ref} data-slot="drawer" data-side={side} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px" } as CSSProperties}
    className={cx("fixed inset-x-0 top-[var(--lms-visual-top)] m-0 h-[var(--lms-visual-height)] max-h-none w-full max-w-none border-0 bg-surface p-0 text-foreground shadow-[-4px_0_24px_rgba(0,0,0,0.12)] backdrop:bg-[#1e363f]/10 sm:top-[var(--lms-visual-top)] sm:bottom-auto sm:right-0 sm:left-auto sm:w-[min(600px,100vw)] sm:border-l sm:border-[var(--lms-canvas-border)]", className)}>
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header data-slot="drawer-header" className="flex shrink-0 items-start justify-between gap-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-[var(--lms-canvas-padding)]">
        {headerLeading ? <div data-slot="drawer-leading" className="shrink-0">{headerLeading}</div> : null}
        <div className="min-w-0"><h2 id={titleId} className={cx("m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-[1.35] text-[var(--lms-heading)]", headerLeading ? "sr-only" : "")}>{title}</h2>
          {description ? <p id={descriptionId} className="mt-[var(--lms-space-1)] text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}</div>
        {dismissible ? <Button className="min-h-11 min-w-11 shrink-0 rounded-full bg-surface p-0 text-[var(--lms-muted-text)] hover:bg-[var(--lms-neutral-100)]" variant="ghost" aria-label="Close drawer" onClick={() => onOpenChange(false)}><OverlayCloseIcon /></Button> : null}
      </header>
      <ScrollCue axis="y" label={`${title} drawer content`} className="min-h-0 flex-1" viewportClassName={cx("h-full min-h-0 overscroll-contain p-4 sm:p-[var(--lms-canvas-padding)]", bodyClassName)}>{children}</ScrollCue>
      {footer ? <footer data-slot="drawer-footer" className="flex shrink-0 flex-wrap items-center justify-end gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-[var(--lms-canvas-padding)]">{footer}</footer> : null}
    </div>
  </dialog>;
}

/** A single form subtree lives inside this shared drawer both inline (tablet)
 * and as a modal panel (phone). No duplicate inputs, names, or form state. */
export function ResponsiveFilterDrawer({
  id, open, onOpenChange, title, launcher, children,
}: {
  id: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  launcher: React.RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const { availableHeight } = useOverlayWebview({
    open, dismissible: true, onDismiss: () => onOpenChange(false),
  });
  useEffect(() => {
    if (!open) return;
    const media = window.matchMedia("(min-width: 640px)");
    const onResize = () => { if (media.matches) onOpenChange(false); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
    )?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
      if (event.key !== "Tab" || !panel.current) return;
      const elements = Array.from(panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter(el => el.getClientRects().length > 0);
      if (!elements.length) return;
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault();
        elements.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
        event.preventDefault();
        elements[0]?.focus();
      }
    };
    media.addEventListener("change", onResize);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.style.overflow = overflow;
      media.removeEventListener("change", onResize);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("keydown", onKey);
      if (!media.matches) launcher.current?.focus();
    };
  }, [open, onOpenChange, launcher]);
  return <>
    {open ? <button type="button" aria-label="Close filters" onClick={() => onOpenChange(false)}
      className="fixed inset-0 z-30 bg-[rgba(30,54,63,0.1)] sm:hidden" /> : null}
    <div id={id} ref={panel} data-slot="responsive-filter-drawer"
      style={{ "--lms-visual-height": availableHeight ?? "100dvh" } as CSSProperties}
      role={open ? "dialog" : undefined} aria-modal={open || undefined}
      aria-label={open ? title + " options" : undefined}
      className={cx(
        "min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4",
        "sm:static sm:z-auto sm:block sm:max-h-none sm:w-full sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none",
        open ? "fixed inset-0 z-40 flex max-h-[var(--lms-visual-height)] min-h-0 w-full flex-col overflow-hidden pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] shadow-[var(--lms-overlay-shadow)]"
          : "hidden sm:block",
      )}>
      <div data-slot="responsive-filter-header" className="mb-4 flex shrink-0 items-center justify-between gap-3 sm:hidden">
        <h2 className="m-0 text-[18px] font-semibold leading-6 text-[var(--lms-heading)]">{title}</h2>
        <Button type="button" variant="ghost" aria-label="Close filters"
          onClick={() => onOpenChange(false)}><OverlayCloseIcon /></Button>
      </div>
      <ScrollCue axis="y" label={title + " options"} className={open ? "min-h-0 flex-1" : undefined}
        viewportClassName={open ? "h-full min-h-0 pb-4" : "overflow-visible"}>{children}</ScrollCue>
    </div>
  </>;
}
