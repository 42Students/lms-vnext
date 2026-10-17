"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Native dialog gives keyboard Escape, focus containment and modal semantics.
 * The authorized Server Component content mounts only while the dialog is open. */
export function LearnerRoadmapItemDialog({
  children, title, kind, progress, caption, dueText, initiallyOpen = false, highlighted = false,
}: {
  children: ReactNode;
  title: string;
  kind: "Content" | "Assignment" | "Quiz";
  progress: string;
  caption?: string;
  dueText?: string;
  initiallyOpen?: boolean;
  highlighted?: boolean;
}) {
  const [open, setOpen] = useState(initiallyOpen);
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <div className={highlighted ? "rounded-xl ring-4 ring-[var(--lms-focus-ring)]" : ""}>
      <button type="button" onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex min-h-14 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 text-left hover:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]">
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">
            {caption ?? kind} · {progress.replaceAll("_", " ").toLowerCase()}
            {dueText ? " · Due " + dueText : ""}
          </span>
          <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-primary-text">Open ›</span>
      </button>
      <dialog ref={ref} onClose={() => setOpen(false)}
        aria-label={`${kind}: ${title}`}
        className="m-auto max-h-[90vh] w-[min(94vw,55rem)] overflow-y-auto rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-foreground/50">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-surface px-4 py-3">
          <div className="min-w-0">
            <p className="m-0 text-xs font-semibold text-muted-foreground">{kind}</p>
            <h3 className="m-0 truncate text-base font-semibold text-foreground">{title}</h3>
          </div>
          <button type="button" onClick={() => setOpen(false)}
            className="min-h-11 shrink-0 rounded-lg border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-primary">
            Close
          </button>
        </div>
        {open ? <div className="p-4">{children}</div> : null}
      </dialog>
    </div>
  );
}
