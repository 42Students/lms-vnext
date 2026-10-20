"use client";
import { Badge } from "@/components/ui/badge";


import { useState, useSyncExternalStore } from "react";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
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
  const { pending: saving, run } = useGuardedAction();
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [complete, setComplete] =
    useState(false);


  async function markComplete() {
    if (saving || complete) return;
    setError(null);
    try {
      await run(async () => {
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
      });
    } catch {
      setError("Could not mark this as complete. Please try again.");
    } finally {
      setConfirmOpen(false);
    }
  }

  return (
    <div className="min-w-0 space-y-2 border-t border-border pt-3">
      {complete ? (
        <Badge role="status" tone="success" className="inline-flex min-h-11 items-center px-3 md:min-h-9">Marked as complete</Badge>
      ) : (
        <Button size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9"
          variant="primary" disabled={!hydrated||saving}
          loading={saving} onClick={()=>{setError(null);setConfirmOpen(true);}}>
          {saving?"Saving…":"Mark as complete"}
        </Button>
      )}
      <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!saving)setConfirmOpen(next);}}
        title={contentType === "LIVE_CLASS" ? "Attended this session?" : "Finished with these materials?"}
        description="Mark this learning item as complete?"
        confirmLabel="Mark as complete" confirmVariant="primary" pending={saving} onConfirm={markComplete} />
      {error ? <div role="alert"><Alert tone="error">{error}</Alert></div> : null}
    </div>
  );
}
