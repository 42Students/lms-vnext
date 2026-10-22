"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Alert } from "@/components/ui/alert";
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
  const mutationRef=useRef(false);
  const warning = contentType==="RESOURCE"
    ? "Remove this Resource? The lesson entry will be hidden; stored files are retained."
    : contentType==="VIDEO" ? "Delete the video"
    : contentType==="YOUTUBE" ? "Delete the YouTube video"
    : contentType==="LIVE_CLASS" ? "Delete the live class"
    : "Archive this item? Historical records will be retained.";

  async function run(action: Action) {
    if(mutationRef.current)return;
    mutationRef.current = true;
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
          (await courseApiError(response)) ?? "Could not update this Course item.",
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        "Could not update this Course item. Check your connection and try again.",
      );
    } finally {
      mutationRef.current = false;
      setActive(null);
      setConfirmAction(null);
    }
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <>
    <div className="mt-[var(--lms-space-3)] min-w-0 space-y-[var(--lms-space-2)]">
      <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] md:flex md:flex-wrap md:items-center">
        {actions.filter(action => action !== "ARCHIVE" || actions.length === 1).map((action) => (
          <Button
            key={action}
            size="md"
            className={actions.length === 1 ? "col-span-2 min-h-11 w-full md:w-auto md:min-h-[var(--lms-control-height)]" : "min-h-11 w-full md:w-auto md:min-h-[var(--lms-control-height)]"}
            variant={
              action === "ARCHIVE"
                ? "ghost"
                : action === "PUBLISH" ? "primary" : "secondary"
            }
            disabled={active !== null}
            onClick={() => {setError(null);if(action === "PUBLISH")void run(action);else setConfirmAction(action);}}
          >
            {active === action
              ? "Saving…"
              : actionLabel(action)}
          </Button>
        ))}
        {actions.includes("ARCHIVE") && actions.length > 1 ? <Dropdown trigger="More" label="Item actions" align="end" mobileSheet triggerClassName="w-full md:!min-h-9">
          <Menu className="w-full min-w-0"><MenuItem disabled={active !== null} onClick={() => {setError(null);setConfirmAction("ARCHIVE");}}>Archive</MenuItem></Menu>
        </Dropdown> : null}
      </div>
      {error ? (
        <Alert tone="error">{error}</Alert>
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
