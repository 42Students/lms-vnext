"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";

export function Drawer({
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
    const panel = ref.current;
    if (!panel) return;

    if (open && !panel.open) {
      panel.showModal();
    } else if (!open && panel.open) {
      panel.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="drawer-title"
      aria-describedby={
        description ? "drawer-description" : undefined
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
      className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-[min(42rem,100vw)] max-w-none border-0 border-l border-border bg-surface p-0 text-foreground shadow-2xl backdrop:bg-foreground/30"
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id="drawer-title"
                className="m-0 text-lg font-semibold text-foreground"
              >
                {title}
              </h2>
              {description ? (
                <p
                  id="drawer-description"
                  className="mt-1 text-sm leading-6 text-body"
                >
                  {description}
                </p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Close drawer"
              onClick={() => onOpenChange(false)}
            >
              ×
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </dialog>
  );
}
