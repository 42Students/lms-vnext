"use client";

import { MetricBar } from "@/components/ui/metric-bar";
import progressStyles from "./learner-course-progress.module.css";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Disclosure } from "@/components/ui/disclosure";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useId } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";

import Link from "next/link";
import { LearnerCourseCardImage } from "./learner-course-card-image";
import {learnerCourseImageResetKey} from "@/modules/courses/learner-course-image-reset-key-model";
import { learnerCourseCardDueLabel } from "@/modules/courses/learner-course-card-due-label-model";
import { learnerCourseCreditSummary } from "@/modules/courses/learner-course-credit-summary-model";
import { learnerCourseCardProgress } from "@/modules/courses/learner-course-card-progress-model";
import { learnerCourseCardDate } from "@/modules/courses/learner-course-card-date-model";
import { Fragment, useMemo, useState, useEffect, useTransition } from "react";
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
  rows,setupStatus=null,programSemesters=[],semestersUnavailable=false,semestersLoadError=null,
}: {
  rows: readonly LearnerCourseListRow[];
  setupStatus?:LearnerCourseSetupStatus|null;
  programSemesters?:readonly LearnerProgramSemester[];
  semestersUnavailable?:boolean;
  semestersLoadError?:"SESSION_EXPIRED"|"LOAD_FAILED"|null;
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
  const [requestedSemesterId,setRequestedSemesterId]=useState<string|null>(null);
  const [isUpdating,startSemesterChange]=useTransition();
  useEffect(()=>{
    const url=new URL(window.location.href);
    const requested=url.searchParams.get("academicPeriodId")??url.searchParams.get("semesterId");
    if(requested){
      setRequestedSemesterId(requested);
      if(periods.some(option=>option.id===requested))setPeriodId(requested);
    }
  },[periods]);
  const selectedPeriodId = resolveLearnerCoursePeriod(periodId, periods, preferredPeriodId);
  const semesterFallbackApplied=Boolean(requestedSemesterId&&
    !periods.some(option=>option.id===requestedSemesterId));
  const [query, setQuery] = useState("");
  const [searchWasTruncated,setSearchWasTruncated]=useState(false);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const filtersId=useId();
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
    <div className="min-w-0 space-y-[16px]">
      {(semestersUnavailable||semestersLoadError)?<Alert tone="warning" role="alert">
        {semestersLoadError==="SESSION_EXPIRED"?"Session expired. Please sign in again.":"Could not load semesters. Existing courses remain available."}
        <Button type="button" size="sm" variant="secondary" onClick={()=>window.location.reload()} className="ml-2 min-h-11 md:min-h-9">Retry semesters</Button>
      </Alert>:null}
      {semesterFallbackApplied?<Alert tone="info">
        The requested semester is unavailable. Showing your current authorized semester.
        <Button type="button" size="sm" variant="secondary" onClick={()=>{
          setRequestedSemesterId(null);setPeriodId(preferredPeriodId);
          const url=new URL(window.location.href);
          url.searchParams.delete("semesterId");url.searchParams.delete("academicPeriodId");
          window.history.replaceState(null,"",url.pathname+url.search+url.hash);
        }}>Use current semester</Button>
      </Alert>:null}
      {isUpdating?<p role="status" className="text-xs text-muted-foreground">Updating courses for the selected semester…</p>:null}
      <section aria-label="Course filters and semester" className="py-1">
        <div className="grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="grid gap-[8px] md:grid-cols-2">
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
              Semester
              <Select
                value={selectedPeriodId}
                onChange={(event) => {
                  const reset = learnerCourseSemesterFilterReset();
                  startSemesterChange(()=>setPeriodId(event.target.value));
                  setRequestedSemesterId(null);
                  setQuery(reset.search);
                  setTypeFilter(reset.type);
                  setContinueOnly(false);
                  // Preserve explicitly selected advanced filters, unlike
                  // obsolete course-type/search filters tied to the old term.
                  setVisibleLimit(reset.visibleLimit);
                }}
                className="mt-1.5 min-h-[var(--lms-control-height)] max-md:min-h-11"
                aria-label="Select semester"
              >
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </Select>
            </label>

            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
              Search courses
              <Input
                value={query}
                maxLength={100}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchWasTruncated(false);
                  setVisibleLimit(PAGE_SIZE);
                }}
                onPaste={event=>{
                 const pasted=event.clipboardData.getData("text");
                 const target=event.currentTarget;
                 if(target.value.length-(target.selectionEnd-target.selectionStart)+pasted.length>100)
                   setSearchWasTruncated(true);
                }}
                placeholder="Search courses by name or code…"
                className="mt-1.5 min-h-[var(--lms-control-height)] max-md:min-h-11"
              />
            </label>
            {searchWasTruncated?<p role="alert" className="text-xs text-warning">Search is limited to 100 characters. Shorten your text to search.</p>:null}
            {query?<Button variant="secondary" type="button" className="min-h-11 w-fit md:min-h-9" onClick={()=>{setQuery("");setSearchWasTruncated(false);}}>Clear search</Button>:null}
          </div>

          {electiveCount > 0 ? (
            <SegmentedControl
              label="Filter by course type"
              value={effectiveTypeFilter}
              onChange={(value) => {
                setTypeFilter(value as "all" | "core" | "elective");
                setVisibleLimit(PAGE_SIZE);
              }}
              options={[
                { value: "all", label: `All ${periodRows.length}` },
                { value: "core", label: `Regular ${coreCount}` },
                { value: "elective", label: `Electives ${electiveCount}` },
              ]}
              className="w-full md:w-auto [&>label]:flex-1 md:[&>label]:flex-none [&>label>span]:min-h-11 md:[&>label>span]:min-h-9"
            />
          ) : null}
        </div>

        <div className="relative mt-3">
         <Button type="button" variant="secondary" aria-expanded={filtersOpen}
          aria-controls={filtersId} onClick={()=>setFiltersOpen(value=>!value)}
          className="min-h-11 md:min-h-9">☷ Filters</Button>
         {filtersOpen?<div id={filtersId} className="absolute left-0 top-full z-20 mt-2 w-full max-w-[540px] rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4 shadow-md" role="group" aria-label="Course filters">
          <div className="flex flex-wrap items-end gap-2">
          <label className="grid min-w-0 w-full gap-[6px] font-semibold sm:w-44 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Term access
            <Select value={termState} onChange={e=>{setTermState(e.target.value as LearnerCourseTermState);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-[var(--lms-control-height)] max-md:min-h-11">
              <option value="ALL">All term courses</option>
              <option value="CURRENT">Currently active</option>
              <option value="HISTORY">Past semester (read-only)</option>
            </Select>
          </label>
          <label className="grid min-w-0 w-full gap-[6px] font-semibold sm:w-44 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Learning progress
            <Select value={progressFilter} onChange={event=>{setProgressFilter(event.target.value as LearnerCourseProgressFilter);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-[var(--lms-control-height)] max-md:min-h-11">
              <option value="ALL">Any progress</option>
              <option value="NOT_STARTED">Not started</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="UNMEASURED">No tracked items</option>
            </Select>
          </label>
          <label className="grid min-w-0 w-full gap-[6px] font-semibold sm:w-44 text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Sort Courses
            <Select value={sortMode} onChange={event => {setSortMode(event.target.value as LearnerCourseSortMode);setVisibleLimit(PAGE_SIZE);}}
              className="min-h-[var(--lms-control-height)] max-md:min-h-11">
              <option value="NAME">Course name</option><option value="PROGRESS">Least progress first</option>
              <option value="DUE">Next assessment due</option>
               <option value="RECENT">Most recently active</option>
            </Select>
          </label>
          <FilterChip type="button" aria-pressed={continueOnly}
            onClick={() => {setContinueOnly(value => !value);setVisibleLimit(PAGE_SIZE);}}
            className="min-h-[var(--lms-control-height)] max-md:min-h-11">
            Continue learning only
          </FilterChip>
          </div>
         <Button type="button" variant="secondary" className="mt-4 min-h-11 md:min-h-9" onClick={()=>setFiltersOpen(false)}>Done</Button>
         </div>:null}
        </div>
        {learnerCourseHasActiveFilters({query,typeFilter:effectiveTypeFilter,continueOnly,progressFilter,termState,sortMode}) ? (
          <Button type="button" onClick={() => {setQuery("");setTypeFilter("all");setContinueOnly(false);setProgressFilter("ALL");setTermState("ALL");setSortMode("NAME");setVisibleLimit(PAGE_SIZE);}}
            variant="secondary" className="mt-3 min-h-[var(--lms-control-height)] max-md:min-h-11">
            Clear Course filters
          </Button>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
          {periodRows[0]?.course.programName ? (
            <Badge tone="neutral">
              {periodRows[0].course.programName}
            </Badge>
          ) : null}
          {selectedPeriod ? (
            <Badge tone="neutral">
              {selectedPeriod.name}
            </Badge>
          ) : null}
          <Badge tone="neutral">
            {periodRows.length} {periodRows.length === 1 ? "Course" : "Courses"}
          </Badge>
          {creditSummary.recordedCount > 0 ? (
            <Badge tone="neutral">
              {creditSummary.credits} {creditSummary.credits===1?"Credit":"Credits"}
              {creditSummary.missingCount > 0
                ? ` · ${creditSummary.missingCount} course credit values unavailable`
                : ""}
            </Badge>
          ) : creditSummary.missingCount > 0 ? (
            <Badge tone="warning">Credits not recorded or invalid</Badge>
          ) : null}
          {periodRows.some(row=>row.course.credits!==null&&
             (!Number.isFinite(row.course.credits)||row.course.credits<0))?
            <Badge tone="warning">Invalid Credits — excluded from total</Badge>:null}
        </div>
        <Disclosure title="Semester information" className="mt-3 border-t border-border" contentClassName="pt-2">
          <div className="flex flex-wrap gap-2 text-xs">
          <Disclosure title="Semester Details" className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 [&>summary]:px-0">
            <div className="mt-2 space-y-1 text-body">
              <div>Program: {periodRows[0]?.course.programName??"Not recorded"}</div>
              <div>Batch: {periodRows[0]?.course.cohortName??"Not recorded"}</div>
              <div>Academic Year: {selectedPeriod?.startDate?.slice(0,4)??"Not recorded"}</div>
              <div>Semester: {selectedPeriod?.name??"Not recorded"}</div>
            </div>
          </Disclosure>
          <Disclosure title="All Courses" className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 [&>summary]:px-0">
            <ul role="region" aria-label="Scrollable course list" tabIndex={0}
              className="mt-2 max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-2 text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{periodRows.slice(0,100).map((row,i)=>
              <li key={row.course.deliveryId+"-"+i}>{row.course.courseName}</li>)}</ul>
            {periodRows.length>8?<p className="mt-1 text-muted-foreground">Scroll inside the list for more courses.</p>:null}
            {periodRows.length>100?<p>Showing first 100; search the full list below.</p>:null}
          </Disclosure>
          {creditSummary.recordedCount>0?<Disclosure title="Credits Breakdown" className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 [&>summary]:px-0">
            <ul role="region" aria-label="Scrollable course list" tabIndex={0}
              className="mt-2 max-h-64 space-y-1 overflow-y-auto overscroll-contain pr-2 text-body focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              {periodRows.slice(0,100).map((row,i)=><li key={row.course.deliveryId+"-"+i}>
                {row.course.courseName} · {row.course.credits===null?"Credits unavailable":!Number.isFinite(row.course.credits)||row.course.credits<0?"Invalid Credits":row.course.credits+" cr"}
              </li>)}
            </ul>
            {periodRows.length>8?<p className="mt-1 text-muted-foreground">Scroll inside the list for the credits breakdown.</p>:null}
            {periodRows.length>100?<p className="mt-1 text-warning">Showing first 100 courses; use search to narrow the rest.</p>:null}
            <p className="mt-2 font-semibold">Total {creditSummary.credits} Credits</p>
          </Disclosure>:null}
          </div>
        </Disclosure>
      </section>

      {rows.some(row => row.unavailable) ? (
        <Alert tone="warning" role="alert" className="flex-row flex-wrap items-center justify-between gap-3">
          <span className="min-w-0 flex-1">Some course records have incomplete or duplicate information. Unavailable cards cannot be opened.</span>
          <Button type="button" onClick={() => window.location.reload()} variant="secondary" className="min-h-[var(--lms-control-height)] max-md:min-h-11">Retry</Button>
        </Alert>
      ) : null}
      <p role="status" aria-live="polite" className="text-xs font-semibold text-muted-foreground leading-[20px]">{learnerCourseResultSummary(Math.min(visibleLimit, visibleRows.length), visibleRows.length, periodRows.length)}</p>
      <section role="region" aria-label="Course list" className="min-w-0">
      {visibleRows.length === 0 ? (
        <EmptyState title={
            periodRows.length===0&&selectedPeriod?("No courses found for "+selectedPeriod.name+"."):
             query.trim()?"No courses match “"+query.trim()+"”.":learnerCourseFilteredEmptyTitle({query,continueOnly,typeFilter:effectiveTypeFilter,termState,progressFilter,periodCount:periodRows.length})}
          description="Change the semester, course type or search to see other courses." />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
                  className="rounded-xl border border-warning bg-surface p-4 sm:p-5">
                  <StatusBadge tone="warning">Unavailable</StatusBadge>
                  <h2 className="mt-3 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{row.unavailableLabel}</h2>
                  <p className="mt-2 text-sm text-body leading-[22px]">{row.course.courseName || "Course name unavailable"}</p>
                  <p className="mt-3 text-sm text-muted-foreground leading-[22px]">This course cannot be opened right now. Other courses remain available.</p>
                </article>
              );
              return (
                <Fragment key={row.course.deliveryId}>
                  {startsElectiveGroup ? (
                    <h2 className="col-span-full mb-1 mt-2 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
                      Electives
                    </h2>
                  ) : null}
                  <div className="min-w-0">
                    <Link
                    href={`/learn/courses/${row.course.deliveryId}/home`}
                    className="group flex min-h-72 flex-col overflow-hidden rounded-xl border border-border bg-surface transition hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 min-h-11 text-sm"
                  >
                    <div className="relative h-[140px] w-full overflow-hidden bg-primary-subtle">
                      <LearnerCourseCardImage key={learnerCourseImageResetKey(row.course.deliveryId,row.thumbnailUrl)} thumbnailUrl={row.thumbnailUrl}/>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-4 pt-3">
                      <span className="text-xs font-bold uppercase tracking-[0.07em] text-primary-text">{row.course.courseCode}</span>
                      <div className="flex flex-wrap gap-1">
                       {row.readOnly?<StatusBadge tone="neutral">Past semester</StatusBadge>:null}
                       {elective?<StatusBadge tone="info">Elective</StatusBadge>:null}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="m-0 line-clamp-2 break-words font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
                        {row.course.courseName}
                      </h2>
                      <p className="mt-2 line-clamp-2 break-words text-sm text-body leading-[22px]">
                        {row.course.courseDescription ??
                          "No course description provided."}
                      </p>
                      <p className="mt-3 text-xs font-semibold text-muted-foreground leading-[20px]">
                        Instructor: {row.instructorNames.length > 0
                          ? row.instructorNames.join(", ")
                          : "Not assigned"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge tone="neutral">
                          {row.course.sectionName}
                        </Badge>
                        {row.course.cohortName ? <Badge tone="neutral">
                          Batch: {row.course.cohortName}
                        </Badge> : null}
                        {row.course.credits!==null ? (
                          Number.isFinite(row.course.credits)&&row.course.credits>=0?
                          <Badge tone="neutral">{row.course.credits} {row.course.credits===1?"Credit":"Credits"}</Badge>:
                          <Badge tone="warning">Invalid Credits</Badge>
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
                        {safeCardProgress(row) !== null ?
                          <MetricBar role="progressbar" label="Course progress" className={progressStyles.track}
                            value={safeCardProgress(row)!} maximum={100} unit="percent" />
                          : <p className="text-xs text-muted-foreground leading-[20px]">No published learning items to measure.</p>}
                        {!row.readOnly && row.overdueAssignments ? (
                          <p className="mt-3 text-xs font-semibold text-warning leading-[20px]" role="note">
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
                          <p className="m-0 line-clamp-1 text-sm font-semibold text-foreground leading-[22px]">
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
                        className="mt-2 inline-flex min-h-11 w-full items-center justify-center break-words px-3 text-center text-sm font-semibold text-warning underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                        Open overdue assignment: {row.firstOverdue.title}
                      </Link>
                    ) : null}
                    {learnerCourseNextItemHref(row) ? (
                      <Link href={learnerCourseNextItemHref(row)!}
                        className="mt-2 flex min-h-11 w-full items-center justify-center break-words rounded-[var(--lms-control-radius)] border border-primary bg-primary-subtle px-3 text-center text-sm font-[650] text-primary-text transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
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
                variant="secondary" className="min-h-[var(--lms-control-height)] max-md:min-h-11"
              >
                Show more courses ({visibleRows.length - visibleLimit} remaining)
              </Button>
            </div>
          ) : null}
        </>
      )}
      </section>
    </div>
  );
}
