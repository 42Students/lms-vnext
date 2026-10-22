"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { InlineNotice } from "@/components/ui/inline-notice";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";

type CancelFeedback = { tone: "success" | "error"; message: string } | null;

/** REC-home-drives-12/22: cancel an unpublished, recruiter-owned request.
 * The optimistic updatedAt token and membership guard are enforced by the API. */
export function RecruiterRequestCancelButton({
  requestId,
  collegeId,
  updatedAt,
}: {
  requestId: string;
  collegeId: string;
  updatedAt: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [feedback, setFeedback] = useState<CancelFeedback>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lock = useRef(false);

  function onOpenChange(open: boolean) {
    if (lock.current) return;
    setFeedback(null);
    setConfirmOpen(open);
  }

  async function cancel() {
    if (lock.current || cancelled) return;
    lock.current = true;
    setBusy(true);
    setFeedback(null);
    try {
      const receipt: unknown = await apiFetch("/api/placements/recruiter/drives/requests", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          requestId,
          collegeId,
          action: "CANCEL",
          expectedUpdatedAt: updatedAt,
        }),
      });
      // An HTTP success is not enough: verify the persisted cancellation row.
      const row = receipt && typeof receipt === "object" && !Array.isArray(receipt)
        ? (receipt as { request?: unknown }).request : null;
      if (!row || typeof row !== "object" || Array.isArray(row) ||
          (row as Record<string, unknown>)["id"] !== requestId ||
          (row as Record<string, unknown>)["collegeId"] !== collegeId ||
          (row as Record<string, unknown>)["status"] !== "CANCELLED") {
        throw new Error("CANCELLATION_UNCONFIRMED");
      }
      setCancelled(true);
      setConfirmOpen(false);
      setFeedback({ tone: "success", message: "Request cancelled." });
      router.refresh();
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof FriendlyFetchError ? error.message : friendlyApiError({}),
      });
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 min-w-0">
      {cancelled ? null : (
        <details className="min-w-0">
          <summary className="flex min-h-11 w-full max-w-full cursor-pointer items-center break-words min-[768px]:w-fit text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-[768px]:min-h-9">
            Manage request
          </summary>
          <div className="mt-1 min-w-0">
            <Button
              variant="secondary"
              type="button"
              loading={busy}
              disabled={busy}
              onClick={() => onOpenChange(true)}
              className="min-h-11 w-full border-error/30 text-error min-[768px]:min-h-9 min-[768px]:w-auto"
            >
              {busy ? "Cancelling…" : "Cancel request"}
            </Button>
          </div>
        </details>
      )}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={onOpenChange}
        title="Cancel this drive request?"
        confirmLabel="Cancel request"
        pending={busy}
        onConfirm={() => void cancel()}
      >
        <p className="m-0 min-w-0 max-w-prose break-words text-sm leading-5 text-body">
          The placement cell will no longer review it.
        </p>
        {feedback?.tone === "error" ? (
          <div className="mt-3 min-w-0">
            <InlineNotice tone="error" message={feedback.message} />
          </div>
        ) : null}
      </ConfirmDialog>
      {feedback?.tone === "success" ? (
        <div className="mt-2 min-w-0">
          <InlineNotice tone="success" message={feedback.message} />
        </div>
      ) : null}
    </div>
  );
}
