"use client";

import { useEffect, useId, useRef, type ReactNode, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
};

export function Dialog({ open, onOpenChange, title, description, children, footer, dismissible = true }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { availableHeight, viewportTop } = useOverlayWebview({ open, dismissible, onDismiss: () => onOpenChange(false) });

  useEffect(() => {
    const modal = ref.current;
    if (!modal) return;
    if (open && !modal.open) {
      opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      modal.showModal();
    } else if (!open && modal.open) {
      modal.close();
      opener.current?.focus();
    }
  }, [open]);

  return <dialog data-slot="dialog" ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px" } as CSSProperties}
    className="fixed left-1/2 top-[calc(var(--lms-visual-top)+var(--lms-visual-height)/2)] m-0 h-auto max-h-[calc(var(--lms-visual-height)-3rem)] w-[calc(100%-2rem)] max-w-[36rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-0 text-foreground shadow-[var(--lms-elevation-4)] backdrop:bg-foreground/30">
    <div className="flex max-h-[calc(var(--lms-visual-height)-3rem)] min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--lms-canvas-border)] bg-surface px-4 py-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-[var(--lms-canvas-padding)]">
        <div className="min-w-0">
          <h2 id={titleId} className="m-0 break-words text-[var(--lms-font-lg)] font-semibold leading-[1.35] text-[var(--lms-heading)]">{title}</h2>
          {description ? <p id={descriptionId} className="mt-[var(--lms-space-1)] text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}
        </div>
        {dismissible ? <Button className="min-h-11 min-w-11 shrink-0 rounded-[var(--lms-control-radius)] text-[var(--lms-muted-text)] hover:bg-[var(--lms-neutral-100)]" variant="ghost" aria-label="Close dialog" onClick={() => onOpenChange(false)}><span aria-hidden="true">×</span></Button> : null}
      </div>
      <ScrollCue axis="y" label={`${title} dialog content`} className="min-h-0 flex-1" viewportClassName="h-full min-h-0 overscroll-contain p-4 sm:p-[var(--lms-canvas-padding)]">{children}</ScrollCue>
      {footer ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--lms-canvas-border)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div> : null}
    </div>
  </dialog>;
}
