"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";

type ResultOutcome =
  | "PASS"
  | "FAIL"
  | "HOLD"
  | "ABSENT";

type RecruiterRound = {
  id: string;
  sequence: number;
  kind: string;
  name: string;
  status: string;
  scheduledAt: string | null;
  timezone: string | null;
  mode: string | null;
  venue: string | null;
  meetingUrl: string | null;
  resultsDueAt: string | null;
  participants: Array<{
    applicationId: string;
    displayName: string | null;
    email: string | null;
    result: {
      id: string;
      status: string;
      outcome: ResultOutcome;
      waitlistRank: number | null;
      scorePercent: number | null;
      reasonCategory:
        | "APTITUDE"
        | "TECHNICAL"
        | "COMMUNICATION"
        | "OTHER"
        | null;
      candidateMessage: string | null;
    } | null;
  }>;
};

type Draft = {
  outcome: ResultOutcome;
  waitlistRank: string;
  scorePercent: string;
  reasonCategory: string;
  candidateMessage: string;
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

function formatWhen(
  value: string | null,
  timezone: string | null,
) {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone:
      timezone ?? "Asia/Kolkata",
  }).format(new Date(value));
}

const inputClass =
  "min-h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]";

export function RecruiterResultControls({
  rounds,
}: {
  rounds: RecruiterRound[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pendingKey, setPendingKey] =
    useState<string | null>(null);

  const initial = useMemo(() => {
    const entries: Array<
      [string, Draft]
    > = [];
    for (const round of rounds) {
      for (const participant of round.participants) {
        const result = participant.result;
        entries.push([
          round.id +
            ":" +
            participant.applicationId,
          {
            outcome:
              result?.outcome ?? "PASS",
            waitlistRank:
              result?.waitlistRank?.toString() ??
              "",
            scorePercent:
              result?.scorePercent?.toString() ??
              "",
            reasonCategory:
              result?.reasonCategory ?? "",
            candidateMessage:
              result?.candidateMessage ?? "",
          },
        ]);
      }
    }
    return Object.fromEntries(entries);
  }, [rounds]);

  const [drafts, setDrafts] =
    useState<Record<string, Draft>>(
      initial,
    );

  async function stage(
    roundId: string,
    applicationId: string,
  ) {
    const key =
      roundId + ":" + applicationId;
    const draft = drafts[key];
    if (!draft) return;

    if (
      draft.outcome !== "PASS" &&
      !draft.candidateMessage.trim()
    ) {
      showToast({
        tone: "error",
        title: "Candidate message required",
        description:
          "Non-pass outcomes require a learner-safe message.",
      });
      return;
    }

    if (
      draft.outcome === "HOLD" &&
      (!draft.waitlistRank ||
        Number(draft.waitlistRank) <= 0)
    ) {
      showToast({
        tone: "error",
        title: "Waitlist rank required",
        description:
          "Hold outcomes require a positive waitlist rank.",
      });
      return;
    }

    setPendingKey(key);
    try {
      const response = await fetch(
        "/api/placements/rounds/" +
          roundId +
          "/results",
        {
          method: "POST",
          headers: {
            "content-type":
              "application/json",
          },
          body: JSON.stringify({
            applicationId,
            outcome: draft.outcome,
            waitlistRank:
              draft.outcome === "HOLD"
                ? Number(
                    draft.waitlistRank,
                  )
                : null,
            scorePercent:
              draft.scorePercent
                ? Number(
                    draft.scorePercent,
                  )
                : null,
            reasonCategory:
              draft.reasonCategory ||
              null,
            candidateMessage:
              draft.candidateMessage.trim() ||
              null,
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
            "PLACEMENT_RESULT_STAGE_FAILED",
        );
      }

      showToast({
        tone: "success",
        title: "Result staged",
        description:
          "The employer result is staged for the college placement team to review and apply.",
      });
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not stage result",
        description:
          error instanceof Error
            ? humanize(error.message)
            : "Please try again.",
      });
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <div className="space-y-5">
      {rounds.length === 0 ? (
        <p className="m-0 rounded-xl border border-border bg-surface p-5 text-sm text-muted-foreground">
          The placement team has not configured any rounds yet.
        </p>
      ) : (
        rounds.map((round) => {
          const evaluative =
            round.kind !== "TALK";
          const canStage =
            evaluative &&
            (round.status === "SCHEDULED" ||
              round.status ===
                "COMPLETED");

          return (
            <article
              key={round.id}
              className="rounded-xl border border-border bg-surface"
            >
              <div className="border-b border-border px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="m-0 text-base font-semibold text-foreground">
                    {round.sequence}.{" "}
                    {round.name}
                  </h2>
                  <StatusBadge
                    tone={
                      round.status ===
                      "COMPLETED"
                        ? "success"
                        : round.status ===
                            "SCHEDULED"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {humanize(
                      round.status,
                    )}
                  </StatusBadge>
                </div>
                <p className="mt-1 text-sm text-body">
                  {humanize(round.kind)} ·{" "}
                  {formatWhen(
                    round.scheduledAt,
                    round.timezone,
                  )}
                  {round.venue
                    ? " · " + round.venue
                    : ""}
                </p>
                {round.meetingUrl ? (
                  <a
                    href={round.meetingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-primary-text hover:text-primary-hover"
                  >
                    Open meeting →
                  </a>
                ) : null}
              </div>

              {!evaluative ? (
                <p className="m-0 px-5 py-5 text-sm text-muted-foreground">
                  Informational rounds do not collect candidate outcomes.
                </p>
              ) : round.participants.length ===
                0 ? (
                <p className="m-0 px-5 py-5 text-sm text-muted-foreground">
                  No candidates are eligible for this round yet.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {round.participants.map(
                    (participant) => {
                      const key =
                        round.id +
                        ":" +
                        participant.applicationId;
                      const draft =
                        drafts[key] ?? {
                          outcome:
                            "PASS" as const,
                          waitlistRank: "",
                          scorePercent: "",
                          reasonCategory: "",
                          candidateMessage: "",
                        };
                      const applied =
                        participant.result
                          ?.status ===
                        "APPLIED";
                      const staged =
                        participant.result
                          ?.status ===
                        "STAGED";

                      return (
                        <div
                          key={
                            participant.applicationId
                          }
                          className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(12rem,1fr)_minmax(0,2fr)]"
                        >
                          <div>
                            <p className="m-0 font-semibold text-foreground">
                              {participant.displayName ??
                                "Candidate"}
                            </p>
                            <p className="mt-1 text-sm text-body">
                              {participant.email ??
                                "No email shared"}
                            </p>
                            {participant.result ? (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <StatusBadge
                                  tone={
                                    applied
                                      ? "success"
                                      : "warning"
                                  }
                                >
                                  {humanize(
                                    participant
                                      .result
                                      .status,
                                  )}
                                </StatusBadge>
                                <StatusBadge>
                                  {humanize(
                                    participant
                                      .result
                                      .outcome,
                                  )}
                                </StatusBadge>
                              </div>
                            ) : null}
                          </div>

                          {applied ? (
                            <p className="m-0 text-sm text-muted-foreground">
                              The placement team applied this result. It is now part of the learner&apos;s official progression.
                            </p>
                          ) : canStage ? (
                            <div className="grid gap-3 lg:grid-cols-2">
                              <label>
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Outcome
                                </span>
                                <select
                                  aria-label="Outcome"
                                  className={
                                    inputClass
                                  }
                                  value={
                                    draft.outcome
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          outcome:
                                            event
                                              .target
                                              .value as ResultOutcome,
                                        },
                                      }),
                                    )
                                  }
                                >
                                  <option value="PASS">
                                    Pass
                                  </option>
                                  <option value="FAIL">
                                    Fail
                                  </option>
                                  <option value="HOLD">
                                    Hold
                                  </option>
                                  <option value="ABSENT">
                                    Absent
                                  </option>
                                </select>
                              </label>

                              <label>
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Score %
                                </span>
                                <input
                                  aria-label="Score %"
                                  className={
                                    inputClass
                                  }
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={
                                    draft.scorePercent
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          scorePercent:
                                            event
                                              .target
                                              .value,
                                        },
                                      }),
                                    )
                                  }
                                />
                              </label>

                              {draft.outcome ===
                              "HOLD" ? (
                                <label>
                                  <span className="mb-1 block text-xs font-semibold text-body">
                                    Waitlist rank
                                  </span>
                                  <input
                                    aria-label="Waitlist rank"
                                    className={
                                      inputClass
                                    }
                                    type="number"
                                    min="1"
                                    value={
                                      draft.waitlistRank
                                    }
                                    onChange={(
                                      event,
                                    ) =>
                                      setDrafts(
                                        (
                                          current,
                                        ) => ({
                                          ...current,
                                          [key]: {
                                            ...draft,
                                            waitlistRank:
                                              event
                                                .target
                                                .value,
                                          },
                                        }),
                                      )
                                    }
                                  />
                                </label>
                              ) : null}

                              <label>
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Reason category
                                </span>
                                <select
                                  aria-label="Reason category"
                                  className={
                                    inputClass
                                  }
                                  value={
                                    draft.reasonCategory
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          reasonCategory:
                                            event
                                              .target
                                              .value,
                                        },
                                      }),
                                    )
                                  }
                                >
                                  <option value="">
                                    Not specified
                                  </option>
                                  <option value="APTITUDE">
                                    Aptitude
                                  </option>
                                  <option value="TECHNICAL">
                                    Technical
                                  </option>
                                  <option value="COMMUNICATION">
                                    Communication
                                  </option>
                                  <option value="OTHER">
                                    Other
                                  </option>
                                </select>
                              </label>

                              <label className="lg:col-span-2">
                                <span className="mb-1 block text-xs font-semibold text-body">
                                  Candidate message
                                </span>
                                <textarea
                                  aria-label="Candidate message"
                                  className="min-h-20 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
                                  value={
                                    draft.candidateMessage
                                  }
                                  onChange={(
                                    event,
                                  ) =>
                                    setDrafts(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [key]: {
                                          ...draft,
                                          candidateMessage:
                                            event
                                              .target
                                              .value,
                                        },
                                      }),
                                    )
                                  }
                                  placeholder="Required for fail, hold or absent outcomes."
                                />
                              </label>

                              <div className="flex items-center gap-3 lg:col-span-2">
                                <Button
                                  size="sm"
                                  disabled={
                                    pendingKey !==
                                    null
                                  }
                                  onClick={() =>
                                    stage(
                                      round.id,
                                      participant.applicationId,
                                    )
                                  }
                                >
                                  {pendingKey ===
                                  key
                                    ? "Staging…"
                                    : staged
                                      ? "Update staged result"
                                      : "Stage result"}
                                </Button>
                                <p className="m-0 text-xs text-muted-foreground">
                                  TPO/College Admin must apply the staged result before learner progression changes.
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="m-0 text-sm text-muted-foreground">
                              Results can be staged after the placement team schedules this round.
                            </p>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </article>
          );
        })
      )}
    </div>
  );
}
