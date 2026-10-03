import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getLearnerCourseWorkspace,
  listLearnerCourseDeliveries,
} from "@/modules/courses/learner-course-service";

type Course = Awaited<
  ReturnType<
    typeof listLearnerCourseDeliveries
  >
>[number];

type Workspace = Awaited<
  ReturnType<
    typeof getLearnerCourseWorkspace
  >
>;

export type LearnerCourseListRow = {
  course: Course;
  workspace: Workspace;
};

function ProgressBar({
  value,
}: {
  value: number;
}) {
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-label="Course progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function nextLabel(
  workspace: Workspace,
) {
  if (!workspace.learningPath) {
    return "Learning path not published";
  }

  if (!workspace.nextItem) {
    if (workspace.summary.itemsTotal === 0) {
      return "No learning items yet";
    }

    if (workspace.summary.itemsMissed > 0) {
      return "No remaining actionable items";
    }

    return "Course work complete";
  }

  switch (workspace.nextItem.kind) {
    case "CONTENT":
      return `Continue · ${workspace.nextItem.title}`;
    case "ASSIGNMENT":
      return `Assignment · ${workspace.nextItem.title}`;
    case "QUIZ":
      return `Quiz · ${workspace.nextItem.title}`;
  }
}

export function LearnerCourseList({
  rows,
}: {
  rows: readonly LearnerCourseListRow[];
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No active Courses yet"
        description="Courses will appear here when your active Section has a Course delivery for the current academic period."
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map(({ course, workspace }) => {
        const progress =
          workspace.summary.overallPercent;
        const ready =
          workspace.learningPath !== null;

        return (
          <Link
            key={course.deliveryId}
            href={`/learn/courses/${course.deliveryId}`}
            className="group flex min-h-64 flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-primary-text">
                  {course.courseCode}
                </p>
                <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-foreground">
                  {course.courseName}
                </h2>
              </div>
              <StatusBadge
                tone={ready ? "success" : "warning"}
              >
                {ready ? "Ready" : "Preparing"}
              </StatusBadge>
            </div>

            <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-body">
              {course.courseDescription ??
                "Course learning workspace for your active Section."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-2.5 py-1">
                {course.academicPeriodName}
              </span>
              <span className="rounded-full bg-muted px-2.5 py-1">
                {course.sectionName}
              </span>
              {course.credits ? (
                <span className="rounded-full bg-muted px-2.5 py-1">
                  {course.credits} credits
                </span>
              ) : null}
            </div>

            <div className="mt-auto pt-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-body">
                  Progress
                </span>
                <span className="text-xs font-bold text-foreground">
                  {progress}%
                </span>
              </div>
              <ProgressBar value={progress} />
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="m-0 line-clamp-1 text-sm font-semibold text-foreground">
                  {nextLabel(workspace)}
                </p>
                <span
                  aria-hidden="true"
                  className="text-lg text-primary-text transition-transform group-hover:translate-x-0.5"
                >
                  →
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
