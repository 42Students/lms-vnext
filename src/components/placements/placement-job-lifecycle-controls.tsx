"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type JobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "CLOSED"
  | "ARCHIVED";

function tone(
  status: JobStatus,
): "neutral" | "info" | "success" | "warning" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  if (status === "CLOSED") return "info";
  return "neutral";
}

async function mutate(
  url: string,
  method: "POST" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(url, {
    method,
    ...(body ? {headers: {"content-type": "application/json"}, body: JSON.stringify(body)} : {}),
  });
  const payload = (await response
    .json()
    .catch(() => null)) as
    | { error?: string }
    | null;
  if (!response.ok) {
    throw new Error(
      payload?.error ??
        "Job lifecycle action failed.",
    );
  }
}

export function PlacementJobLifecycleControls({
  jobId,
  status,
}: {
  jobId: string;
  status: JobStatus;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] =
    useState(false);
  const [confirmAction, setConfirmAction] =
    useState<"CLOSE" | "ARCHIVE" | null>(
      null,
    );

  async function publish() {
    setPending(true);
    try {
      await mutate(
        `/api/placements/jobs/${jobId}/status`,
        "POST",
        { action: "PUBLISH" },
      );
      showToast({
        tone: "success",
        title: "Opportunity published",
        description:
          "Eligible learners can now see and apply to the opportunity.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not publish",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function close() {
    setPending(true);
    try {
      await mutate(
        `/api/placements/jobs/${jobId}/status`,
        "POST",
        { action: "CLOSE" },
      );
      showToast({
        tone: "success",
        title: "Opportunity closed",
        description:
          "New applications are stopped; historical placement state is retained.",
      });
      setConfirmAction(null);
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not close opportunity",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  async function archive() {
    setPending(true);
    try {
      await mutate(
        `/api/placements/jobs/${jobId}`,
        "DELETE",
      );
      showToast({
        tone: "success",
        title: "Opportunity archived",
        description:
          "It is removed from active operations while historical records remain intact.",
      });
      setConfirmAction(null);
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not archive opportunity",
        description:
          error instanceof Error
            ? error.message
            : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section className="flex min-w-0 flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h2 className="m-0 text-sm font-semibold text-foreground">Opportunity lifecycle</h2>
            <StatusBadge tone={tone(status)}>{status}</StatusBadge>
          </div>
          <p className="mt-1 max-w-prose text-xs leading-5 text-body">
            {status === "DRAFT"
              ? "Finish eligibility and round planning, then publish when learner access should begin."
              : status === "PUBLISHED"
                ? "The opportunity is live. Closing stops new applications without deleting history."
                : status === "CLOSED"
                  ? "The opportunity is closed and may now be archived from active operations."
                  : "Archived opportunities are retained as historical placement records."}
          </p>
        </div>
        {status !== "ARCHIVED" ? (
          <div className="flex min-w-0 w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
            {status === "DRAFT" ? (
              <Button size="sm" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={publish}>
                {pending ? "Publishing…" : "Publish"}
              </Button>
            ) : null}
            {status === "PUBLISHED" ? (
              <Button size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
                disabled={pending} onClick={() => setConfirmAction("CLOSE")}>Close opportunity</Button>
            ) : null}
            {status === "DRAFT" || status === "CLOSED" ? (
              <Button size="sm" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9"
                disabled={pending} onClick={() => setConfirmAction("ARCHIVE")}>
                {status === "DRAFT" ? "Archive draft" : "Archive"}
              </Button>
            ) : null}
          </div>
        ) : null}
      </section>
      <ConfirmDialog open={confirmAction !== null}
        onOpenChange={open => { if (!open && !pending) setConfirmAction(null); }}
        title={confirmAction === "CLOSE" ? "Close opportunity?" : "Archive opportunity?"}
        description={confirmAction === "CLOSE"
          ? "The opportunity is live. Closing stops new applications without deleting history."
          : "It is removed from active operations while historical records remain intact."}
        confirmLabel={confirmAction === "CLOSE" ? "Confirm close" : "Confirm archive"}
        cancelLabel={confirmAction === "CLOSE" ? "Keep live" : "Cancel"}
        confirmVariant="danger" pending={pending}
        onConfirm={() => { if (confirmAction === "CLOSE") void close(); else if (confirmAction === "ARCHIVE") void archive(); }}
      />
    </>
  );
}
