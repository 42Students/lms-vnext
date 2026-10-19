"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import Link from "next/link";
import { LearnerCourseCardImage } from "./learner-course-card-image";
import {learnerCourseImageResetKey} from "@/modules/courses/learner-course-image-reset-key-model";
import { learnerCourseCardDueLabel } from "@/modules/courses/learner-course-card-due-label-model";
import { learnerCourseCreditSummary } from "@/modules/courses/learner-course-credit-summary-model";
import { learnerCourseCardProgress } from "@/modules/courses/learner-course-card-progress-model";
import { learnerCourseCardDate } from "@/modules/courses/learner-course-card-date-model";
import { Fragment, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import {learnerCourseSetupCopy,type LearnerCourseSetupStatus} from "@/modules/courses/learner-course-setup-copy";
import { learnerCourseResultSummary } from "@/modules/courses/learner-course-result-summary-model";
import { learnerCourseHasActiveFilters } from "@/modules/courses/learner-course-active-filters-model";
import { learnerCourseFilteredEmptyTitle } from "@/modules/courses/learner-course-filtered-empty-model";
import { learnerCoursePreferredPeriod } from "@/modules/courses/learner-course-preferred-period-model";
import { resolveLearnerCoursePeriod } from "@/modules/courses/learner-course-current-period-model";
import { resolveLearnerCourseTypeFilter } from "@/modules/courses/learner-course-type-availability-model";
import { learnerCourseMatchesSearch } from "@/modules/courses/learner-course-card-search-model";
import { learnerCourseSemesterFilterReset } from "@/modules/courses/learner-course-semester-filter-model";
import {learnerSemesterOptions,type LearnerProgramSemester} from "@/modules/courses/learner-program-semester-options-model";
import { learnerCourseHasContinueAction } from "@/modules/courses/learner-course-continue-model";
import { learnerCourseNextItemHref } from "@/modules/courses/learner-course-next-action-model";
import { learnerCourseMatchesProgress, type LearnerCourseProgressFilter } from "@/modules/courses/learner-course-progress-filter-model";
import { learnerCourseMatchesTermState, type LearnerCourseTermState } from "@/modules/courses/learner-course-term-state-model";
import { sortLearnerCourseCards, type LearnerCourseSortMode } from "@/modules/courses/learner-course-sort-model";

import {learnerCourseCardNextLabel} from "@/modules/courses/learner-course-card-next-label-model";

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
    cohortName: string;
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
  firstOverdue?: {lessonId:string;itemId:string;title:string}|null;
  nextDue: {title:string;kind:"Assignment"|"Quiz";dueAt:string} | null;
  readOnly: boolean;
  learningPathReady: boolean;
  unavailable?: boolean;
  unavailableLabel?: string;
  nextItem: {
    lessonId: string;
    lessonName: string;
    kind: "CONTENT" | "ASSIGNMENT" | "QUIZ";
    itemId: string;
    title: string;
  } | null;
};


