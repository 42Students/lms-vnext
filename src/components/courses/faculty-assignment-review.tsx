"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { courseApiError } from "./learner-course-api";
import {
  assignmentSubmissionActions,
} from "./faculty-assessment-operation-model";

type Submission = {
  id: string;
  assignmentId: string;
  deliveryId: string;
  membershipId: string;
  submissionType: "TEXT" | "LINK";
  textContent: string | null;
  submissionUrl: string | null;
  submittedAt: string;
  pointsAwarded: number | null;
  feedback: string | null;
  gradingStatus:
    | "NOT_GRADED"
    | "GRADED";
  gradePublished: boolean;
  version: number;
  learnerDisplayName: string | null;
  learnerEmail: string | null;
};

function learnerLabel(
  submission: Submission,
) {
  return (
    submission.learnerDisplayName?.trim() ||
    submission.learnerEmail?.trim() ||
    `Learner ${submission.membershipId.slice(0, 8)}`
  );
}

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

function SubmissionGradeCard({
  submission,
  maxPoints,
  onUpdated,
}: {
  submission: Submission;
  maxPoints: number;
  onUpdated: (submission: Submission) => void;
}) {
  const actions =
    assignmentSubmissionActions({
      gradingStatus:
        submission.gradingStatus,
      gradePublished:
        submission.gradePublished,
    });
  const [points, setPoints] = useState(
    submission.pointsAwarded?.toString() ??
      "",
  );
  const [feedback, setFeedback] = useState(
    submission.feedback ?? "",
  );
  const [saving, setSaving] =
    useState(false);
  const [publishing, setPublishing] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function saveGrade(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    const parsed = Number(points);
    if (
      !Number.isInteger(parsed) ||
      parsed < 0 ||
      parsed > maxPoints
    ) {
      setError(
        `Enter whole-number points between 0 and ${maxPoints}.`,
      );
      return;
    }

    if (
      submission.gradePublished &&
      !window.confirm(
        "Regrading will hide the currently published grade until you publish the new grade. Continue?",
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `/api/courses/assignment-submissions/${submission.id}/grade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            pointsAwarded: parsed,
            feedback:
              feedback.trim() || null,
            expectedVersion:
              submission.version,
          }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      const payload =
        (await response.json()) as {
          submission: Submission;
        };
      onUpdated({
        ...submission,
        ...payload.submission,
        learnerDisplayName:
          submission.learnerDisplayName,
        learnerEmail:
          submission.learnerEmail,
      });
    } catch {
      setError(
        "Could not save this grade. Check your connection and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publishGrade() {
    setError(null);
    setPublishing(true);

    try {
      const response = await fetch(
        `/api/courses/assignment-submissions/${submission.id}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            expectedVersion:
              submission.version,
          }),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      const payload =
        (await response.json()) as {
          submission: Submission;
        };
      onUpdated({
        ...submission,
        ...payload.submission,
        learnerDisplayName:
          submission.learnerDisplayName,
        learnerEmail:
          submission.learnerEmail,
      });
    } catch {
      setError(
        "Could not publish this grade. Check your connection and try again.",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="m-0 text-sm font-semibold text-foreground">
            {learnerLabel(submission)}
          </h4>
          {submission.learnerEmail ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {submission.learnerEmail}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted{" "}
            {formatDateTime(
              submission.submittedAt,
            )}
          </p>
        </div>
        <StatusBadge
          tone={
            submission.gradePublished
              ? "success"
              : submission.gradingStatus ===
                  "GRADED"
                ? "warning"
                : "neutral"
          }
        >
          {submission.gradePublished
            ? "Grade published"
            : submission.gradingStatus ===
                "GRADED"
              ? "Graded · unpublished"
              : "Needs grading"}
        </StatusBadge>
      </div>

      <div className="mt-3 rounded-md bg-[var(--lms-neutral-50)] p-3">
        {submission.submissionType ===
        "TEXT" ? (
          <p className="m-0 whitespace-pre-wrap text-sm leading-6 text-body">
            {submission.textContent}
          </p>
        ) : submission.submissionUrl ? (
          <a
            href={submission.submissionUrl}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary-text hover:text-primary-hover"
          >
            Open learner submission ↗
          </a>
        ) : null}
      </div>

      <form
        onSubmit={saveGrade}
        className="mt-4 grid gap-3 lg:grid-cols-[10rem_1fr]"
      >
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Points
          </span>
          <Input
            type="number"
            min={0}
            max={maxPoints}
            step={1}
            value={points}
            onChange={(event) =>
              setPoints(event.target.value)
            }
            required
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Feedback
          </span>
          <Textarea
            className="min-h-24"
            value={feedback}
            onChange={(event) =>
              setFeedback(
                event.target.value,
              )
            }
            maxLength={10000}
            placeholder="Optional feedback for the learner"
          />
        </label>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
          {actions.canGrade ? (
            <Button
              size="sm"
              type="submit"
              disabled={
                saving || publishing
              }
            >
              {saving
                ? "Saving…"
                : submission.gradingStatus ===
                    "GRADED"
                  ? "Save regrade"
                  : "Save grade"}
            </Button>
          ) : null}

          {actions.canPublish ? (
            <Button
              size="sm"
              type="button"
              variant="secondary"
              disabled={
                saving || publishing
              }
              onClick={publishGrade}
            >
              {publishing
                ? "Publishing…"
                : "Publish grade"}
            </Button>
          ) : null}

          {submission.gradePublished ? (
            <span className="text-xs font-semibold text-success">
              Learner can see{" "}
              {submission.pointsAwarded ?? 0}/
              {maxPoints}
            </span>
          ) : null}
        </div>
      </form>

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}

export function FacultyAssignmentReview({
  assignmentId,
  deliveryId,
  maxPoints,
  status,
}: {
  assignmentId: string;
  deliveryId: string;
  maxPoints: number;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED";
}) {
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] =
    useState<Submission[] | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  if (status !== "PUBLISHED") {
    return null;
  }

  async function load() {
    setOpen(true);
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(
        `/api/courses/assignment-submissions?assignmentId=${encodeURIComponent(
          assignmentId,
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
          submissions: Submission[];
        };
      setSubmissions(
        payload.submissions,
      );
    } catch {
      setError(
        "Could not load Assignment submissions. Check your connection and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="mt-3">
        <Button
          size="sm"
          variant="secondary"
          onClick={load}
        >
          Review submissions
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-[var(--lms-neutral-50)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">
            Assignment submissions
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Grades are private until explicitly
            published.
          </p>
        </div>
        <div className="flex gap-2">
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
          Loading submissions…
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
      submissions &&
      submissions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          No learners have submitted this
          Assignment yet.
        </p>
      ) : null}

      {submissions &&
      submissions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {submissions.map(
            (submission) => (
              <SubmissionGradeCard
                key={submission.id}
                submission={submission}
                maxPoints={maxPoints}
                onUpdated={(updated) =>
                  setSubmissions(
                    (current) =>
                      current?.map(
                        (item) =>
                          item.id ===
                          updated.id
                            ? updated
                            : item,
                      ) ?? null,
                  )
                }
              />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
