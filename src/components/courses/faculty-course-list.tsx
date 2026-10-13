"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getFacultyCourseWorkspace,
  listFacultyCourseDeliveries,
} from "@/modules/courses/faculty-course-service";

type Course = Awaited<
  ReturnType<
    typeof listFacultyCourseDeliveries
  >
>[number];

type Workspace = Awaited<
  ReturnType<
    typeof getFacultyCourseWorkspace
  >
>;

export type FacultyCourseListRow = {
  course: Course;
  workspace: Workspace;
};

function pathTone(
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED"
    | undefined,
) {
  if (status === "PUBLISHED") {
    return "success" as const;
  }
  if (status === "DRAFT") {
    return "warning" as const;
  }
  return "neutral" as const;
}

export function FacultyCourseList({
  rows,
}: {
  rows: readonly FacultyCourseListRow[];
}) {
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(48);
  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return rows;
    return rows.filter(({ course }) =>
      [
        course.courseName,
        course.courseCode,
        course.sectionName,
        course.sectionCode,
        course.academicPeriodName,
      ].some((item) => item?.toLocaleLowerCase().includes(term)),
    );
  }, [rows, search]);
  const visible = filtered.slice(0, visibleCount);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No active teaching Courses"
        description="A Course appears here after an active teaching assignment is attached to one of its Section deliveries."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4">
        <label htmlFor="faculty-course-search" className="text-sm font-semibold text-body">
          Search courses
        </label>
        <input
          id="faculty-course-search"
          name="course-search"
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setVisibleCount(48);
          }}
          placeholder="Course, code, Section or academic period"
          className="mt-2 block min-h-11 w-full max-w-xl rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
        />
        <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
          Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} matching course Sections
        </p>
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          title="No courses match your search"
          description="Try a different Course name, code or Section."
        />
      ) : (
      <div data-testid="teacher.courses.grid" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {visible.map(({ course, workspace }) => (
        <Link
          key={course.deliveryId}
          href={`/teacher/courses/${course.deliveryId}/home`}
          data-testid="teacher.courses.card.open"
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
              tone={pathTone(
                workspace.learningPath?.status,
              )}
            >
              {workspace.learningPath
                ? workspace.learningPath.status
                : "No path"}
            </StatusBadge>
          </div>

          <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-body">
            {course.courseDescription ??
              "Teaching workspace for this exact Section delivery."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-muted px-2.5 py-1">
              {course.sectionName}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {course.academicPeriodName}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {course.teachingRole.replaceAll(
                "_",
                " ",
              )}
            </span>
          </div>

          <div className="mt-auto pt-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-[var(--lms-neutral-50)] p-2.5">
                <p className="m-0 text-lg font-semibold text-foreground">
                  {workspace.summary.contents}
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  Content
                </p>
              </div>
              <div className="rounded-lg bg-[var(--lms-neutral-50)] p-2.5">
                <p className="m-0 text-lg font-semibold text-foreground">
                  {workspace.summary.assignments}
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  Assignments
                </p>
              </div>
              <div className="rounded-lg bg-[var(--lms-neutral-50)] p-2.5">
                <p className="m-0 text-lg font-semibold text-foreground">
                  {workspace.summary.quizzes}
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  Quizzes
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="m-0 text-sm font-semibold text-foreground">
                Open teaching workspace
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
      ))}
      </div>
      )}
      {visibleCount < filtered.length ? (
        <button
          type="button"
          onClick={() => setVisibleCount((current) => current + 48)}
          className="min-h-11 rounded-md border border-primary bg-primary-subtle px-4 text-sm font-semibold text-primary-text hover:bg-primary hover:text-on-primary"
        >
          Show more courses ({filtered.length - visibleCount} remaining)
        </button>
      ) : null}
    </div>
  );
}