export function LearnerCourseList({
  rows,setupStatus=null,programSemesters=[],
}: {
  rows: readonly LearnerCourseListRow[];
  setupStatus?:LearnerCourseSetupStatus|null;
  programSemesters?:readonly LearnerProgramSemester[];
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
    const delivered=[...map.values()].sort((left,right)=>String(right.startDate).localeCompare(String(left.startDate)));
    return learnerSemesterOptions(delivered,programSemesters);
  }, [rows,programSemesters]);

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

  if (rows.length === 0 && periods.length===0) {
    return (
      <EmptyState
        title="No courses found"
        description={setupStatus?learnerCourseSetupCopy[setupStatus]:"Courses will appear here when your class, batch and semester have active course assignments."}
      />
    );
  }

  const safeCardProgress = (row: LearnerCourseListRow) =>
    learnerCourseCardProgress(row.summary.overallPercent,row.summary.itemsTotal);

  const selectedPeriod =
    periods.find((period) => period.id === selectedPeriodId) ?? periods[0];
  const creditSummary = learnerCourseCreditSummary(
    periodRows.map((row) => row.course.credits),
  );

  return (
    <div className="space-y-5">
      <section className="py-1">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-body">
              Semester
              <Select
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
                className="mt-1.5 min-h-11"
                aria-label="Select semester"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="text-xs font-semibold text-body">
              Search courses
              <Input
                value={query}
                maxLength={100}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setVisibleLimit(PAGE_SIZE);
                }}
                placeholder="Search courses…"
                className="mt-1.5 min-h-11"
              />
            </label>
          </div>

          {electiveCount > 0 ? (
            <div
              className="grid min-h-11 sm:min-h-9 w-full grid-cols-3 gap-1 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-1 sm:inline-flex sm:w-auto"
              aria-label="Filter by course type"
            >
              {[
                ["all", `All ${periodRows.length}`],
                ["core", `Regular ${coreCount}`],
                ["elective", `Electives ${electiveCount}`],
              ].map(([value, label]) => (
                <Button
                  key={value}
                  type="button"
                  aria-pressed={effectiveTypeFilter === value}
                  onClick={() => {
                    setTypeFilter(value as "all" | "core" | "elective");
                    setVisibleLimit(PAGE_SIZE);
                  }}
                  variant="secondary" className="min-h-11 min-w-0 px-2 text-xs aria-pressed:!border-[var(--lms-primary)] aria-pressed:!bg-[var(--lms-primary-subtle)] aria-pressed:!text-[var(--lms-primary-text)] sm:px-3"
                >
                  {label}
                </Button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-body">
            Term access
            <Select value={termState} onChange={e=>{setTermState(e.target.value as LearnerCourseTermState);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-11">
              <option value="ALL">All term courses</option>
              <option value="CURRENT">Currently active</option>
              <option value="HISTORY">Past semester (read-only)</option>
            </Select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-body">
            Learning progress
            <Select value={progressFilter} onChange={event=>{setProgressFilter(event.target.value as LearnerCourseProgressFilter);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-11">
              <option value="ALL">Any progress</option>
              <option value="NOT_STARTED">Not started</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="UNMEASURED">No tracked items</option>
            </Select>
          </label>
          <label className="grid min-w-44 gap-1 text-xs font-semibold text-body">
            Sort Courses
            <Select value={sortMode} onChange={event => {setSortMode(event.target.value as LearnerCourseSortMode);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-11">
              <option value="NAME">Course name</option><option value="PROGRESS">Least progress first</option>
              <option value="DUE">Next assessment due</option>
               <option value="RECENT">Most recently active</option>
            </Select>
          </label>
          <Button type="button" aria-pressed={continueOnly}
            onClick={() => {setContinueOnly(value => !value);setVisibleLimit(PAGE_SIZE);}}
            variant="secondary" className="min-h-11 aria-pressed:!border-[var(--lms-primary)] aria-pressed:!bg-[var(--lms-primary-subtle)] aria-pressed:!text-[var(--lms-primary-text)]">
            Continue learning only
          </Button>
        </div>
        {learnerCourseHasActiveFilters({query,typeFilter:effectiveTypeFilter,continueOnly,progressFilter,termState,sortMode}) ? (
          <Button type="button" onClick={() => {setQuery("");setTypeFilter("all");setContinueOnly(false);setProgressFilter("ALL");setTermState("ALL");setSortMode("NAME");setVisibleLimit(PAGE_SIZE);}}
            variant="secondary" className="mt-3 min-h-11">
            Clear Course filters
          </Button>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          {periodRows[0]?.course.programName ? (
            <Badge  tone="neutral">
              {periodRows[0].course.programName}
            </Badge>
          ) : null}
          {selectedPeriod ? (
            <Badge  tone="neutral">
              {selectedPeriod.name}
            </Badge>
          ) : null}
          <Badge  tone="neutral">
            {periodRows.length} {periodRows.length === 1 ? "Course" : "Courses"}
          </Badge>
          {creditSummary.recordedCount > 0 ? (
            <Badge  tone="neutral">
              {creditSummary.credits} recorded credits
              {creditSummary.missingCount > 0
                ? ` · ${creditSummary.missingCount} course credit values unavailable`
                : ""}
            </Badge>
          ) : creditSummary.missingCount > 0 ? (
            <Badge  tone="neutral">Credits not recorded</Badge>
          ) : null}
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <details className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2">
            <summary className="cursor-pointer font-semibold">Semester Details</summary>
            <dl className="mt-2 space-y-1 text-body">
              <div>Program: {periodRows[0]?.course.programName??"Not recorded"}</div>
              <div>Batch: {periodRows[0]?.course.cohortName??"Not recorded"}</div>
              <div>Academic Year: {selectedPeriod?.startDate?.slice(0,4)??"Not recorded"}</div>
              <div>Semester: {selectedPeriod?.name??"Not recorded"}</div>
            </dl>
          </details>
          <details className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2">
            <summary className="cursor-pointer font-semibold">All Courses</summary>
            <ul role="region" aria-label="Scrollable course list" tabIndex={0}
              className="mt-2 max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-2 text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">{periodRows.slice(0,100).map((row,i)=>
              <li key={row.course.deliveryId+"-"+i}>{row.course.courseName}</li>)}</ul>
            {periodRows.length>8?<p className="mt-1 text-muted-foreground">Scroll inside the list for more courses.</p>:null}
            {periodRows.length>100?<p>Showing first 100; search the full list below.</p>:null}
          </details>
          {creditSummary.recordedCount>0?<details className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2">
            <summary className="cursor-pointer font-semibold">Credits Breakdown</summary>
            <ul role="region" aria-label="Scrollable course list" tabIndex={0}
              className="mt-2 max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-2 text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              {periodRows.map((row,i)=><li key={row.course.deliveryId+"-"+i}>
                {row.course.courseName} · {row.course.credits===null?"Credits unavailable":row.course.credits+" cr"}
              </li>)}
            </ul>
            {periodRows.length>8?<p className="mt-1 text-muted-foreground">Scroll inside the list for the full credits breakdown.</p>:null}
            <p className="mt-2 font-semibold">Total {creditSummary.credits} Credits</p>
          </details>:null}
        </div>
      </section>

      {rows.some(row => row.unavailable) ? (
        <p role="alert" className="rounded-lg border border-warning bg-surface p-4 text-sm text-body">
          Some course records have incomplete or duplicate information. Unavailable cards cannot be opened.
          <Button type="button" onClick={() => window.location.reload()} variant="ghost" className="ml-2 !text-[var(--lms-primary-text)] underline">Retry</Button>
        </p>
      ) : null}
      <p role="status" aria-live="polite" className="text-xs font-semibold text-muted-foreground">{learnerCourseResultSummary(Math.min(visibleLimit, visibleRows.length), visibleRows.length, periodRows.length)}</p>
      {visibleRows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
          <h2 className="m-0 text-base font-semibold text-foreground">
            {periodRows.length===0&&selectedPeriod?("No courses found for "+selectedPeriod.name+"."):learnerCourseFilteredEmptyTitle({query,continueOnly,typeFilter:effectiveTypeFilter,termState,progressFilter,periodCount:periodRows.length})}
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

              if (row.unavailable) return (
                <article key={row.course.deliveryId} aria-disabled="true"
                  className="min-h-72 rounded-xl border border-warning bg-surface p-5">
                  <StatusBadge tone="warning">Unavailable</StatusBadge>
                  <h2 className="mt-3 text-lg font-semibold text-foreground">{row.unavailableLabel}</h2>
                  <p className="mt-2 text-sm text-body">{row.course.courseName || "Course name unavailable"}</p>
                  <p className="mt-3 text-sm text-muted-foreground">This course cannot be opened right now. Other courses remain available.</p>
                </article>
              );
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
                      <LearnerCourseCardImage key={learnerCourseImageResetKey(row.course.deliveryId,row.thumbnailUrl)} thumbnailUrl={row.thumbnailUrl} />
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
                          "No course description provided."}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-muted-foreground">
                        Instructor: {row.instructorNames.length > 0
                          ? row.instructorNames.join(", ")
                          : "Not assigned"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge  tone="neutral">
                          {row.course.sectionName}
                        </Badge>
                        {row.course.cohortName ? <Badge  tone="neutral">
                          Batch: {row.course.cohortName}
                        </Badge> : null}
                        {row.course.credits ? (
                          <Badge  tone="neutral">
                            {row.course.credits} Credits
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-auto pt-5">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-xs font-semibold text-body">
                            Progress
                          </span>
                          <span className="text-xs font-bold text-foreground">
                            {safeCardProgress(row) === null ? "Not available" : safeCardProgress(row)+"%"}
                          </span>
                        </div>
                        {safeCardProgress(row) !== null ? <div
                          className="h-2 overflow-hidden rounded-full bg-muted"
                          role="progressbar"
                          aria-label="Course progress"
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-valuenow={safeCardProgress(row)!}
                        >
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${safeCardProgress(row)}%` }}
                          />
                        </div> : <p className="text-xs text-muted-foreground">No published learning items to measure.</p>}
                        {!row.readOnly && row.overdueAssignments ? (
                          <p className="mt-3 text-xs font-semibold text-warning" role="note">
                            {row.overdueAssignments} overdue {row.overdueAssignments === 1 ? "assignment" : "assignments"} · submission deadline passed
                          </p>
                        ) : null}
                        <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                          <p className="m-0">
                            Last recorded activity: {row.lastActivity
                              ? learnerCourseCardDate(row.lastActivity) ?? "Unavailable"
                              : "Not recorded"}
                          </p>
                          <p className="m-0">
                            Next due: {learnerCourseCardDueLabel(row.readOnly,row.nextDue,learnerCourseCardDate)}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-between gap-3">
                          <p className="m-0 line-clamp-1 text-sm font-semibold text-foreground">
                            {learnerCourseCardNextLabel(row)}
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
                    {!row.readOnly && row.firstOverdue && learnerCourseNextItemHref({
                      readOnly:row.readOnly,learningPathReady:row.learningPathReady,course:row.course,
                      nextItem:{kind:"ASSIGNMENT",lessonId:row.firstOverdue.lessonId,itemId:row.firstOverdue.itemId}
                    }) ? (
                      <Link
                        href={learnerCourseNextItemHref({
                          readOnly:row.readOnly,learningPathReady:row.learningPathReady,course:row.course,
                          nextItem:{kind:"ASSIGNMENT",lessonId:row.firstOverdue.lessonId,itemId:row.firstOverdue.itemId}
                        })!}
                        className="mt-2 flex min-h-11 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-warning px-3 text-sm font-semibold text-foreground">
                        Open overdue assignment: {row.firstOverdue.title}
                      </Link>
                    ) : null}
                    {learnerCourseNextItemHref(row) ? (
                      <Link href={learnerCourseNextItemHref(row)!}
                        className="mt-2 flex min-h-11 sm:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary-subtle px-3 text-sm font-semibold text-primary-text hover:bg-muted">
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
              <Button
                type="button"
                onClick={() => setVisibleLimit((value) => value + PAGE_SIZE)}
                variant="secondary" className="min-h-11"
              >
                Show more courses ({visibleRows.length - visibleLimit} remaining)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
