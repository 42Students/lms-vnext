"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { courseApiError } from "./learner-course-api";

type Action = "PUBLISH" | "CLOSE" | "ARCHIVE";

function actionLabel(action: Action) {
  switch (action) {
    case "PUBLISH":
      return "Publish";
    case "CLOSE":
      return "Close quiz";
    case "ARCHIVE":
      return "Archive";
  }
}

export function FacultyItemActions({
  transitionUrl,
  actions,
  contentType,
}: {
  transitionUrl: string;
  actions: readonly Action[];
  contentType?:"VIDEO"|"YOUTUBE"|"RESOURCE"|"LIVE_CLASS";
}) {
  const router = useRouter();
  const [active, setActive] =
    useState<Action | null>(null);
  const [error, setError] =
    useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const warning = contentType==="RESOURCE"
    ? "Remove this Resource? The lesson entry will be hidden; stored files are retained."
    : contentType==="VIDEO" ? "Delete the video"
    : contentType==="YOUTUBE" ? "Delete the YouTube video"
    : contentType==="LIVE_CLASS" ? "Delete the live class"
    : "Archive this item? Historical records will be retained.";

  async function run(action: Action) {
    setError(null);
    setActive(action);

    try {
      const response = await fetch(
        transitionUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Could not update this Course item. Check your connection and try again.",
      );
    } finally {
      setActive(null);
      setConfirmAction(null);
    }
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
            variant={
              action === "ARCHIVE"
                ? "ghost"
                : "secondary"
            }
            disabled={active !== null}
            onClick={() => action === "PUBLISH" ? void run(action) : setConfirmAction(action)}
          >
            {active === action
              ? "Saving…"
              : actionLabel(action)}
          </Button>
        ))}
      </div>
      {error ? (
        <p
          role="alert"
          className="mt-2 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
    </div>
    <ConfirmDialog
      open={confirmAction!==null}
      onOpenChange={open=>{if(!open && active===null)setConfirmAction(null);}}
      title={confirmAction==="CLOSE"?"Close quiz":"Archive content"}
      description={confirmAction==="CLOSE"
        ? "Close this quiz? Learners will not be able to submit any more attempts."
        : warning}
      confirmLabel={confirmAction==="CLOSE"?"Close quiz":"Archive"}
      confirmVariant="danger"
      pending={active!==null}
      onConfirm={()=>{if(confirmAction)void run(confirmAction);}}
    />
    </>
  );
}
