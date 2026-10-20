"use client";

import { useId, useRef, type ReactNode, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { cx } from "@/lib/class-names";
import { OverlayCloseIcon } from "@/components/ui/overlay-close-icon";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";
import { useOverlayExit } from "@/components/ui/use-overlay-exit";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
  className?: string;
  bodyClassName?: string;
  role?: "dialog" | "alertdialog";
  /** Route-selected detail dialogs use the URL as their back-stack owner. */
  historyMode?: "marker" | "route";
};

export function Dialog({ open, onOpenChange, title, description, children, footer, dismissible = true, className, bodyClassName, role = "dialog", historyMode = "marker" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { availableHeight, viewportTop, viewportBottom } = useOverlayWebview({ open, dismissible, historyMode, onDismiss: () => onOpenChange(false) });
  // A consumer-supplied width replaces the default rather than competing with it in the cascade.
  const widthClass = /(?:^|\s)(?:!?)max-w-/.test(className ?? "") ? "" : "max-w-[36rem]";
  const visualCenter = availableHeight && viewportTop
    ? `${Number.parseFloat(viewportTop) + Number.parseFloat(availableHeight) / 2}px` : "50dvh";

  useOverlayExit(ref, opener, open, 180);

  return <dialog data-slot="dialog" role={role} ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open) onOpenChange(false); if (opener.current?.isConnected) opener.current.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px", "--lms-visual-bottom": viewportBottom ?? "0px", "--lms-visual-center": visualCenter } as CSSProperties}
    className={cx("fixed left-1/2 top-[var(--lms-visual-center)] m-0 h-auto max-h-[calc(var(--lms-visual-height)_-_3rem)] w-[calc(100%_-_2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-0 text-foreground shadow-[var(--lms-elevation-4)] backdrop:bg-[#1e363f]/10 max-[767px]:left-0 max-[767px]:bottom-[var(--lms-visual-bottom)] max-[767px]:top-auto max-[767px]:max-h-[var(--lms-visual-height)] max-[767px]:w-full max-[767px]:max-w-none max-[767px]:translate-x-0 max-[767px]:translate-y-0 max-[767px]:rounded-b-none", widthClass, className)}>
    <div className="flex max-h-[calc(var(--lms-visual-height)_-_3rem)] min-h-0 min-w-0 flex-col overflow-hidden max-[767px]:max-h-[var(--lms-visual-height)]">
      <div data-slot="dialog-header" className="flex shrink-0 items-start justify-between gap-[var(--lms-space-4)] border-b border-[var(--lms-canvas-border)] bg-surface px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] md:px-[var(--lms-canvas-padding)]">
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-[1.35] text-[var(--lms-heading)]">{title}</h2>
          {description ? <p id={descriptionId} className="mt-[var(--lms-space-1)] break-words text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}
        </div>
        {dismissible ? <Button className="min-h-11 min-w-11 shrink-0 rounded-[var(--lms-control-radius)] bg-surface p-0 text-[var(--lms-muted-text)] shadow-none hover:bg-[var(--lms-neutral-50)] md:min-h-10 md:min-w-10" variant="ghost" aria-label="Close dialog" onClick={() => onOpenChange(false)}><OverlayCloseIcon /></Button> : null}
      </div>
      <ScrollCue axis="y" label={`${title} dialog content`} className="min-h-0 flex-1" viewportClassName={cx("h-full min-h-0 overscroll-contain p-6 md:p-[var(--lms-canvas-padding)]", bodyClassName)}>{children}</ScrollCue>
      {footer ? <div data-slot="dialog-footer" className="flex shrink-0 flex-col gap-[var(--lms-space-2)] max-[639px]:[&>*]:w-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-end border-t border-[var(--lms-canvas-border)] bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:px-6">{footer}</div> : null}
    </div>
  </dialog>;
}
