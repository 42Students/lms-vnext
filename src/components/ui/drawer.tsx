"use client";

import { useEffect, useId, useRef, type ReactNode, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
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
};

export function Drawer({ open, onOpenChange, title, description, children, footer, dismissible = true, historyMode = "marker" }: DrawerProps) {
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
  return <dialog ref={ref} data-slot="drawer" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    style={{ "--lms-visual-height": availableHeight ?? "100dvh", "--lms-visual-top": viewportTop ?? "0px" } as CSSProperties}
    className="fixed inset-x-0 top-[var(--lms-visual-top)] m-0 h-[var(--lms-visual-height)] max-h-none w-full max-w-none border-0 bg-surface p-0 text-foreground shadow-[-4px_0_24px_rgba(0,0,0,0.12)] backdrop:bg-foreground/30 sm:top-[var(--lms-visual-top)] sm:bottom-auto sm:right-0 sm:left-auto sm:w-[min(42rem,100vw)] sm:border-l sm:border-border">
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="min-w-0"><h2 id={titleId} className="m-0 break-words text-lg font-semibold leading-[1.35] text-[#172033]">{title}</h2>
          {description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-body">{description}</p> : null}</div>
        {dismissible ? <Button variant="ghost" aria-label="Close drawer" onClick={() => onOpenChange(false)}>×</Button> : null}
      </header>
      <ScrollCue axis="y" label={`${title} drawer content`} className="min-h-0 flex-1" viewportClassName="h-full min-h-0 p-4 sm:p-6">{children}</ScrollCue>
      {footer ? <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</footer> : null}
    </div>
  </dialog>;
}
