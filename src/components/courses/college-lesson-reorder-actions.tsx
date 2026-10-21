"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

export function CollegeLessonReorderActions({
  learningPathId, lessonId, expectedSequence, canMoveUp, canMoveDown,
  fullCourseOrder = false, hasActiveFilters = false,
  listUnavailable = false, courseName,
}: {
  learningPathId: string;
  lessonId: string;
  expectedSequence: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Only true for a complete, unpaginated, authorized single-course sequence. */
  fullCourseOrder?: boolean;
  hasActiveFilters?: boolean;
  listUnavailable?: boolean;
  courseName?: string;
}) {
  const [direction, setDirection] = useState<"UP" | "DOWN" | null>(null);
  const [pending, startTransition] = useTransition();
  const mutationLock=useRef(false);
  const scopeKey=learningPathId+":"+lessonId+":"+expectedSequence;
  const currentScope=useRef(scopeKey);
  currentScope.current=scopeKey;
  useEffect(()=>{setDirection(null);},[scopeKey]);
  const router = useRouter();
  const { showToast } = useToast();
  // Never infer that the current page contains the final lesson; paginated
  // fragments have no reliable "Move down" boundary. Fail closed until the
  // full ordering workspace explicitly provides this proof and its course.
  const ready=fullCourseOrder && !hasActiveFilters && !listUnavailable &&
    Boolean(courseName?.trim()) && Boolean(learningPathId) && Boolean(lessonId) &&
    Number.isInteger(expectedSequence) && expectedSequence >= 0;

  function confirm() {
    if (!ready || !direction || pending || mutationLock.current) return;
    const requested = direction;
    const requestScope=scopeKey;
    if(requested==="UP"?!canMoveUp:!canMoveDown)return;
    mutationLock.current=true;
    startTransition(async () => {
      try {
        await apiFetch<unknown>("/api/courses/lessons/reorder", {
          method: "POST", credentials:"same-origin",timeoutMs:12000,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ learningPathId, lessonId, expectedSequence, direction: requested }),
        });
        if(currentScope.current!==requestScope)return;
        setDirection(null);
        showToast({ tone: "success", title: `Saved lesson order for ${courseName}.` });
        router.refresh();
      } catch (error) {
        // No optimistic sort is applied; refreshing restores the authoritative
        // server order after validation or optimistic concurrency conflicts.
        if(currentScope.current!==requestScope)return;
        setDirection(null);
        showToast({ tone: "error", title: "Couldn't save order. Previous order restored.",
          description: error instanceof Error ? error.message : friendlyApiError({network:true}) });
        router.refresh();
      } finally {
        mutationLock.current=false;
      }
    });
  }

  return <>
    <div role="group" className="flex min-w-0 w-full flex-wrap items-center gap-2 sm:w-auto"
      aria-label={"Lesson order controls for "+(courseName?.trim()||"selected course")}>
      <Button size="sm" className="min-h-11 min-w-0 flex-1 sm:flex-none md:min-h-9" variant="secondary"
        disabled={!ready || !canMoveUp || pending}
        aria-label="Move selected lesson up one position" onClick={() => setDirection("UP")}>Move up</Button>
      <Button size="sm" className="min-h-11 min-w-0 flex-1 sm:flex-none md:min-h-9" variant="secondary"
        disabled={!ready || !canMoveDown || pending}
        aria-label="Move selected lesson down one position" onClick={() => setDirection("DOWN")}>Move down</Button>
    </div>
    {!ready ? <p role="status" className="m-0 text-xs text-muted-foreground">
      Select one course and load its complete, unfiltered lesson order before reordering.
    </p> : <p role="status" className="m-0 text-xs text-muted-foreground">
      Use Move up or Move down with keyboard Enter/Space. To drag and drop or reorder
      the full sequence in one save, open the offering&apos;s Reorder Lessons panel.
      Search and active filters pause reordering.
    </p>}
    <ConfirmDialog
      open={ready && direction !== null}
      onOpenChange={(open) => { if (!open && !pending) setDirection(null); }}
      title="Change lesson order?"
      description="This changes the shared lesson order for every delivery of this offering. Unsaved form edits are not changed."
      confirmLabel={direction === "UP" ? "Move lesson up" : "Move lesson down"} confirmVariant="primary"
      pending={pending}
      onConfirm={confirm}
    />
  </>;
}
