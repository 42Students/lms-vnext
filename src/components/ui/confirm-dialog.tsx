"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function ConfirmDialog({
  open, onOpenChange, title, description, confirmLabel = "Confirm", cancelLabel = "Cancel",
  confirmVariant = "danger", pending = false, confirmDisabled = false, onConfirm, children,
}: {
  open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string;
  confirmLabel?: string; cancelLabel?: string; confirmVariant?: "primary" | "danger";
  pending?: boolean; confirmDisabled?: boolean; onConfirm: () => void; children?: ReactNode;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} role="alertdialog" dismissible={!pending}
    className="lms-legacy-confirm-dialog" bodyClassName="p-[var(--lms-space-4)] md:p-[var(--lms-canvas-padding)]"
    footer={<><Button variant="secondary" autoFocus disabled={pending} onClick={() => onOpenChange(false)} className="min-h-11 w-full sm:w-auto md:min-h-9">{cancelLabel}</Button>
      <Button variant={confirmVariant} loading={pending} disabled={pending || confirmDisabled} onClick={onConfirm} className="min-h-11 w-full sm:w-auto md:min-h-9">{pending ? "Working…" : confirmLabel}</Button></>}>
    {children ?? <p className="m-0 max-w-prose break-words text-[14px] leading-5 text-[var(--lms-body-text)]">This action will be applied immediately.</p>}
  </Dialog>;
}
