"use client";

import { useEffect, type RefObject } from "react";

/** One native-dialog close path for dialogs, side drawers, and mobile sheets.
 * The element remains in the browser top layer during its exit animation.
 * Reopening cancels the pending close. Reduced-motion closes immediately.
 */
export function useOverlayExit(
  dialogRef: RefObject<HTMLDialogElement | null>,
  openerRef: RefObject<HTMLElement | null>,
  open: boolean,
  exitDurationMs: number,
) {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let timeout: number | undefined;
    if (open) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
      }
    } else if (dialog.open) {
      const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
      if (reduceMotion || exitDurationMs <= 0) {
        dialog.close();
        openerRef.current?.focus();
      } else {
        dialog.setAttribute("data-closing", "true");
        timeout = window.setTimeout(() => {
          dialog.removeAttribute("data-closing");
          if (dialog.open) dialog.close();
          openerRef.current?.focus();
        }, exitDurationMs);
      }
    }
    return () => { if (timeout !== undefined) window.clearTimeout(timeout); };
  }, [open, dialogRef, openerRef, exitDurationMs]);
}
