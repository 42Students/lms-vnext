"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
      onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
      onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
      onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[100dvh] min-h-0 w-full max-w-none rounded-t-xl border border-border bg-surface p-0 text-foreground shadow-lg backdrop:bg-foreground/30 sm:inset-auto sm:left-1/2 sm:top-1/2 sm:w-[min(36rem,calc(100%-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-xl">
      <div className="flex max-h-[100dvh] min-h-0 flex-col pt-[env(safe-area-inset-top)]">
        <header className="flex items-start justify-between gap-4 border-b border-border p-4">
          <div className="min-w-0"><h2 id={titleId} className="text-lg font-semibold leading-7">{title}</h2>
            {description ? <p id={descriptionId} className="mt-1 text-sm text-body">{description}</p> : null}</div>
          {dismissible ? <Button variant="ghost" aria-label="Close sheet" onClick={() => onOpenChange(false)}>×</Button> : null}
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">{children}</div>
        {footer ? <footer className="flex flex-wrap justify-end gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{footer}</footer> : null}
      </div>
    </dialog>
  );
}
