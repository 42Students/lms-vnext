"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

export type PlacementRequestQueueItem = {
  id: string;
  requestType:
    | "APPLICATION_WITHDRAWAL"
    | "ROUND_RESCHEDULE"
    | "OFFER_EXTENSION";
  status:
    | "PENDING"
    | "APPROVED"
    | "REJECTED"
    | "CANCELLED";
  reason: string;
  decisionNote: string | null;
  requestedAt: string;
  candidateName: string | null;
  candidateEmail: string | null;
  roleTitle: string;
  roundName: string | null;
  roundScheduledAt: string | null;
  offerRoleTitle: string | null;
  offerExpiresAt: string | null;
  effectPayload: Record<string, unknown>;
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

function when(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function PlacementRequestQueue({
  requests,
}: {
  requests: readonly PlacementRequestQueueItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingId, setPendingId] =
    useState<string | null>(null);
  const [notes, setNotes] = useState<
    Record<string, string>
  >({});

  async function decide(
    item: PlacementRequestQueueItem,
    action: "APPROVE" | "REJECT",
  ) {
    const note =
      notes[item.id]?.trim() ?? "";
    if (action === "REJECT" && note.length < 3) {
      showToast({
        tone: "error",
        title: "Decision note required",
        description:
          "Explain why the request is being rejected.",
      });
      return;
    }
    setPendingId(item.id);
    try {
      const response = await fetch(
        "/api/placements/requests/" +
          item.id +
          "/actions",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            action,
            ...(note ? { note } : {}),
          }),
        },
      );
      const payload = (await response
        .json()
        .catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error ??
            "PLACEMENT_REQUEST_ACTION_FAILED",
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
            ? "The approved domain effect was applied in the same transaction."
            : "The placement state was left unchanged.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Decision failed",
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

  const openCount = requests.filter(
    (item) => item.status === "PENDING",
  ).length;

  return (
    <section className="border-b border-border pb-5">
      <div className="border-b border-border pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-foreground">
              Learner requests
            </h2>
            <p className="mt-1 text-sm text-body">
              Review exceptional requests here. Approving a request must apply its real domain effect atomically.
            </p>
          </div>
          <StatusBadge
            tone={
              openCount > 0
                ? "warning"
                : "neutral"
            }
          >
            {openCount} pending
          </StatusBadge>
        </div>
      </div>

      <div className="divide-y divide-border">
        {requests.map((item) => {
          const requestedWhen =
            when(
              item.effectPayload[
                item.requestType ===
                "OFFER_EXTENSION"
                  ? "requestedExpiresAt"
                  : "scheduledAt"
              ],
            );
          const requestedMode =
            typeof item.effectPayload.mode ===
            "string"
              ? humanize(
                  item.effectPayload.mode,
                )
              : null;
          const requestedPlace =
            typeof item.effectPayload.venue ===
            "string"
              ? item.effectPayload.venue
              : typeof item.effectPayload
                    .meetingUrl === "string"
                ? item.effectPayload
                    .meetingUrl
                : null;

          return (
            <article
              key={item.id}
              className="py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="m-0 font-semibold text-foreground">
                    {item.candidateName ??
                      "Learner"}{" "}
                    · {item.roleTitle}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.candidateEmail ??
                      "No email"}{" "}
                    ·{" "}
                    {humanize(
                      item.requestType,
                    )}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    item.status === "APPROVED"
                      ? "success"
                      : item.status ===
                          "REJECTED"
                        ? "error"
                        : item.status ===
                            "PENDING"
                          ? "warning"
                          : "neutral"
                  }
                >
                  {humanize(item.status)}
                </StatusBadge>
              </div>

              <p className="mt-3 text-sm text-body">
                {item.reason}
              </p>

              {item.requestType ===
              "ROUND_RESCHEDULE" ? (
                <div className="mt-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle px-3 py-2 text-sm text-body">
                  <p className="m-0">
                    {item.roundName ??
                      "Round"}{" "}
                    · current{" "}
                    {when(
                      item.roundScheduledAt,
                    ) ?? "not scheduled"}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    Requested{" "}
                    {requestedWhen ??
                      "invalid time"}
                    {requestedMode
                      ? " · " +
                        requestedMode
                      : ""}
                    {requestedPlace
                      ? " · " +
                        requestedPlace
                      : ""}
                  </p>
                </div>
              ) : null}

              {item.requestType ===
              "OFFER_EXTENSION" ? (
                <div className="mt-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle px-3 py-2 text-sm text-body">
                  <p className="m-0">
                    {item.offerRoleTitle ??
                      "Offer"}{" "}
                    · current deadline{" "}
                    {when(
                      item.offerExpiresAt,
                    ) ?? "not set"}
                  </p>
                  <p className="mt-1 font-semibold text-foreground">
                    Requested deadline{" "}
                    {requestedWhen ??
                      "invalid time"}
                  </p>
                </div>
              ) : null}

              {item.status === "PENDING" ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                  <label>
                    <span className="mb-1 block text-xs font-semibold text-body">
                      Decision note
                    </span>
                    <Input
                      placeholder="Optional for approval, required for rejection"
                      value={
                        notes[item.id] ?? ""
                      }
                      onChange={(event) =>
                        setNotes(
                          (current) => ({
                            ...current,
                            [item.id]:
                              event.target.value,
                          }),
                        )
                      }
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
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
                      {pendingId === item.id
                        ? "Saving…"
                        : "Approve"}
                    </Button>
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
              ) : item.decisionNote ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Decision note:{" "}
                  {item.decisionNote}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
