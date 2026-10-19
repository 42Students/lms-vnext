"use client";

import { useEffect, useId, useRef, type ReactNode, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
import { useOverlayWebview } from "@/components/ui/use-overlay-webview";

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  dismissible?: boolean;
};

export function BottomSheet({ open, onOpenChange, title, description, children, footer, dismissible = true }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();
  const { availableHeight, viewportTop, viewportBottom } = useOverlayWebview({ open, dismissible, onDismiss: () => onOpenChange(false) });
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
  return (
    <dialog data-slot="bottom-sheet" ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
      onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
      onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
      style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px", "--lms-visual-bottom": viewportBottom ?? "0px" } as CSSProperties}
      className="fixed inset-x-0 bottom-[var(--lms-visual-bottom)] top-auto m-0 max-h-[var(--lms-visual-height)] min-h-0 w-full max-w-none rounded-t-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-0 text-foreground shadow-[var(--lms-elevation-4)] backdrop:bg-[#1e363f]/10 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100%_-_2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[var(--lms-canvas-radius)]">
      <div className="flex max-h-[var(--lms-visual-height)] min-h-0 flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--lms-canvas-border)] p-[var(--lms-space-4)]">
          <div className="min-w-0"><h2 id={titleId} className="m-0 text-lg font-semibold leading-[1.35] text-[var(--lms-heading)]">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-[13px] leading-5 text-[var(--lms-body-text)]">{description}</p> : null}</div>
          {dismissible ? <Button className="min-h-11 min-w-11 rounded-[var(--lms-control-radius)] text-[var(--lms-muted-text)] hover:bg-[var(--lms-neutral-100)]" variant="ghost" aria-label="Close sheet" onClick={() => onOpenChange(false)}>×</Button> : null}
        </header>
        <ScrollCue axis="y" label={`${title} sheet content`} className="min-h-0 flex-1" viewportClassName="min-h-0 max-h-[calc(var(--lms-visual-height)-8rem)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</ScrollCue>
        {footer ? <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[var(--lms-canvas-border)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
