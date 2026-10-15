"use client";

import Link from "next/link";
import Image from "next/image";
import { Fragment, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { learnerCourseCardMedia } from "@/modules/courses/learner-course-card-media-model";
import { learnerCourseResultSummary } from "@/modules/courses/learner-course-result-summary-model";
import { learnerCourseHasActiveFilters } from "@/modules/courses/learner-course-active-filters-model";
import { learnerCourseFilteredEmptyTitle } from "@/modules/courses/learner-course-filtered-empty-model";
import { learnerCoursePreferredPeriod } from "@/modules/courses/learner-course-preferred-period-model";
import { resolveLearnerCoursePeriod } from "@/modules/courses/learner-course-current-period-model";
import { resolveLearnerCourseTypeFilter } from "@/modules/courses/learner-course-type-availability-model";
import { learnerCourseMatchesSearch } from "@/modules/courses/learner-course-card-search-model";
import { learnerCourseSemesterFilterReset } from "@/modules/courses/learner-course-semester-filter-model";
import { learnerCourseHasContinueAction } from "@/modules/courses/learner-course-continue-model";
import { learnerCourseNextItemHref } from "@/modules/courses/learner-course-next-action-model";
import { learnerCourseMatchesProgress, type LearnerCourseProgressFilter } from "@/modules/courses/learner-course-progress-filter-model";
import { learnerCourseMatchesTermState, type LearnerCourseTermState } from "@/modules/courses/learner-course-term-state-model";
import { sortLearnerCourseCards, type LearnerCourseSortMode } from "@/modules/courses/learner-course-sort-model";

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
  thumbnailUrl: string | null;
  instructorNames: string[];
  summary: {
    overallPercent: number | null;
    itemsCompleted: number;
    itemsTotal: number;
  };
  lastActivity: string | null;
  overdueAssignments?: number;
  nextDue: {title:string;kind:"Assignment"|"Quiz";dueAt:string} | null;
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

  const preferredPeriodId = learnerCoursePreferredPeriod(rows);
  const [periodId, setPeriodId] = useState(preferredPeriodId);
  const selectedPeriodId = resolveLearnerCoursePeriod(periodId, periods, preferredPeriodId);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "core" | "elective">("all");
  const [continueOnly, setContinueOnly] = useState(false);
  const [progressFilter,setProgressFilter]=useState<LearnerCourseProgressFilter>("ALL");
  const [termState,setTermState]=useState<LearnerCourseTermState>("ALL");
  const [sortMode,setSortMode] = useState<LearnerCourseSortMode>("NAME");
  const [visibleLimit, setVisibleLimit] = useState(PAGE_SIZE);

  const periodRows = useMemo(
    () =>
      rows.filter(
        (row) => !selectedPeriodId || row.course.academicPeriodId === selectedPeriodId,
      ),
    [rows, selectedPeriodId],
  );

  const coreCount = periodRows.filter(
    (row) => String(row.course.offeringType).toUpperCase() !== "ELECTIVE",
  ).length;
  const electiveCount = periodRows.length - coreCount;
  const effectiveTypeFilter = resolveLearnerCourseTypeFilter(typeFilter,coreCount,electiveCount);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sortLearnerCourseCards(periodRows
      .filter(row => !continueOnly || learnerCourseHasContinueAction(row))
      .filter(row => learnerCourseMatchesProgress(row,progressFilter))
      .filter(row => learnerCourseMatchesTermState(row,termState))
      .filter((row) => {
        const elective =
          String(row.course.offeringType).toUpperCase() === "ELECTIVE";
        if (effectiveTypeFilter === "core" && elective) return false;
        if (effectiveTypeFilter === "elective" && !elective) return false;
        return learnerCourseMatchesSearch(row, needle);
      })
      ,sortMode);
  }, [periodRows, query, effectiveTypeFilter, continueOnly,sortMode,progressFilter,termState]);

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No courses found"
        description="Courses will appear here when your class, batch and semester have active course assignments."
      />
    );
  }

  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ?? periods[0];
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
                value={selectedPeriodId}
                onChange={(event) => {
                  const reset = learnerCourseSemesterFilterReset();
                  setPeriodId(event.target.value);
                  setQuery(reset.search);
                  setTypeFilter(reset.type);
                  setContinueOnly(false);
                  setProgressFilter("ALL");
                  setTermState("ALL");
                  setSortMode("NAME");
                  setVisibleLimit(reset.visibleLimit);
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
                maxLength={100}
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
              className="grid min-h-11 w-full grid-cols-3 gap-1 rounded-lg border border-border bg-surface-subtle p-1 sm:inline-flex sm:w-auto"
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
                  aria-pressed={effectiveTypeFilter === value}
                  onClick={() => {
                    setTypeFilter(value as "all" | "core" | "elective");
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  className={
                    effectiveTypeFilter === value
                      ? "min-w-0 rounded-md bg-surface px-2 py-2 text-sm font-semibold text-primary-text shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] sm:px-3"
                      : "min-w-0 rounded-md px-2 py-2 text-sm font-semibold text-body hover:text-primary-text focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)] sm:px-3"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-body">
            Term access
            <select value={termState} onChange={e=>{setTermState(e.target.value as LearnerCourseTermState);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
              <option value="ALL">All term courses</option>
              <option value="CURRENT">Currently active</option>
              <option value="HISTORY">Past semester (read-only)</option>
            </select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-body">
            Learning progress
            <select value={progressFilter} onChange={event=>{setProgressFilter(event.target.value as LearnerCourseProgressFilter);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
              <option value="ALL">Any progress</option>
              <option value="NOT_STARTED">Not started</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="UNMEASURED">No tracked items</option>
            </select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-body">
            Sort Courses
            <select value={sortMode} onChange={event => {setSortMode(event.target.value as LearnerCourseSortMode);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-11 rounded-lg border border-border bg-surface px-3 text-sm text-foreground">
              <option value="NAME">Course name</option><option value="PROGRESS">Least progress first</option>
              <option value="DUE">Next assessment due</option>
               <option value="RECENT">Most recently active</option>
            </select>
          </label>
          <button type="button" aria-pressed={continueOnly}
            onClick={() => {setContinueOnly(value => !value);setVisibleLimit(PAGE_SIZE);}}
            className={continueOnly
              ? "min-h-11 rounded-lg border border-primary bg-primary-subtle px-4 text-sm font-semibold text-primary-text"
              : "min-h-11 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-body hover:border-primary"}>
            Continue learning only
          </button>
        </div>
        {learnerCourseHasActiveFilters({query,typeFilter:effectiveTypeFilter,continueOnly,progressFilter,termState,sortMode}) ? (
          <button type="button" onClick={() => {setQuery("");setTypeFilter("all");setContinueOnly(false);setProgressFilter("ALL");setTermState("ALL");setSortMode("NAME");setVisibleLimit(PAGE_SIZE);}}
            className="mt-3 inline-flex min-h-11 items-center rounded-lg border border-border px-4 text-sm font-semibold text-primary-text">
            Clear Course filters
          </button>
        ) : null}
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

      <p role="status" aria-live="polite" className="text-xs font-semibold text-muted-foreground">{learnerCourseResultSummary(Math.min(visibleLimit, visibleRows.length), visibleRows.length)}</p>
      {visibleRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <h2 className="m-0 text-base font-semibold text-foreground">
            {learnerCourseFilteredEmptyTitle({query,continueOnly,typeFilter:effectiveTypeFilter,termState,progressFilter,periodCount:periodRows.length})}
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
                effectiveTypeFilter === "all" &&
                elective &&
                !previousElective &&
                coreCount > 0;

              return (
                <Fragment key={row.course.deliveryId}>
                  {startsElectiveGroup ? (
                    <h2 className="col-span-full mb-1 mt-2 text-base font-semibold text-foreground">
                      Electives
                    </h2>
                  ) : null}
                  <div className="min-w-0">
                    <Link
                    href={`/learn/courses/${row.course.deliveryId}/home`}
                    className="group flex min-h-72 flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                  >
                    <div className="relative flex min-h-24 items-end overflow-hidden bg-primary-subtle px-5 py-4">
                      {learnerCourseCardMedia(row.thumbnailUrl).source === "AUTHORED" ? (
                        <Image
                          src={learnerCourseCardMedia(row.thumbnailUrl).src}
                          alt=""
                          fill
                          unoptimized
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className="pointer-events-none object-cover opacity-20"
                        />
                      ) : (
                        <Image
                          src={learnerCourseCardMedia(row.thumbnailUrl).src}
                          alt=""
                          aria-hidden="true"
                          width={80}
                          height={80}
                          className="pointer-events-none absolute right-2 top-1 h-20 w-20 opacity-20"
                        />
                      )}
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
                            {row.summary.overallPercent === null ? "Not available" : row.summary.overallPercent+"%"}
                          </span>
                        </div>
                        {row.summary.overallPercent !== null ? <div
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
                        </div> : <p className="text-xs text-muted-foreground">No published learning items to measure.</p>}
                        {!row.readOnly && row.overdueAssignments ? (
                          <p className="mt-3 text-xs font-semibold text-warning" role="note">
                            {row.overdueAssignments} overdue {row.overdueAssignments === 1 ? "assignment" : "assignments"} · late submission available
                          </p>
                        ) : null}
                        <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                          <p className="m-0">
                            Last recorded activity: {row.lastActivity
                              ? new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(row.lastActivity))
                              : "Not recorded"}
                          </p>
                          <p className="m-0">
                            Next due: {row.nextDue
                              ? row.nextDue.kind+" · "+row.nextDue.title+" · "+
                                new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(row.nextDue.dueAt))
                              : "No upcoming due dates"}
                          </p>
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
                    {learnerCourseNextItemHref(row) ? (
                      <Link href={learnerCourseNextItemHref(row)!}
                        className="mt-2 flex min-h-11 items-center justify-center rounded-lg border border-primary bg-primary-subtle px-3 text-sm font-semibold text-primary-text hover:bg-muted">
                        Continue at next learning item →
                      </Link>
                    ) : null}
                  </div>
                </Fragment>
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
