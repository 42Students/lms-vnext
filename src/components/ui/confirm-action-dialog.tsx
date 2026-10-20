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
    className="lms-legacy-confirm-dialog" bodyClassName={undoHint ? "!px-4 !py-4 min-[768px]:!px-[30px] min-[768px]:!py-[30px]" : "!p-0"}
    footer={<>
      <Button variant="secondary" autoFocus disabled={pending} onClick={onCancel}>Cancel</Button>
      <Button variant="danger" aria-live="polite" loading={pending} disabled={pending} onClick={onConfirm}>{pending ? "Working…" : confirmLabel}</Button>
    </>}>
    {undoHint ? <p className="m-0 max-w-prose break-words text-[13px] leading-5 text-[var(--lms-body-text)]">{undoHint}</p> : null}
  </Dialog>;
}
