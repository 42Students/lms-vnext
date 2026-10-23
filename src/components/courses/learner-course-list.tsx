"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useId, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";

import Link from "next/link";
import { LearnerCourseCardImage } from "./learner-course-card-image";
import {learnerCourseImageResetKey} from "@/modules/courses/learner-course-image-reset-key-model";
import { learnerCourseCreditSummary } from "@/modules/courses/learner-course-credit-summary-model";
import { learnerCourseUnavailableReason } from "@/modules/courses/learner-course-availability-model";
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
import { learnerCourseMatchesProgress, type LearnerCourseProgressFilter } from "@/modules/courses/learner-course-progress-filter-model";
import { learnerCourseMatchesTermState, type LearnerCourseTermState } from "@/modules/courses/learner-course-term-state-model";
import { sortLearnerCourseCards, type LearnerCourseSortMode } from "@/modules/courses/learner-course-sort-model";


const PAGE_SIZE = 48;
const MAX_COURSE_SEARCH_CHARS = 200;

function LearnerCourseCardSurface({
  href, blockedReason, children,
}: {
  href: string;
  blockedReason: string | null;
  children: ReactNode;
}) {
  const baseClass = "group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--lms-canvas-border)] bg-surface text-sm transition-transform duration-150 hover:-translate-y-0.5";
  if (blockedReason) {
    return <div role="group" aria-disabled="true" aria-label={"Course unavailable: " + blockedReason}
      title={blockedReason} className={baseClass + " cursor-not-allowed"}>
      {children}
    </div>;
  }
  return <Link href={href}
    className={baseClass + " transition hover:border-primary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"}>
    {children}
  </Link>;
}

/** Compact keyboard-openable, anchored legacy metric pills. */
function LearnerMetricPopover({title,children}:{title:string;children:ReactNode}){
 return <details className="group relative">
  <summary className="inline-flex min-h-9 cursor-pointer items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary-text marker:hidden hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)]">
   {title} <span className="ml-2 text-muted-foreground" aria-hidden="true">⌄</span>
  </summary>
  <div className="absolute left-0 top-full z-30 mt-1 w-[min(20rem,calc(100vw-3rem))] max-w-[calc(100vw-3rem)] rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 text-sm shadow-lg">
   {children}
  </div>
 </details>;
}

