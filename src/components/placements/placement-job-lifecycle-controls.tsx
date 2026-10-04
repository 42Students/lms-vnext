"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
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
    headers: body
      ? {
          "content-type":
            "application/json",
        }
      : undefined,
    body: body
      ? JSON.stringify(body)
      : undefined,
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
    <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="m-0 text-sm font-semibold text-foreground">
            Opportunity lifecycle
          </p>
          <StatusBadge tone={tone(status)}>
            {status}
          </StatusBadge>
        </div>
        <p className="mt-1 text-xs leading-5 text-body">
          {status === "DRAFT"
            ? "Finish eligibility and round planning, then publish when learner access should begin."
            : status === "PUBLISHED"
              ? "The opportunity is live. Closing stops new applications without deleting history."
              : status === "CLOSED"
                ? "The opportunity is closed and may now be archived from active operations."
                : "Archived opportunities are retained as historical placement records."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" ? (
          <>
            <Button
              size="sm"
              disabled={pending}
              onClick={publish}
            >
              {pending
                ? "Publishing…"
                : "Publish"}
            </Button>
            {confirmAction ===
            "ARCHIVE" ? (
              <>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={archive}
                >
                  Confirm archive
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    setConfirmAction(null)
                  }
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                disabled={pending}
                onClick={() =>
                  setConfirmAction(
                    "ARCHIVE",
                  )
                }
              >
                Archive draft
              </Button>
            )}
          </>
        ) : null}

        {status === "PUBLISHED" ? (
          confirmAction === "CLOSE" ? (
            <>
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={close}
              >
                Confirm close
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  setConfirmAction(null)
                }
              >
                Keep live
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setConfirmAction("CLOSE")
              }
            >
              Close opportunity
            </Button>
          )
        ) : null}

        {status === "CLOSED" ? (
          confirmAction === "ARCHIVE" ? (
            <>
              <Button
                size="sm"
                variant="danger"
                disabled={pending}
                onClick={archive}
              >
                Confirm archive
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  setConfirmAction(null)
                }
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setConfirmAction(
                  "ARCHIVE",
                )
              }
            >
              Archive
            </Button>
          )
        ) : null}
      </div>
    </section>
  );
}
