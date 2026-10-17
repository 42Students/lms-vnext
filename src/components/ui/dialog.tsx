"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

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

  return <dialog ref={ref} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); if (dismissible) onOpenChange(false); }}
    onClose={() => { if (open) onOpenChange(false); opener.current?.focus(); }}
    onClick={event => { if (event.target === ref.current && dismissible) onOpenChange(false); }}
    className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none border-0 bg-surface p-0 text-foreground backdrop:bg-foreground/30 sm:m-auto sm:h-auto sm:max-h-[90dvh] sm:w-[min(36rem,calc(100%-2rem))] sm:rounded-xl sm:border sm:border-border sm:shadow-lg">
    <div className="flex h-full max-h-[100dvh] min-h-0 flex-col sm:max-h-[90dvh]">
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="min-w-0">
          <h2 id={titleId} className="m-0 break-words text-lg font-semibold leading-7 text-foreground">{title}</h2>
          {description ? <p id={descriptionId} className="mt-1 text-sm leading-6 text-body">{description}</p> : null}
        </div>
        {dismissible ? <Button variant="ghost" aria-label="Close dialog" onClick={() => onOpenChange(false)}>×</Button> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      {footer ? <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6">{footer}</div> : null}
    </div>
  </dialog>;
}
