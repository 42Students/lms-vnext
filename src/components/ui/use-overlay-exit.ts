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
    let onMotionPreferenceChange: ((event: MediaQueryListEvent) => void) | undefined;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const restoreFocus = () => {
      const opener = openerRef.current;
      // The trigger can disappear during a route change; never focus a detached node.
      if (opener?.isConnected) opener.focus();
    };
    const finishClose = () => {
      dialog.removeAttribute("data-closing");
      if (dialog.open) dialog.close();
      restoreFocus();
    };
    if (open) {
      dialog.removeAttribute("data-closing");
      if (!dialog.open) {
        openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        dialog.showModal();
      }
    } else if (dialog.open) {
      if (reducedMotion?.matches || exitDurationMs <= 0) {
        finishClose();
      } else {
        dialog.setAttribute("data-closing", "true");
        timeout = window.setTimeout(finishClose, exitDurationMs);
        // Respect a reduced-motion preference enabled during an in-progress exit.
        onMotionPreferenceChange = event => {
          if (!event.matches) return;
          if (timeout !== undefined) window.clearTimeout(timeout);
          timeout = undefined;
          finishClose();
        };
        reducedMotion?.addEventListener("change", onMotionPreferenceChange);
      }
    }
    return () => {
      if (timeout !== undefined) window.clearTimeout(timeout);
      if (onMotionPreferenceChange) reducedMotion?.removeEventListener("change", onMotionPreferenceChange);
    };
  }, [open, dialogRef, openerRef, exitDurationMs]);
}
