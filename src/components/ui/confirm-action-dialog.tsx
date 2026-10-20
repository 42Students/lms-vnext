"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

/** Accessible confirmation, preserving the legacy confirm-action props. */
export function ConfirmActionDialog({ open, title, consequence, onCancel, onConfirm,
  confirmLabel = "Confirm", pending = false, undoHint }: {
    open: boolean; title: string; consequence: string; onCancel: () => void; onConfirm: () => void;
    confirmLabel?: string; pending?: boolean; undoHint?: string;
  }) {
  return <Dialog open={open} onOpenChange={next => { if (!next && !pending) onCancel(); }} title={title}
    description={consequence} role="alertdialog" dismissible={!pending}
    className="lms-legacy-confirm-dialog" bodyClassName={undoHint ? "!min-w-0 !px-4 !py-4 md:!px-[var(--lms-canvas-padding)]" : "!p-0"}
    footer={<div className="flex w-full min-w-0 flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" autoFocus disabled={pending} onClick={onCancel}>Cancel</Button>
      <Button type="button" variant="danger" className="min-h-11 w-full sm:w-auto md:min-h-9" aria-live="polite" loading={pending} disabled={pending} onClick={onConfirm}>{pending ? "Working…" : confirmLabel}</Button>
    </div>}>
    {undoHint ? <p className="m-0 min-w-0 max-w-prose break-words [overflow-wrap:anywhere] text-[13px] leading-5 text-[var(--lms-body-text)]">{undoHint}</p> : null}
  </Dialog>;
}
