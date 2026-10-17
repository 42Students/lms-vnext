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
    description={consequence} dismissible={!pending}
    footer={<>
      <Button variant="secondary" autoFocus disabled={pending} onClick={onCancel}>Cancel</Button>
      <Button variant="danger" loading={pending} disabled={pending} onClick={onConfirm}>{pending ? "Working…" : confirmLabel}</Button>
    </>}>
    {undoHint ? <p className="text-sm leading-6 text-body">{undoHint}</p> : null}
  </Dialog>;
}
