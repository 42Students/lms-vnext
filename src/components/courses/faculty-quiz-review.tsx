"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { courseApiError } from "./learner-course-api";
import {
  quizReviewActions,
} from "./faculty-assessment-operation-model";

type AttemptAnswer = {
  id: string;
  questionId: string;
  promptSnapshot: string;
  pointsPossible: number;
  selectedOptionIds: string[];
  optionsSnapshot: Array<{
    id: string;
    text: string;
    sequence: number;
    correct: boolean;
  }>;
  correct: boolean;
  pointsAwarded: number;
};

type Attempt = {
  id: string;
  membershipId: string;
  attemptNumber: number;
  score: number;
  maxScore: number;
  submittedAt: string;
  learnerDisplayName: string | null;
  learnerEmail: string | null;
  answers: AttemptAnswer[];
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function learnerLabel(attempt: Attempt) {
  return (
    attempt.learnerDisplayName?.trim() ||
    attempt.learnerEmail?.trim() ||
    `Learner ${attempt.membershipId.slice(0, 8)}`
  );
}

export function FacultyQuizReview({
  quizId,
  deliveryId,
  status,
  resultsPublished,
  deliveryOwned,
}: {
  quizId: string;
  deliveryId: string;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "CLOSED";
  resultsPublished: boolean;
  deliveryOwned: boolean;
}) {
  const router = useRouter();
  const actions = quizReviewActions({
    deliveryOwned,
    status,
    resultsPublished,
  });
  const [open, setOpen] = useState(false);
  const [attempts, setAttempts] =
    useState<Attempt[] | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [savingResults, setSavingResults] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  if (!actions.canReviewAttempts) {
    return null;
  }

  async function load() {
    setOpen(true);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/courses/quiz-attempts?quizId=${encodeURIComponent(
          quizId,
        )}&deliveryId=${encodeURIComponent(
          deliveryId,
        )}`,
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      const payload =
        (await response.json()) as {
          attempts: Attempt[];
        };
      setAttempts(payload.attempts);
    } catch {
      setError(
        "Could not load Quiz attempts. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function setResults(
    published: boolean,
  ) {
    if (
      !published &&
      !window.confirm(
        "Hide published Quiz results from learners?",
      )
    ) {
      return;
    }

    setError(null);
    setSavingResults(true);

    try {
      const response = await fetch(
        `/api/courses/quizzes/${quizId}/results`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            published,
          }),
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
        "Could not update Quiz result visibility. Check your connection and try again.",
      );
    } finally {
      setSavingResults(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={load}
        >
          Review attempts
        </Button>

        {actions.canPublishResults ? (
          <Button
            size="sm"
            disabled={savingResults}
            onClick={() =>
              setResults(true)
            }
          >
            {savingResults
              ? "Publishing…"
              : "Publish results"}
          </Button>
        ) : null}

        {actions.canHideResults ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={savingResults}
            onClick={() =>
              setResults(false)
            }
          >
            {savingResults
              ? "Saving…"
              : "Hide results"}
          </Button>
        ) : null}

        {status === "CLOSED" &&
        !deliveryOwned ? (
          <span className="text-xs text-muted-foreground">
            Shared-Offering result publication
            remains admin-owned.
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-[var(--lms-neutral-50)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">
            Quiz attempts
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Scores and answer review are read from
            immutable submitted snapshots.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.canPublishResults ? (
            <Button
              size="sm"
              disabled={savingResults}
              onClick={() =>
                setResults(true)
              }
            >
              {savingResults
                ? "Publishing…"
                : "Publish results"}
            </Button>
          ) : null}
          {actions.canHideResults ? (
            <Button
              size="sm"
              variant="secondary"
              disabled={savingResults}
              onClick={() =>
                setResults(false)
              }
            >
              {savingResults
                ? "Saving…"
                : "Hide results"}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={load}
          >
            Refresh
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Loading attempts…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}

      {!loading &&
      attempts &&
      attempts.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No Quiz attempts have been submitted for
          this Section yet.
        </p>
      ) : null}

      {attempts &&
      attempts.length > 0 ? (
        <div className="mt-4 space-y-3">
          {attempts.map((attempt) => (
            <section
              key={attempt.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="m-0 text-sm font-semibold text-foreground">
                    {learnerLabel(attempt)}
                  </h4>
                  {attempt.learnerEmail ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {attempt.learnerEmail}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Attempt{" "}
                    {attempt.attemptNumber} ·{" "}
                    {formatDateTime(
                      attempt.submittedAt,
                    )}
                  </p>
                </div>
                <StatusBadge tone="info">
                  {attempt.score}/
                  {attempt.maxScore}
                </StatusBadge>
              </div>

              <div className="mt-4 space-y-3">
                {attempt.answers.map(
                  (answer, index) => (
                    <div
                      key={answer.id}
                      className="rounded-md border border-border p-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="m-0 text-sm font-semibold text-foreground">
                          {index + 1}.{" "}
                          {
                            answer.promptSnapshot
                          }
                        </p>
                        <StatusBadge
                          tone={
                            answer.correct
                              ? "success"
                              : "error"
                          }
                        >
                          {answer.correct
                            ? "Correct"
                            : "Incorrect"}{" "}
                          ·{" "}
                          {answer.pointsAwarded}/
                          {
                            answer.pointsPossible
                          }
                        </StatusBadge>
                      </div>

                      <div className="mt-3 space-y-1.5">
                        {answer.optionsSnapshot.map(
                          (option) => {
                            const selected =
                              answer.selectedOptionIds.includes(
                                option.id,
                              );
                            return (
                              <div
                                key={
                                  option.id
                                }
                                className="flex flex-wrap items-center gap-2 text-sm text-body"
                              >
                                <span
                                  aria-hidden="true"
                                  className="w-4 text-center font-bold"
                                >
                                  {option.correct
                                    ? "✓"
                                    : selected
                                      ? "•"
                                      : "–"}
                                </span>
                                <span>
                                  {option.text}
                                </span>
                                {selected ? (
                                  <span className="text-xs font-semibold text-primary-text">
                                    Learner selected
                                  </span>
                                ) : null}
                              </div>
                            );
                          },
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
