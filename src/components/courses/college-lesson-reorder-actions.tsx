"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

export function CollegeLessonReorderActions({
  learningPathId, lessonId, expectedSequence, canMoveUp, canMoveDown,
}: {
  learningPathId: string;
  lessonId: string;
  expectedSequence: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const [direction, setDirection] = useState<"UP" | "DOWN" | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { showToast } = useToast();

  function confirm() {
    if (!direction || pending) return;
    const requested = direction;
    startTransition(async () => {
      try {
        await apiFetch<unknown>("/api/courses/lessons/reorder", {
          method: "POST", credentials:"same-origin",timeoutMs:12000,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ learningPathId, lessonId, expectedSequence, direction: requested }),
        });
        setDirection(null);
        showToast({ tone: "success", title: "Lesson order updated" });
        router.refresh();
      } catch (error) {
        showToast({ tone: "error", title: "Reorder failed",
          description: error instanceof Error ? error.message : friendlyApiError({network:true}) });
      }
    });
  }

  return <>
    <div className="flex flex-wrap gap-1" aria-label="Lesson order controls">
      <Button size="sm" variant="secondary" disabled={!canMoveUp || pending}
        onClick={() => setDirection("UP")}>Move up</Button>
      <Button size="sm" variant="secondary" disabled={!canMoveDown || pending}
        onClick={() => setDirection("DOWN")}>Move down</Button>
    </div>
    <ConfirmDialog
      open={direction !== null}
      onOpenChange={(open) => { if (!open) setDirection(null); }}
      title="Change lesson order?"
      description="This changes the shared lesson order for every delivery of this offering."
      confirmLabel={direction === "UP" ? "Move lesson up" : "Move lesson down"}
      pending={pending}
      onConfirm={confirm}
    />
  </>;
}
