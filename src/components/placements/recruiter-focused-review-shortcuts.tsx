"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Optional N/P navigation within the native recruiter review Drawer.
 * The shared Drawer owns Escape, modal Tab focus confinement, focus return,
 * and native Back handling; shortcuts must not create a second focus trap.
 * Applicant outcomes remain server-authorized and cannot be changed here.
 */
export function RecruiterFocusedReviewShortcuts({
  closeHref: _closeHref,
  previousHref,
  nextHref,
}: {
  closeHref: string;
  previousHref: string | null;
  nextHref: string | null;
}) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.isComposing || e.altKey || e.ctrlKey || e.metaKey) return;

      // The Drawer may call showModal() after this effect mounts. Find the
      // active dialog for each keypress, rather than relying on the deleted
      // recruiter-focused-review-dialog element or a mount-time query.
      const dialogs = document.querySelectorAll<HTMLDialogElement>("dialog[open]");
      const modal = dialogs.item(dialogs.length - 1);
      if (!modal || !modal.contains(document.activeElement)) return;

      const target = e.target;
      if (target instanceof Element &&
          target.closest('input,textarea,select,[contenteditable="true"]')) return;

      if (e.key.toLowerCase() === "n" && nextHref) {
        e.preventDefault();
        router.push(nextHref);
      } else if (e.key.toLowerCase() === "p" && previousHref) {
        e.preventDefault();
        router.push(previousHref);
      }
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, nextHref, previousHref]);

  return previousHref || nextHref
    ? <p className="mt-2 text-[13px] leading-5 text-muted-foreground">Keyboard: N next, P previous, Esc close. S pass · W/H waitlist · R not selected · A absent · Z undo draft while results editor is focused. The placement cell applies official results.</p>
    : <p className="mt-2 text-[13px] leading-5 text-muted-foreground">Press Esc to close this applicant review.</p>;
}
