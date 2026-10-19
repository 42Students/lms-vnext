"use client";

import { useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/** The shared modal traps focus, restores the opener, handles Escape/backdrop
 * and shows truthful scroll fades for long learner content on small screens. */
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
  return (
    <div className={highlighted ? "rounded-[var(--lms-control-radius)] ring-4 ring-[var(--lms-focus-ring)]" : ""}>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="min-h-14 w-full min-w-0 justify-between gap-3 px-4 py-3 text-left">
        <span className="min-w-0">
          <span className="block text-xs font-semibold uppercase text-muted-foreground">
            {caption ?? kind} · {progress.replaceAll("_", " ").toLowerCase()}
            {dueText ? " · Due " + dueText : ""}
          </span>
          <span className="block truncate text-sm font-semibold text-foreground">{title}</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-primary-text">Open ›</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen} title={kind + ": " + title}
        description={caption ?? kind}
        footer={<Button variant="secondary" onClick={() => setOpen(false)}>Close</Button>}>
        {open ? <div className="min-w-0">{children}</div> : null}
      </Dialog>
    </div>
  );
}
