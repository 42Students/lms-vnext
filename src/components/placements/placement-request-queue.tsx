"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type PlacementRequestQueueItem = {
  requestId: string;
  requestType: string;
  status: string;
  reason: string;
  decisionReason: string | null;
  requestedPayload: unknown;
  createdAt: string;
  jobTitle: string;
  learnerName: string;
};

const directlyExecutable = new Set([
  "APPLICATION_WITHDRAWAL",
  "OFFER_EXTENSION",
]);

function humanize(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function statusTone(status: string) {
  if (status === "APPROVED") {
    return "success" as const;
  }
  if (status === "REJECTED") {
    return "error" as const;
  }
  if (status === "PENDING") {
    return "warning" as const;
  }
  return "neutral" as const;
}

function payloadSummary(
  payload: unknown,
) {
  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload)
  ) {
    return null;
  }
  const value = payload as Record<
    string,
    unknown
  >;
  if (
    typeof value.requestedExpiresAt ===
    "string"
  ) {
    return (
      "Requested expiry: " +
      new Date(
        value.requestedExpiresAt,
      ).toLocaleString("en-IN")
    );
  }
  if (
    typeof value.requestedScheduledAt ===
    "string"
  ) {
    return (
      "Requested schedule: " +
      new Date(
        value.requestedScheduledAt,
      ).toLocaleString("en-IN")
    );
  }
  if (
    typeof value.correctionField ===
      "string" &&
    typeof value.requestedValue ===
      "string"
  ) {
    return (
      value.correctionField +
      " → " +
      value.requestedValue
    );
  }
  return null;
}

export function PlacementRequestQueue({
  requests,
}: {
  requests:
    readonly PlacementRequestQueueItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);

  async function decide(
    item: PlacementRequestQueueItem,
    action: "APPROVE" | "REJECT",
  ) {
    let reason: string | undefined;
    if (action === "REJECT") {
      reason =
        window.prompt(
          "Reason shown to the learner",
        )?.trim();
      if (!reason) return;
    }

    setPendingId(item.requestId);
    try {
      const response = await fetch(
        `/api/placements/requests/${item.requestId}/actions`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            ...(reason
              ? { reason }
              : {}),
          }),
        },
      );
      const payload = await response
        .json()
        .catch(() => null);
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "PLACEMENT_REQUEST_FAILED",
        );
      }

      showToast({
        tone: "success",
        title:
          action === "APPROVE"
            ? "Request approved"
            : "Request rejected",
        description:
          action === "APPROVE"
            ? "The requested domain change and approval were committed together."
            : "The learner has been notified.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Could not resolve request",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  const pending = requests.filter(
    (item) =>
      item.status === "PENDING",
  );
  const recent = requests
    .filter(
      (item) =>
        item.status !== "PENDING",
    )
    .slice(0, 5);

  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="m-0 text-base font-semibold text-foreground">
          Learner requests
        </h2>
        <p className="mt-1 text-sm text-body">
          Approvals are atomic: the request is never marked approved unless its domain effect succeeds.
        </p>
      </div>
      {pending.length === 0 ? (
        <p className="m-0 text-sm text-muted-foreground">
          No learner requests need action.
        </p>
      ) : (
        <div className="grid gap-3">
          {pending.map((item) => {
            const executable =
              directlyExecutable.has(
                item.requestType,
              );
            const detail =
              payloadSummary(
                item.requestedPayload,
              );
            return (
              <article
                key={item.requestId}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="m-0 font-semibold text-foreground">
                      {item.learnerName}
                      {" · "}
                      {humanize(
                        item.requestType,
                      )}
                    </p>
                    <p className="mt-1 text-sm text-body">
                      {item.jobTitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-body">
                      {item.reason}
                    </p>
                    {detail ? (
                      <p className="mt-2 text-xs font-semibold text-muted-foreground">
                        {detail}
                      </p>
                    ) : null}
                    {!executable ? (
                      <p className="mt-2 text-xs font-semibold text-warning-text">
                        This request type does not yet have an automatic approval effect. It can be rejected or left pending; the system will not fake an approval.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {executable ? (
                      <Button
                        size="sm"
                        disabled={
                          pendingId !== null
                        }
                        onClick={() =>
                          decide(
                            item,
                            "APPROVE",
                          )
                        }
                      >
                        {pendingId ===
                        item.requestId
                          ? "Saving…"
                          : "Approve"}
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={
                        pendingId !== null
                      }
                      onClick={() =>
                        decide(
                          item,
                          "REJECT",
                        )
                      }
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {recent.length > 0 ? (
        <div className="border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Recent decisions
          </p>
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => (
              <div
                key={item.requestId}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs"
              >
                <span className="font-semibold text-body">
                  {item.learnerName}
                  {" · "}
                  {humanize(
                    item.requestType,
                  )}
                </span>
                <StatusBadge
                  tone={statusTone(
                    item.status,
                  )}
                >
                  {humanize(
                    item.status,
                  )}
                </StatusBadge>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
