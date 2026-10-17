"use client";

/**
 * GR-35: accessible confirmation with plain consequences; avoid native browser prompts.
 * Usage: <ConfirmActionDialog open={open} title="Remove student"
 *   consequence="This removes their access." onCancel={close}
 *   onConfirm={remove} confirmLabel="Remove student" />
 */
import { useEffect, useRef } from "react";
export function ConfirmActionDialog({ open, title, consequence, onCancel, onConfirm,
  confirmLabel = "Confirm", pending = false, undoHint }: {
    open: boolean;
    title: string;
    consequence: string;
    onCancel: () => void;
    onConfirm: () => void;
    confirmLabel?: string;
    pending?: boolean;
    undoHint?: string;
  }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) cancelRef.current?.focus();
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5"
      onKeyDown={(event) => { if (event.key === "Escape" && !pending) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="confirm-title"
        aria-describedby="confirm-consequence"
        className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h2 id="confirm-title" className="text-xl font-semibold text-foreground">{title}</h2>
        <p id="confirm-consequence" className="mt-3 text-sm text-body">{consequence}</p>
        {undoHint && <p className="mt-2 text-sm text-muted-foreground">{undoHint}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={pending}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-foreground focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={pending}
            className="min-h-11 rounded-md border border-error bg-error px-4 text-sm font-semibold text-on-primary focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)]">
            {pending ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
