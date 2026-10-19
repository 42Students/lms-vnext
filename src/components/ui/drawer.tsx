"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { cx } from "@/lib/class-names";
import { OverlayCloseIcon } from "@/components/ui/overlay-close-icon";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";
import { useOverlayExit } from "@/components/ui/use-overlay-exit";

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
  /** Inline filter controls at sm+ use the same DOM subtree as the mobile modal. */
  inlineDesktop?: boolean;
  id?: string;
};

export function Drawer({ open, onOpenChange, title, description, children, footer, dismissible = true, historyMode = "marker", className, bodyClassName, side = "right", headerLeading, inlineDesktop = false, id }: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { availableHeight, viewportTop } = useOverlayWebview({ open, dismissible, historyMode, onDismiss: () => onOpenChange(false) });
  useOverlayExit(ref, opener, open, 200);
  return <dialog ref={ref} id={id} data-slot="drawer" data-side={side} data-inline-desktop={inlineDesktop || undefined} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px" } as CSSProperties}
    className={cx("fixed inset-x-0 top-[var(--lms-visual-top)] m-0 h-[var(--lms-visual-height)] max-h-none w-full max-w-none border-0 bg-surface p-0 text-foreground shadow-[-4px_0_24px_rgba(0,0,0,0.12)] backdrop:bg-[#1e363f]/10 sm:top-[var(--lms-visual-top)] sm:bottom-auto sm:right-0 sm:left-auto sm:w-[min(600px,100vw)] sm:border-l sm:border-[var(--lms-canvas-border)]", inlineDesktop ? "sm:!static sm:!inset-auto sm:!block sm:!h-auto sm:!max-h-none sm:!w-full sm:!max-w-none sm:!border-0 sm:!bg-transparent sm:!shadow-none" : "", className)}>
    <div className={cx("flex h-full min-h-0 flex-col overflow-hidden", inlineDesktop ? "sm:!h-auto sm:!overflow-visible" : "")}>
      <header data-slot="drawer-header" className="flex shrink-0 items-start justify-between gap-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-[var(--lms-canvas-padding)]", inlineDesktop ? "sm:!hidden" : "")}>
        {headerLeading ? <div data-slot="drawer-leading" className="shrink-0">{headerLeading}</div> : null}
        <div className="min-w-0"><h2 id={titleId} className={cx("m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-[1.35] text-[var(--lms-heading)]", headerLeading ? "sr-only" : "")}>{title}</h2>
          {description ? <p id={descriptionId} className="mt-[var(--lms-space-1)] text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}</div>
        {dismissible ? <Button className="min-h-11 min-w-11 shrink-0 rounded-full bg-surface p-0 text-[var(--lms-muted-text)] hover:bg-[var(--lms-neutral-100)]" variant="ghost" aria-label="Close drawer" onClick={() => onOpenChange(false)}><OverlayCloseIcon /></Button> : null}
      </header>
      <ScrollCue axis="y" label={`${title} drawer content`} className={cx("min-h-0 flex-1", inlineDesktop ? "sm:!flex-none sm:!overflow-visible" : "")} viewportClassName={cx("h-full min-h-0 overscroll-contain p-4 sm:p-[var(--lms-canvas-padding)]", inlineDesktop ? "sm:!h-auto sm:!overflow-visible sm:!p-0" : "", bodyClassName)}>{children}</ScrollCue>
      {footer ? <footer data-slot="drawer-footer" className="flex shrink-0 flex-wrap items-center justify-end gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-[var(--lms-canvas-padding)]">{footer}</footer> : null}
    </div>
  </dialog>;
}

/** A single filter form subtree remains mounted in a native modal on phones
 * and inline at tablet/desktop widths. This uses the same backdrop, focus
 * recovery, Escape/Back dismissal and exit motion as the shared Drawer.
 * Do not duplicate the children in two responsive branches: the form must
 * retain its DOM values and association with its outer form on resize.
 */
export function ResponsiveFilterDrawer({
  id, open, onOpenChange, title, launcher, children,
}: {
  id: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
  title: string;
  launcher: RefObject<HTMLButtonElement | null>;
  children: ReactNode;
}) {
  useEffect(() => {
    const media = typeof window.matchMedia === "function"
      ? window.matchMedia("(min-width: 640px)") : null;
    const closeOnDesktop = () => {
      if (media?.matches ?? window.innerWidth >= 640) {
        onOpenChange(false);
        // The launcher is hidden at desktop sizes; do not force focus on it.
        if (launcher.current?.matches(":focus-visible")) launcher.current.blur();
      }
    };
    media?.addEventListener("change", closeOnDesktop);
    window.addEventListener("resize", closeOnDesktop);
    return () => {
      media?.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("resize", closeOnDesktop);
    };
  }, [launcher, onOpenChange]);

  return <Drawer id={id} open={open} onOpenChange={onOpenChange}
    inlineDesktop title={title} description={undefined}
    className="lms-responsive-filter-drawer"
    bodyClassName="sm:!p-0">
    {children}
  </Drawer>;
}
