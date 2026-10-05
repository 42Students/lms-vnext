"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";

type CourseChoice = {
  id: string;
  name: string;
  code: string;
};

type CommonItem = {
  id: string;
  deliveryId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  lessonName: string;
  title: string;
  description: string | null;
  dueAt: string | null;
};

export type LearnerAssignmentOverviewItem =
  CommonItem & {
    kind: "ASSIGNMENT";
    maxPoints: number;
    submissionId: string | null;
    submittedAt: string | null;
    gradePublished: boolean;
    pointsAwarded: number | null;
  };

export type LearnerQuizOverviewItem =
  CommonItem & {
    kind: "QUIZ";
    maxAttempts: number;
    totalPoints: number;
    status: "PUBLISHED" | "CLOSED";
    resultsPublished: boolean;
    attemptsUsed: number;
    attemptsRemaining: number;
    progressStatus:
      | "NOT_STARTED"
      | "COMPLETED"
      | "MISSED";
  };

type Item =
  | LearnerAssignmentOverviewItem
  | LearnerQuizOverviewItem;

function formatDate(value: string | null) {
  if (!value) return "No deadline";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function assignmentState(
  item: LearnerAssignmentOverviewItem,
) {
  if (item.gradePublished) {
    return {
      label: `Graded · ${item.pointsAwarded ?? 0}/${item.maxPoints}`,
      tone: "success" as const,
      action: "View",
    };
  }

  if (item.submittedAt) {
    return {
      label: "Submitted · awaiting grade",
      tone: "info" as const,
      action: "View",
    };
  }

  const due = item.dueAt
    ? new Date(item.dueAt).getTime()
    : null;

  if (due && due < Date.now()) {
    return {
      label:
        "Overdue · late submission allowed",
      tone: "warning" as const,
      action: "Submit",
    };
  }

  if (
    due &&
    due - Date.now() <
      48 * 60 * 60 * 1000
  ) {
    return {
      label: "Due soon",
      tone: "warning" as const,
      action: "Submit",
    };
  }

  return {
    label: "Not submitted",
    tone: "neutral" as const,
    action: "Submit",
  };
}

function quizState(
  item: LearnerQuizOverviewItem,
) {
  if (
    item.status === "CLOSED" &&
    item.resultsPublished &&
    item.attemptsUsed > 0
  ) {
    return {
      label: "Results published",
      tone: "success" as const,
      action: "Open quiz",
    };
  }

  if (item.progressStatus === "COMPLETED") {
    return {
      label: "Submitted",
      tone: "info" as const,
      action: "Open quiz",
    };
  }

  if (item.progressStatus === "MISSED") {
    return {
      label: "Missed",
      tone: "error" as const,
      action: "Open quiz",
    };
  }

  return {
    label: "Not attempted",
    tone: "neutral" as const,
    action: "Open quiz",
  };
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

export function LearnerAssessmentOverview({
  courses,
  items,
  kind,
}: {
  courses: readonly CourseChoice[];
  items: readonly Item[];
  kind: "ASSIGNMENT" | "QUIZ";
}) {
  const [courseId, setCourseId] =
    useState("");

  const filtered = useMemo(
    () =>
      courseId
        ? items.filter(
            (item) =>
              item.courseId === courseId,
          )
        : items,
    [courseId, items],
  );

  const completed = items.filter((item) =>
    item.kind === "ASSIGNMENT"
      ? Boolean(item.submittedAt)
      : item.attemptsUsed > 0,
  ).length;

  if (items.length === 0) {
    return (
      <EmptyState
        title={
          kind === "ASSIGNMENT"
            ? "No assignments yet"
            : "No quizzes yet"
        }
        description={
          kind === "ASSIGNMENT"
            ? "Your assignments will appear here once your Faculty publishes them."
            : "Your quizzes will appear here once your Faculty publishes them."
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          label={
            kind === "ASSIGNMENT"
              ? "Assignments"
              : "Quizzes"
          }
          value={items.length}
        />
        <Metric
          label="Courses"
          value={courses.length}
        />
        <Metric
          label={
            kind === "ASSIGNMENT"
              ? "Submitted"
              : "Attempted"
          }
          value={completed}
        />
      </div>

      <div className="flex justify-end">
        <label className="w-full max-w-sm">
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Course
          </span>
          <Select
            value={courseId}
            onChange={(event) =>
              setCourseId(event.target.value)
            }
          >
            <option value="">
              All courses
            </option>
            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.name} · {course.code}
              </option>
            ))}
          </Select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nothing in this course"
          description="Choose another course or All courses."
        />
      ) : (
        <div
          className="space-y-3"
          aria-label={
            kind === "ASSIGNMENT"
              ? "Assignment list"
              : "Quiz list"
          }
        >
          {filtered.map((item) => {
            const state =
              item.kind === "ASSIGNMENT"
                ? assignmentState(item)
                : quizState(item);
            const href =
              item.kind === "QUIZ"
                ? `/quiz?quizId=${encodeURIComponent(item.id)}&deliveryId=${encodeURIComponent(item.deliveryId)}${item.progressStatus === "COMPLETED" || item.progressStatus === "MISSED" || item.status === "CLOSED" ? "&review=true" : ""}`
                : `/learn/courses/${item.deliveryId}/roadmap?filter=assignments&content=${encodeURIComponent(item.id)}`;

            return (
              <article
                key={`${item.deliveryId}-${item.id}`}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          item.kind ===
                          "ASSIGNMENT"
                            ? "warning"
                            : "info"
                        }
                      >
                        {item.kind ===
                        "ASSIGNMENT"
                          ? "Assignment"
                          : "Quiz"}
                      </StatusBadge>
                      <StatusBadge
                        tone={state.tone}
                      >
                        {state.label}
                      </StatusBadge>
                    </div>
                    <h2 className="mt-2 text-base font-semibold text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-body">
                      {item.courseName} ·{" "}
                      {item.lessonName}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.dueAt
                        ? `Due ${formatDate(item.dueAt)}`
                        : "No deadline"}
                    </p>
                    {item.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-body">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.kind ===
                      "ASSIGNMENT"
                        ? `${item.maxPoints} points`
                        : `${item.totalPoints} points · ${item.attemptsUsed}/${item.maxAttempts} attempts`}
                    </span>
                    <Link
                      href={href}
                      className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
                    >
                      {state.action}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
