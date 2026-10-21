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
  /** Left-side navigation matches the legacy 256px mobile drawer geometry. */
  side?: "right" | "left";
  headerLeading?: ReactNode;
  /** Inline filter controls at 768px+ use the same DOM subtree as the mobile modal. */
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
    onClose={() => { if (open) onOpenChange(false); if (opener.current?.isConnected) opener.current.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px" } as CSSProperties}
    className={cx("fixed top-[var(--lms-visual-top)] m-0 h-[var(--lms-visual-height)] max-h-none min-w-0 overflow-hidden overscroll-contain border-0 bg-surface p-0 text-foreground backdrop:bg-[#1e363f]/10 md:bottom-auto", side === "left" ? "left-0 right-auto w-[min(82%,256px)] max-w-[256px] shadow-[4px_0_16px_rgba(0,0,0,0.12)] md:w-[min(600px,100vw)] md:max-w-none md:border-r md:border-[var(--lms-canvas-border)]" : "inset-x-0 w-full max-w-none shadow-[-4px_0_24px_rgba(0,0,0,0.12)] md:left-auto md:right-0 md:w-[min(600px,100vw)] md:border-l md:border-[var(--lms-canvas-border)]", inlineDesktop ? "md:!static md:!inset-auto md:!block md:!h-auto md:!max-h-none md:!w-full md:!max-w-none md:!border-0 md:!bg-transparent md:!shadow-none" : "", className)}>
    <div className={cx("flex h-full min-h-0 flex-col overflow-hidden", inlineDesktop ? "md:!h-auto md:!overflow-visible" : "")}>
      <header data-slot="drawer-header" className={cx("flex min-w-0 shrink-0 items-start justify-between gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] p-4 pt-[max(1rem,env(safe-area-inset-top))] md:gap-[var(--lms-space-4)] md:px-[var(--lms-canvas-padding)]", inlineDesktop ? "md:!hidden" : "")}>
        {headerLeading ? <div data-slot="drawer-leading" className="shrink-0">{headerLeading}</div> : null}
        <div className="min-w-0"><h2 id={titleId} className={cx("m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-[1.35] text-[var(--lms-heading)]", headerLeading ? "sr-only" : "")}>{title}</h2>
          {description ? <p id={descriptionId} className="mt-[var(--lms-space-1)] min-w-0 break-words [overflow-wrap:anywhere] text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}</div>
        {dismissible ? <Button className="min-h-11 min-w-11 shrink-0 rounded-full bg-surface p-0 text-[var(--lms-muted-text)] hover:bg-[var(--lms-neutral-100)]" variant="ghost" aria-label="Close drawer" onClick={() => onOpenChange(false)}><OverlayCloseIcon /></Button> : null}
      </header>
      <ScrollCue axis="y" label={`${title} drawer content`} className={cx("min-h-0 flex-1", inlineDesktop ? "md:!flex-none md:!overflow-visible" : "")} viewportClassName={cx("h-full min-h-0 overscroll-contain p-4 md:p-[var(--lms-canvas-padding)]", inlineDesktop ? "md:!h-auto md:!overflow-visible md:!p-0" : "", bodyClassName)}>{children}</ScrollCue>
      {footer ? <footer data-slot="drawer-footer" className="flex min-w-0 shrink-0 flex-col-reverse items-stretch gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] [&>[data-slot=button]]:w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-[var(--lms-space-3)] sm:[&>[data-slot=button]]:w-auto md:px-[var(--lms-canvas-padding)]">{footer}</footer> : null}
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
      ? window.matchMedia("(min-width: 768px)") : null;
    const closeOnDesktop = () => {
      if (!open) return;
      if (media?.matches ?? window.innerWidth >= 768) {
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
  }, [launcher, onOpenChange, open]);

  return <Drawer id={id} open={open} onOpenChange={onOpenChange}
    inlineDesktop title={title} description={undefined}
    className="lms-responsive-filter-drawer"
    bodyClassName="md:!p-0">
    {children}
  </Drawer>;
}
