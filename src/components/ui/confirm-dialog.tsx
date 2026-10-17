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
  return <Dialog open={open} onOpenChange={onOpenChange} title={title} description={description} dismissible={!pending}
    footer={<><Button variant="secondary" autoFocus disabled={pending} onClick={() => onOpenChange(false)}>{cancelLabel}</Button>
      <Button variant={confirmVariant} loading={pending} disabled={pending || confirmDisabled} onClick={onConfirm}>{pending ? "Working…" : confirmLabel}</Button></>}>
    {children ?? <p className="m-0 text-sm leading-6 text-body">This action will be applied immediately.</p>}
  </Dialog>;
}
