"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";

const PAGE_SIZE = 48;

export type LearnerCourseListRow = {
  course: {
    deliveryId: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    courseDescription: string | null;
    offeringType: string;
    credits: number | null;
    sectionName: string;
    sectionCode: string;
    academicPeriodId: string;
    academicPeriodName: string;
    programName: string;
    programCode: string;
    periodStartDate: string;
    periodEndDate: string;
  };
  instructorNames: string[];
  summary: {
    overallPercent: number;
    itemsCompleted: number;
    itemsTotal: number;
  };
  readOnly: boolean;
  learningPathReady: boolean;
  nextItem: {
    lessonId: string;
    lessonName: string;
    kind: "CONTENT" | "ASSIGNMENT" | "QUIZ";
    itemId: string;
    title: string;
  } | null;
};

function nextLabel(row: LearnerCourseListRow) {
  if (row.readOnly) return "View course";
  if (!row.learningPathReady) return "Learning path not published";
  if (!row.nextItem) {
    return row.summary.itemsTotal === 0
      ? "No learning items yet"
      : "Course work complete";
  }

  switch (row.nextItem.kind) {
    case "ASSIGNMENT":
      return `Assignment · ${row.nextItem.title}`;
    case "QUIZ":
      return `Quiz · ${row.nextItem.title}`;
    default:
      return `Continue · ${row.nextItem.title}`;
  }
}