export type LearnerCourseListRow = {
  course: {
    deliveryId: string;
    courseId: string;
    courseName: string;
    courseCode: string;
    /** Legacy slug is informational; navigation uses authorized delivery UUID. */
    courseSlug?: string | null;
    courseDescription: string | null;
    courseEnabled?:boolean;
    courseStatus?:string;
    courseAllowedForDisplay?:number|null;
    offeringType: string;
    electiveSlotName?: string | null;
    isMandatory?: boolean | null;
    electiveOfferingId?: string | null;
    legacyCourseId?: number | null;
    legacyClassId?: number | null;
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
  const [sortWasChosen,setSortWasChosen]=useState(false);
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
    const matches=periodRows
      .filter(row => !continueOnly || learnerCourseHasContinueAction(row))
      .filter(row => learnerCourseMatchesProgress(row,progressFilter))
      .filter(row => learnerCourseMatchesTermState(row,termState))
      .filter((row) => {
        const elective =
          String(row.course.offeringType).toUpperCase() === "ELECTIVE";
        if (effectiveTypeFilter === "core" && elective) return false;
        if (effectiveTypeFilter === "elective" && !elective) return false;
        return learnerCourseMatchesSearch(row, needle);
      });
    // Legacy preserves source order inside regular/elective groups until the
    // learner intentionally chooses an explicit sort mode.
    return sortWasChosen?sortLearnerCourseCards(matches,sortMode):
      matches.map((row,index)=>({row,index})).sort((a,b)=>
        Number(a.row.course.offeringType.toUpperCase()==="ELECTIVE")-
        Number(b.row.course.offeringType.toUpperCase()==="ELECTIVE")||a.index-b.index
      ).map(item=>item.row);
  }, [periodRows, query, effectiveTypeFilter, continueOnly,sortMode,sortWasChosen,progressFilter,termState]);

  if (rows.length === 0 && periods.length===0) {
    return (
      <EmptyState
        title="No courses found"
        description={setupStatus?learnerCourseSetupCopy[setupStatus]:"Courses will appear here when your class, batch and semester have active course assignments."}
      />
    );
  }

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
        The requested semester was unavailable; showing your current semester instead.
        {" "}<Button type="button" size="sm" variant="secondary" onClick={()=>{
          setRequestedSemesterId(null);setPeriodId(preferredPeriodId);
          const url=new URL(window.location.href);
          url.searchParams.delete("semesterId");url.searchParams.delete("academicPeriodId");
          window.history.replaceState(null,"",url.pathname+url.search+url.hash);
        }}>Use current semester</Button>
      </Alert>:null}
      {isUpdating?<p role="status" className="text-xs text-muted-foreground">Updating courses for the selected semester…</p>:null}
      <section aria-label="Courses overview and filters" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {periodRows[0]?.course.programName ? (
              <span className="max-w-full truncate text-sm font-semibold text-[var(--lms-muted-text)]">
                {periodRows[0].course.programName}
              </span>
            ) : null}
            {selectedPeriod ? (
              <LearnerMetricPopover title={selectedPeriod.name}>
                <div className="space-y-1">
                  <p>Program: {periodRows[0]?.course.programName ?? "Not recorded"}</p>
                  <p>Batch: {periodRows[0]?.course.cohortName ?? "Not recorded"}</p>
                  <p>Academic Year: {selectedPeriod.startDate.slice(0,4) || "Not recorded"}</p>
                  <p>Semester: {selectedPeriod.name}</p>
                </div>
              </LearnerMetricPopover>
            ) : null}
            <LearnerMetricPopover title={`${periodRows.length} ${periodRows.length === 1 ? "Course" : "Courses"}`}>
              <ul className="max-h-64 space-y-1 overflow-auto" aria-label="All courses" tabIndex={0}>
                {periodRows.slice(0, 100).map(row => (
                  <li key={row.course.deliveryId}>
                    {learnerCourseUnavailableReason(row) ? (
                      <span aria-disabled="true" className="text-muted-foreground">{row.course.courseName}</span>
                    ) : (
                      <Link className="text-link hover:underline"
                        href={`/learn/courses/${encodeURIComponent(row.course.deliveryId)}/home`}>
                        {row.course.courseName}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
              {periodRows.length > 100 ? <p>Showing the first 100 courses; use search to narrow the list.</p> : null}
            </LearnerMetricPopover>
            {creditSummary.recordedCount > 0 ? (
              <LearnerMetricPopover title={`${creditSummary.credits} Credits`}>
                <ul className="max-h-64 space-y-1 overflow-auto" aria-label="Credits breakdown" tabIndex={0}>
                  {periodRows.slice(0, 100).map(row => (
                    <li key={row.course.deliveryId}>
                      {row.course.courseName} · {row.course.credits === null || !Number.isFinite(row.course.credits) || row.course.credits < 0
                        ? "Credits unavailable" : `${row.course.credits} Credits`}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-semibold">Total {creditSummary.credits} Credits</p>
              </LearnerMetricPopover>
            ) : null}
          </div>

          <div className="flex w-full flex-wrap items-center gap-2 md:w-auto md:justify-end">
            {electiveCount > 0 ? (
              <SegmentedControl
                label="Filter by course type"
                value={effectiveTypeFilter}
                onChange={value => {
                  setTypeFilter(value as "all" | "core" | "elective");
                  setVisibleLimit(PAGE_SIZE);
                }}
                options={[
                  {value: "all", label: `All ${periodRows.length}`},
                  {value: "core", label: `Regular ${coreCount}`},
                  {value: "elective", label: `Electives ${electiveCount}`},
                ]}
              />
            ) : null}
            {periods.length > 0 ? (
              <div className="relative">
                <Button type="button" variant="secondary" onClick={() => setFiltersOpen(value => !value)}
                  aria-expanded={filtersOpen} aria-controls={filtersId}
                  className="min-h-11 md:min-h-9">
                  {selectedPeriod?.name ?? "Filters"} <span aria-hidden="true">⌄</span>
                </Button>
                {filtersOpen ? (
                  <div id={filtersId} role="group" aria-label="Course filters"
                    className="absolute right-0 top-full z-30 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-xl border border-border bg-surface p-4 shadow-lg">
                    <label className="grid gap-2 text-sm font-semibold">
                      Semester
                      <Select value={selectedPeriodId}
                        onChange={event => {
                          const reset=learnerCourseSemesterFilterReset();
                          startSemesterChange(() => setPeriodId(event.target.value));
                          setRequestedSemesterId(null);
                          setQuery(reset.search);
                          setTypeFilter(reset.type);
                          setContinueOnly(false);
                          setVisibleLimit(reset.visibleLimit);
                          setFiltersOpen(false);
                        }} aria-label="Select semester">
                        {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
                      </Select>
                    </label>
                    <details className="mt-4 border-t border-border pt-3">
                      <summary className="cursor-pointer text-sm font-semibold">More filters</summary>
                      <div className="mt-3 grid gap-3">
                        <label className="grid gap-1 text-sm">Term access
                          <Select value={termState} onChange={event => {setTermState(event.target.value as LearnerCourseTermState);setVisibleLimit(PAGE_SIZE);}}>
                            <option value="ALL">All term courses</option>
                            <option value="CURRENT">Currently active</option>
                            <option value="HISTORY">Past semester (read-only)</option>
                          </Select>
                        </label>
                        <label className="grid gap-1 text-sm">Learning progress
                          <Select value={progressFilter} onChange={event => {setProgressFilter(event.target.value as LearnerCourseProgressFilter);setVisibleLimit(PAGE_SIZE);}}>
                            <option value="ALL">Any progress</option>
                            <option value="NOT_STARTED">Not started</option>
                            <option value="IN_PROGRESS">In progress</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="UNMEASURED">No tracked items</option>
                          </Select>
                        </label>
                        <label className="grid gap-1 text-sm">Sort Courses
                          <Select value={sortMode} onChange={event => {setSortMode(event.target.value as LearnerCourseSortMode);setSortWasChosen(true);setVisibleLimit(PAGE_SIZE);}}>
                            <option value="NAME">Course name</option>
                            <option value="PROGRESS">Least progress first</option>
                            <option value="DUE">Next assessment due</option>
                            <option value="RECENT">Most recently active</option>
                          </Select>
                        </label>
                        <FilterChip type="button" aria-pressed={continueOnly}
                          onClick={() => {setContinueOnly(value => !value);setVisibleLimit(PAGE_SIZE);}}>
                          Continue learning only
                        </FilterChip>
                      </div>
                    </details>
                    <Button type="button" variant="secondary" onClick={() => setFiltersOpen(false)}
                      className="mt-4 min-h-11 md:min-h-9">Done</Button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="w-full min-w-48 md:w-56">
              <Input aria-label="Search courses" placeholder="Search courses…" maxLength={MAX_COURSE_SEARCH_CHARS}
                value={query} onChange={event => {setQuery(event.target.value);setSearchWasTruncated(false);setVisibleLimit(PAGE_SIZE);}}
                onPaste={event => {
                  const pasted=event.clipboardData.getData("text");
                  const target=event.currentTarget;
                  const start=target.selectionStart??target.value.length;
                  const end=target.selectionEnd??start;
                  if(target.value.length-Math.max(0,end-start)+pasted.length>MAX_COURSE_SEARCH_CHARS)
                    setSearchWasTruncated(true);
                }}
              />
            </div>
          </div>
        </div>
        {searchWasTruncated ? (
          <p role="alert" className="text-xs text-warning">Search is limited to 200 characters. Shorten your text to search.</p>
        ) : null}
        {learnerCourseHasActiveFilters({query,typeFilter:effectiveTypeFilter,continueOnly,progressFilter,termState,sortMode}) ? (
          <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
            onClick={() => {setQuery("");setTypeFilter("all");setContinueOnly(false);setProgressFilter("ALL");setTermState("ALL");setSortMode("NAME");setSortWasChosen(false);setVisibleLimit(PAGE_SIZE);}}>
            Clear Course filters
          </Button>
        ) : null}
      </section>

      {rows.some(row => row.unavailable) ? (
        <Alert tone="warning" role="alert" className="flex-row flex-wrap items-center justify-between gap-3">
          <span className="min-w-0 flex-1">Some course records have incomplete or duplicate information. Unavailable cards cannot be opened. Please contact your administrator.</span>
          <Button type="button" onClick={() => window.location.reload()} variant="secondary" className="min-h-[var(--lms-control-height)] max-md:min-h-11">Retry</Button>
        </Alert>
      ) : null}
      <p role="status" aria-live="polite" className="text-xs font-semibold text-muted-foreground leading-[20px]">{learnerCourseResultSummary(Math.min(visibleLimit, visibleRows.length), visibleRows.length, periodRows.length)}</p>
      <section role="region" aria-label="Course list" aria-busy={isUpdating} className="min-w-0">
      {visibleRows.length === 0 ? (
        <EmptyState title={
            periodRows.length===0&&selectedPeriod?("No courses found for "+selectedPeriod.name+"."):
             query.trim()?"No courses match “"+query.trim()+"”.":learnerCourseFilteredEmptyTitle({query,continueOnly,typeFilter:effectiveTypeFilter,termState,progressFilter,periodCount:periodRows.length})}
          description="Change the semester, course type or search to see other courses." />
      ) : (
        <>
          <div className="grid gap-8 [grid-template-columns:repeat(auto-fill,minmax(min(100%,280px),1fr))]">
            {visibleRows.slice(0, visibleLimit).map((row, index, renderedRows) => {
              const elective =
                String(row.course.offeringType).toUpperCase() === "ELECTIVE";
              const blockedReason = learnerCourseUnavailableReason(row);
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
                    <h2 className="col-span-full mb-1 mt-2 text-lg font-semibold text-[var(--lms-heading)]">
                      Electives
                    </h2>
                  ) : null}
                  <div className="min-w-0" data-testid="learner.courses.card.wrap">
                    <LearnerCourseCardSurface
                      href={`/learn/courses/${encodeURIComponent(row.course.deliveryId)}/home`}
                      blockedReason={blockedReason}
                    >
                      <div className="relative h-[140px] w-full shrink-0 overflow-hidden bg-primary-subtle">
                        <LearnerCourseCardImage
                          key={learnerCourseImageResetKey(row.course.deliveryId,row.thumbnailUrl)}
                          thumbnailUrl={row.thumbnailUrl}
                        />
                      </div>
                      <div className="flex flex-1 flex-col gap-2 p-6">
                        <h2 className="m-0 line-clamp-2 text-base font-semibold leading-[1.4] text-[var(--lms-heading)]">
                          {row.course.courseName}
                        </h2>
                        {elective ? (
                          <div>
                            <StatusBadge tone="info">{row.course.electiveSlotName?.trim() || "Elective"}</StatusBadge>
                          </div>
                        ) : null}
                        <p className="m-0 truncate text-sm text-[var(--lms-muted-text)]">
                          Instructor: {row.instructorNames.length > 0
                            ? row.instructorNames.join(", ")
                            : "Not assigned"}
                        </p>
                        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2 text-xs font-semibold text-[var(--lms-muted-text)]">
                          {row.course.credits !== null ? (
                            <span>{Number.isFinite(row.course.credits) && row.course.credits >= 0
                              ? `${row.course.credits} Credits`
                              : "Credits unavailable"}</span>
                          ) : null}
                        </div>
                        {blockedReason ? (
                          <p role="status" className="m-0 text-xs text-warning">{blockedReason}</p>
                        ) : null}
                      </div>
                    </LearnerCourseCardSurface>
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
