"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type LearnerPlacementRequestItem = {
  requestId: string;
  applicationId: string;
  jobTitle: string;
  requestType: string;
  status: string;
  reason: string;
  decisionReason: string | null;
  requestedPayload: unknown;
  createdAt: string;
  effectAppliedAt: string | null;
  cancelledAt: string | null;
};

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

function tone(status: string) {
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

function formatWhen(value: string) {
  return new Intl.DateTimeFormat(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    },
  ).format(new Date(value));
}

function requestedDetail(
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
      "Requested deadline: " +
      formatWhen(
        value.requestedExpiresAt,
      )
    );
  }

  if (
    typeof value.requestedScheduledAt ===
    "string"
  ) {
    return (
      "Requested time: " +
      formatWhen(
        value.requestedScheduledAt,
      )
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
      ": " +
      value.requestedValue
    );
  }

  return null;
}

export function LearnerPlacementRequests({
  requests,
}: {
  requests:
    readonly LearnerPlacementRequestItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);

  async function cancel(
    requestId: string,
  ) {
    setPendingId(requestId);
    try {
      const response = await fetch(
        `/api/placements/requests/${requestId}/actions`,
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            action: "CANCEL",
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
        title: "Request cancelled",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title:
          "Could not cancel request",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPendingId(null);
    }
  }

  if (requests.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="m-0 text-base font-semibold text-foreground">
          Requests & exceptions
        </h2>
        <p className="mt-1 text-sm text-body">
          Requests stay pending until the placement team makes an explicit decision. Approved requests show only after the requested domain change succeeds.
        </p>
      </div>
      <div className="grid gap-3">
        {requests.map((item) => {
          const detail =
            requestedDetail(
              item.requestedPayload,
            );
          return (
            <article
              key={item.requestId}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-sm font-semibold text-foreground">
                    {humanize(
                      item.requestType,
                    )}
                    {" · "}
                    {item.jobTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Requested{" "}
                    {formatWhen(
                      item.createdAt,
                    )}
                  </p>
                </div>
                <StatusBadge
                  tone={tone(item.status)}
                >
                  {humanize(
                    item.status,
                  )}
                </StatusBadge>
              </div>
              <p className="mt-3 text-sm leading-6 text-body">
                {item.reason}
              </p>
              {detail ? (
                <p className="mt-2 text-xs font-semibold text-body">
                  {detail}
                </p>
              ) : null}
              {item.decisionReason ? (
                <div className="mt-3 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-body">
                  Placement team:{" "}
                  {item.decisionReason}
                </div>
              ) : null}
              {item.status ===
              "PENDING" ? (
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={
                      pendingId !== null
                    }
                    onClick={() =>
                      cancel(
                        item.requestId,
                      )
                    }
                  >
                    {pendingId ===
                    item.requestId
                      ? "Cancelling…"
                      : "Cancel request"}
                  </Button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