export function LearnerCourseList({
  rows,
}: {
  rows: readonly LearnerCourseListRow[];
}) {
  const periods = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      startDate: string;
    }>();
    for (const row of rows) {
      map.set(row.course.academicPeriodId, {
        id: row.course.academicPeriodId,
        name: row.course.academicPeriodName,
        startDate: row.course.periodStartDate,
      });
    }
    return [...map.values()].sort(
      (left, right) =>
        String(right.startDate).localeCompare(String(left.startDate)),
    );
  }, [rows]);

  const [periodId, setPeriodId] = useState(periods[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "core" | "elective">("all");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const periodRows = useMemo(
    () =>
      rows.filter(
        (row) => !periodId || row.course.academicPeriodId === periodId,
      ),
    [rows, periodId],
  );

  const coreCount = periodRows.filter(
    (row) => String(row.course.offeringType).toUpperCase() !== "ELECTIVE",
  ).length;
  const electiveCount = periodRows.length - coreCount;

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return periodRows
      .filter((row) => {
        const elective =
          String(row.course.offeringType).toUpperCase() === "ELECTIVE";
        if (typeFilter === "core" && elective) return false;
        if (typeFilter === "elective" && !elective) return false;
        if (!needle) return true;
        return [
          row.course.courseName,
          row.course.courseCode,
          row.course.programName,
          row.course.sectionName,
          row.course.academicPeriodName,
        ].some((value) => value.toLowerCase().includes(needle));
      })
      .sort((left, right) => {
        const leftElective =
          String(left.course.offeringType).toUpperCase() === "ELECTIVE";
        const rightElective =
          String(right.course.offeringType).toUpperCase() === "ELECTIVE";
        if (leftElective !== rightElective) return leftElective ? 1 : -1;
        return left.course.courseName.localeCompare(right.course.courseName);
      });
  }, [periodRows, query, typeFilter]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No courses found"
        description="Courses will appear here when your class, batch and semester have active course assignments."
      />
    );
  }

  const selectedPeriod =
    periods.find((period) => period.id === periodId) ?? periods[0];
  const totalCredits = periodRows.reduce(
    (sum, row) => sum + (row.course.credits ?? 0),
    0,
  );

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-body">
              Semester
              <select
                value={periodId}
                onChange={(event) => {
                  setPeriodId(event.target.value);
                  setQuery("");
                  setVisibleLimit(PAGE_SIZE);
                }}
                className="mt-1.5 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
                aria-label="Select semester"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-body">
              Search courses
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleLimit(PAGE_SIZE);
                }}
                placeholder="Search courses…"
                className="mt-1.5 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)]"
              />
            </label>
          </div>

          {electiveCount > 0 ? (
            <div
              className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface-subtle p-1"
              aria-label="Filter by course type"
            >
              {[
                ["all", `All ${periodRows.length}`],
                ["core", `Regular ${coreCount}`],
                ["elective", `Electives ${electiveCount}`],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setTypeFilter(value as "all" | "core" | "elective");
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  className={
                    typeFilter === value
                      ? "rounded-md bg-surface px-3 py-2 text-sm font-semibold text-primary-text shadow-sm"
                      : "rounded-md px-3 py-2 text-sm font-semibold text-body hover:text-primary-text"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          {periodRows[0]?.course.programName ? (
            <span className="rounded-full bg-muted px-3 py-1.5">
              {periodRows[0].course.programName}
            </span>
          ) : null}
          {selectedPeriod ? (
            <span className="rounded-full bg-muted px-3 py-1.5">
              {selectedPeriod.name}
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-3 py-1.5">
            {periodRows.length} {periodRows.length === 1 ? "Course" : "Courses"}
          </span>
          {totalCredits > 0 ? (
            <span className="rounded-full bg-muted px-3 py-1.5">
              {totalCredits} Credits
            </span>
          ) : null}
        </div>
      </section>

      {visibleRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <h2 className="m-0 text-base font-semibold text-foreground">
            {query.trim()
              ? `No courses match “${query.trim()}”`
              : typeFilter === "elective"
                ? "No electives to show right now."
                : "No regular courses to show right now."}
          </h2>
          <p className="mt-2 text-sm text-body">
            Change the semester, course type or search to see other courses.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleRows.slice(0, visibleLimit).map((row, index, renderedRows) => {
              const elective =
                String(row.course.offeringType).toUpperCase() === "ELECTIVE";
              const previousElective =
                index > 0 &&
                String(renderedRows[index - 1]?.course.offeringType).toUpperCase() === "ELECTIVE";
              const startsElectiveGroup =
                typeFilter === "all" &&
                elective &&
                !previousElective &&
                coreCount > 0;

              return (
                <div
                  key={row.course.deliveryId}
                  className={startsElectiveGroup ? "md:col-span-2 xl:col-span-3" : ""}
                >
                  {startsElectiveGroup ? (
                    <h2 className="mb-3 mt-2 text-base font-semibold text-foreground">
                      Electives
                    </h2>
                  ) : null}
                  <Link
                    href={`/learn/courses/${row.course.deliveryId}/home`}
                    className="group flex min-h-72 flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                  >
                    <div className="flex min-h-24 items-end bg-primary-subtle px-5 py-4">
                      <div className="flex w-full items-end justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.1em] text-primary-text">
                          {row.course.courseCode}
                        </span>
                        <div className="flex items-center gap-2">
                          {row.readOnly ? (
                            <StatusBadge tone="neutral">Past semester</StatusBadge>
                          ) : null}
                          {elective ? (
                            <StatusBadge tone="info">Elective</StatusBadge>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h2 className="m-0 line-clamp-2 text-lg font-semibold text-foreground">
                        {row.course.courseName}
                      </h2>
                      <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-body">
                        {row.course.courseDescription ??
                          "Course learning workspace for your class."}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-muted-foreground">
                        Instructor: {row.instructorNames.length > 0
                          ? row.instructorNames.join(", ")
                          : "Not assigned"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="rounded-full bg-muted px-2.5 py-1">
                          {row.course.sectionName}
                        </span>
                        {row.course.credits ? (
                          <span className="rounded-full bg-muted px-2.5 py-1">
                            {row.course.credits} Credits
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-auto pt-5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-body">
                            Progress
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {row.summary.overallPercent}%
                          </span>
                        </div>
                        <div
                          className="h-2 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-label="Course progress"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={row.summary.overallPercent}
                        >
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${row.summary.overallPercent}%` }}
                          />
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="m-0 line-clamp-1 text-sm font-semibold text-foreground">
                            {nextLabel(row)}
                          </p>
                          <span
                            aria-hidden="true"
                            className="text-lg text-primary-text transition-transform group-hover:translate-x-0.5"
                          >
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
          {visibleRows.length > visibleLimit ? (
            <div className="text-center">
              <button
                type="button"
                onClick={() => setVisibleLimit((value) => value + PAGE_SIZE)}
                className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
              >
                Show more courses ({visibleRows.length - visibleLimit} remaining)
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
