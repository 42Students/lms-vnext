"use client";

import Link from "next/link";
import { facultySubmissionContentView } from "@/modules/courses/faculty-submission-content-model";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { facultyGradeEditorState } from "@/modules/courses/faculty-grade-editor-model";
import { courseApiError } from "./learner-course-api";
import {
  assignmentSubmissionActions,
} from "./faculty-assessment-operation-model";

type Submission = {
  id: string;
  assignmentId: string;
  deliveryId: string;
  membershipId: string;
  submissionType: "TEXT" | "LINK" | "FILE";
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
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SubmissionGradeCard({
  submission,
  maxPoints,
  onUpdated,
  filesEnabled,
}: {
  submission: Submission;
  maxPoints: number;
  filesEnabled: boolean;
  onUpdated: (submission: Submission) => void;
}) {
  const content = facultySubmissionContentView({
    id:submission.id,submissionType:submission.submissionType,
    textContent:submission.textContent,submissionUrl:submission.submissionUrl,
  },filesEnabled);
  const actions =
    assignmentSubmissionActions({
      gradingStatus:submission.gradingStatus,gradePublished:submission.gradePublished,
    });
  const [points, setPoints] = useState(
    submission.pointsAwarded?.toString() ??
      "",
  );
  const [feedback, setFeedback] = useState(
    submission.feedback ?? "",
  );
  const draftState = facultyGradeEditorState(submission, points, feedback, maxPoints);
  const unchanged = !draftState.hasChanges;
  const [saving, setSaving] =
    useState(false);
  const [publishing, setPublishing] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] = useState<string|null>(null);

  async function saveGrade(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsed = draftState.points;
    if (parsed === null) {
      setError(
        `Enter whole-number points between 0 and ${maxPoints}.`,
      );
      return;
    }

    if(submission.gradePublished&&feedback.trim().length<8){
      setError("Explain the regrade to the learner in at least 8 characters.");
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
      setSuccess("Grade state saved. Refresh the report to verify visibility.");
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
    setSuccess(null);
    if (!draftState.canPublish) {
      setError("Save the score and feedback before publishing the grade.");
      return;
    }
    if (!window.confirm(
      "Publish this grade and feedback to the learner? Verify both before continuing.",
    )) {
      return;
    }
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
      setSuccess("Grade state saved. Refresh the report to verify visibility.");
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
        {content.kind === "TEXT" ? (
          <p className="m-0 whitespace-pre-wrap break-words text-sm leading-6 text-body">{content.text}</p>
        ) : content.kind === "FILE" || content.kind === "LINK" ? (
          <Link href={content.href} target="_blank" rel="noopener noreferrer" prefetch={false}
            className="inline-flex min-h-10 items-center break-words text-sm font-semibold text-primary-text hover:text-primary-hover">
            {content.label}
          </Link>
        ) : <p role="status" className="text-sm text-muted-foreground">{content.message}</p>}
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
            aria-required={submission.gradePublished}
            className="min-h-24"
            value={feedback}
            onChange={(event) =>
              setFeedback(
                event.target.value,
              )
            }
            maxLength={10000}
            placeholder={submission.gradePublished
              ? "Required: explain why the published grade is changing"
              : "Optional feedback for the learner"}
          />
        </label>

        <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
          {actions.canGrade ? (
            <Button
              size="sm"
              type="submit"
              disabled={
                saving || publishing || unchanged
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
                saving || publishing || !draftState.canPublish
              }
              onClick={publishGrade}
            >
              {publishing
                ? "Publishing…"
                : "Publish grade"}
            </Button>
          ) : null}

          {actions.canPublish && draftState.hasChanges ? (
            <p role="status" className="text-xs text-muted-foreground">
              Save your score and feedback changes before publishing.
            </p>
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
      {success?<p role="status" className="mt-2 text-sm text-body">{success}</p>:null}
    </section>
  );
}

export function FacultyAssignmentReview({
  assignmentId,
  deliveryId,
  maxPoints,
  status,
  filesEnabled,
}: {
  filesEnabled: boolean;
  assignmentId: string;
  deliveryId: string;
  maxPoints: number;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED";
}) {
  const router = useRouter();
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

  return (
    <>
      <div className="mt-3">
        <Button type="button" size="sm" variant="secondary"
          onClick={() => void load()}>
          View submissions
        </Button>
      </div>
      <Drawer
        open={open}
        onOpenChange={setOpen}
        title="Assignment submissions"
        description="Review authorized Section work. Grades stay private until explicitly published."
      >
      <div className="space-y-4">
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
          <span className="text-xs text-muted-foreground">
            Use the drawer close control or Escape to return to the assessment list.
          </span>
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

      {!loading && submissions &&
      submissions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {submissions.map(
            (submission) => (
              <SubmissionGradeCard
                key={`${submission.id}:${submission.version}`}
                submission={submission}
                maxPoints={maxPoints}
                filesEnabled={filesEnabled}
                onUpdated={(updated) => {
                  setSubmissions((current) =>
                    current?.map((item) =>
                      item.id === updated.id ? updated : item,
                    ) ?? null,
                  );
                  // Keep server-rendered report aggregates in sync after grade/publish.
                  router.refresh();
                }}
              />
            ),
          )}
        </div>
      ) : null}
      </div>
      </Drawer>
    </>
  );
}
