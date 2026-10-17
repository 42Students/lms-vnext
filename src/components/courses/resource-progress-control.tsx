"use client";

import { useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { courseApiError } from "./learner-course-api";

export function ResourceProgressControl({
  contentId,
  deliveryId,
  contentType = "RESOURCE",
}: {
  contentId: string;
  deliveryId: string;
  contentType?: "RESOURCE" | "LIVE_CLASS";
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [saving, setSaving] = useState(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [complete, setComplete] =
    useState(false);


  async function markComplete() {
    if (saving || complete) return;
    setConfirmOpen(false);
    setError(null);
    setSaving(true);

    try {
      const response = await fetch(
        `/api/courses/progress/${contentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            deliveryId,
            completed: true,
          }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      setComplete(true);
      router.refresh();
    } catch {
      setError("Could not mark this as complete. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-3">
      <Button
        size="sm"
        variant={
          complete ? "secondary" : "primary"
        }
        disabled={!hydrated || saving || complete}
        onClick={() => setConfirmOpen(true)}
      >
        {complete
          ? "Completed"
          : saving
            ? "Saving…"
            : "Mark as complete"}
      </Button>
      {complete ? <p role="status" className="mt-2 text-xs text-success">Marked as complete</p> : null}
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen}
        title={contentType === "LIVE_CLASS" ? "Attended this session?" : "Finished with these materials?"}
        description="Mark this learning item as complete?"
        confirmLabel="Mark as complete" pending={saving} onConfirm={markComplete} />
      {error ? (
        <p
          role="alert"
          className="mt-2 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
