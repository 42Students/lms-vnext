"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      aria-describedby={
        description ? "dialog-description" : undefined
      }
      onCancel={(event) => {
        event.preventDefault();
        onOpenChange(false);
      }}
      onClose={() => {
        if (open) {
          onOpenChange(false);
        }
      }}
      className="m-auto w-[min(36rem,calc(100%-2rem))] rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-foreground/30"
    >
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="dialog-title"
              className="m-0 text-lg font-semibold text-foreground"
            >
              {title}
            </h2>
            {description ? (
              <p
                id="dialog-description"
                className="mt-1 text-sm leading-6 text-body"
              >
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Close dialog"
            onClick={() => onOpenChange(false)}
          >
            ×
          </Button>
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
