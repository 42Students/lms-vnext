"use client";
import { StatTile } from "@/components/ui/stat-tile";
import styles from "./learner-assessment-metrics.module.css";
import { AssessmentMetricGlyph } from "./learner-assessment-metric-glyph";
import { Badge } from "@/components/ui/badge";
import { Alert } from "@/components/ui/alert";
import { NeedsDoingChips } from "@/components/ui/needs-doing-chips";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import Link from "next/link";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import {useRouter} from "next/navigation";
import {learnerAssessmentCourseHref} from "@/modules/courses/learner-assessment-course-query-model";
import {learnerAssessmentDrawerSelectionAllowed} from "@/modules/courses/learner-assessment-drawer-scope-model";
import {learnerAssessmentEmptyMessage} from "@/modules/courses/learner-assessment-empty-model";
import { learnerAssessmentCourseScopeCount } from "@/modules/courses/learner-assessment-course-scope-count-model";
import { learnerAssessmentPageSummary } from "@/modules/courses/learner-assessment-page-summary-model";
import { learnerAssessmentDateLabel } from "@/modules/courses/learner-assessment-date-label-model";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { learnerAssessmentScopedItems } from "@/modules/courses/learner-assessment-scope-attention-model";
import { learnerAssessmentQuickCounts } from "@/modules/courses/learner-assessment-quick-counts-model";
import { learnerAssessmentClock } from "@/modules/courses/learner-assessment-clock-model";
import { Drawer } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AssignmentFileOpenControl } from "./assignment-file-open-control";
import { AssignmentSubmissionLinks } from "./assignment-submission-links";
import { AssignmentSubmissionControl } from "./assignment-submission-control";
import { quizOverviewActionState } from "./quiz-overview-state";
import { assignmentOverviewState } from "@/modules/courses/learner-assignment-display";
import {learnerAssignmentMobileState} from "@/modules/courses/learner-assignment-mobile-model";
import {learnerQuizMobileState} from "@/modules/courses/learner-quiz-mobile-model";
import { learnerAssessmentMatchesSearch } from "@/modules/courses/learner-assessment-search-model";
import { learnerAssessmentCourseCounts } from "@/modules/courses/learner-assessment-course-counts-model";
import { learnerAssessmentMatchesState, LEARNER_ASSESSMENT_STATE_OPTIONS, type LearnerAssessmentStateFilter } from "@/modules/courses/learner-assessment-state-filter-model";
import { learnerAssessmentActionCounts } from "@/modules/courses/learner-assessment-action-counts-model";
import { learnerAssessmentActiveCourse } from "@/modules/courses/learner-assessment-active-course-model";
import { learnerAssessmentFiltersActive } from "@/modules/courses/learner-assessment-filters-active-model";
import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
import { learnerAssessmentSubmittedLinkHref } from "@/modules/courses/learner-assessment-submitted-link-model";
import { learnerAssessmentSort, LEARNER_ASSESSMENT_SORT_OPTIONS, type LearnerAssessmentSort } from "@/modules/courses/learner-assessment-sort-model";

type AssignmentResource = {
  id: string;
  kind: "INSTRUCTIONS" | "PDF" | "FILE" | "LINK";
  title: string;
  text?: string | null;
  /** A server-authorized HTTPS URL; raw storage keys must not reach the client. */
  href?: string | null;
  downloadHref?: string | null;
};

function safeResourceHref(value: string | null | undefined): string | null {
  if (!value || value !== value.trim() || /[\\\x00-\x1f\x7f]/.test(value)) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

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
  lessonId: string;
  lessonName: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  createdAt: string;
};

export type LearnerAssignmentOverviewItem =
  CommonItem & {
    kind: "ASSIGNMENT";
    maxPoints: number;
    submissionId: string | null;
    submissionType: "TEXT" | "LINK" | "FILE" | null;
    submissionText: string | null;
    submissionUrl: string | null;
    submittedAt: string | null;
    gradePublished: boolean;
    pointsAwarded: number | null;
    feedback: string | null;
    /** Populated only from a learner-authorized material projection. */
    resources?: readonly AssignmentResource[];
    submissionReadUnavailable?: boolean;
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
    /** Latest score is optional until the server supplies the released grade. */
    latestScore?: number | null;
    latestMaxScore?: number | null;
    progressStatus:
      | "NOT_STARTED"
      | "COMPLETED"
      | "MISSED";
  };

type Item =
  | LearnerAssignmentOverviewItem
  | LearnerQuizOverviewItem;

function formatDate(value:string|null) {
  return learnerAssessmentDateLabel(value);
}

const PAGE_SIZE = 20;

export function LearnerAssessmentOverview({
  courses,
  items,
  kind,
  snapshotNowMs,
  fileUploadsEnabled = false,
  classScope="PRESENT",initialCourseId="",
  loadError = false,
}: {
  courses: readonly CourseChoice[];
  items: readonly Item[];
  kind: "ASSIGNMENT" | "QUIZ";
  snapshotNowMs: number;
  fileUploadsEnabled?: boolean;
  classScope?:"NONE"|"PRESENT"|"UNAVAILABLE";
  initialCourseId?:string;
  /** The server must distinguish read failure from a genuinely empty list. */
  loadError?: boolean;
}) {
  const router=useRouter();
  const [clock, setClock] = useState({ snapshotNowMs, elapsedMs: 0 });
  const currentNowMs = learnerAssessmentClock(snapshotNowMs,
    clock.snapshotNowMs === snapshotNowMs ? clock.elapsedMs : 0);
  useEffect(() => {
    const startedAt = performance.now();
    const tick = () => setClock({ snapshotNowMs, elapsedMs: performance.now() - startedAt });
    const interval = window.setInterval(tick, 1000);
    const onVisibility = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [snapshotNowMs]);

  const [lastGoodItems,setLastGoodItems] = useState<readonly Item[]>(items);
  useEffect(() => {
    if (!loadError) setLastGoodItems(items);
  }, [items,loadError]);
  const visibleItems = loadError && lastGoodItems.length > 0 ? lastGoodItems : items;
  const [courseId, setCourseId] =
    useState(initialCourseId);
  const activeCourseId = learnerAssessmentActiveCourse(courseId,courses);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<LearnerAssessmentStateFilter>("ALL");
  const [sort, setSort] = useState<LearnerAssessmentSort>("DUE");
  const [page, setPage] = useState(1);
  const [
    selectedAssignmentKey,
    setSelectedAssignmentKey,
  ] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      learnerAssessmentSort(visibleItems.filter(item =>
        (!activeCourseId || item.courseId === activeCourseId) &&
        learnerAssessmentMatchesSearch(item, search) &&
        learnerAssessmentMatchesState(item, stateFilter, currentNowMs),
      ),sort),
    [activeCourseId, visibleItems, search, stateFilter, currentNowMs,sort],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const countsByCourse=useMemo(()=>learnerAssessmentCourseCounts(visibleItems),[visibleItems]);
  const scopedAttentionItems=learnerAssessmentScopedItems(visibleItems,activeCourseId);
  const submittedQuizzes=scopedAttentionItems.filter(item=>item.kind==="QUIZ"&&item.attemptsUsed>0);
  const actionCounts=learnerAssessmentActionCounts(scopedAttentionItems,currentNowMs);
  const quickCounts=learnerAssessmentQuickCounts(scopedAttentionItems,currentNowMs);

  const completed = scopedAttentionItems.filter((item) =>
    item.kind === "ASSIGNMENT"
      ? Boolean(item.submittedAt)
      : item.attemptsUsed > 0,
  ).length;

  const selectedAssignment = useMemo(
    () => learnerAssessmentDrawerSelectionAllowed(selectedAssignmentKey,filtered)
      ? visibleItems.find(
          (item):item is LearnerAssignmentOverviewItem =>
            item.kind==="ASSIGNMENT" &&
            `${item.deliveryId}:${item.id}`===selectedAssignmentKey,
        )
      : undefined,
    [visibleItems,filtered,selectedAssignmentKey],
  );

  if (loadError && visibleItems.length === 0) {
    return <Alert tone="error" role="alert" title={kind === "ASSIGNMENT"
      ? "Couldn't refresh assignments"
      : "Couldn't refresh quizzes"}>
      <Button type="button" variant="secondary" className="mt-2 w-fit"
        onClick={() => router.refresh()}>Retry</Button>
    </Alert>;
  }
  if(visibleItems.length===0 && kind==="QUIZ" && classScope==="NONE"){
    return <EmptyState title="You haven't been added to a class yet"
      description="Quizzes appear once your college puts you in a class or section." />;
  }
  if(items.length===0 && kind==="QUIZ" && classScope==="UNAVAILABLE"){
    return <Alert tone="error" role="alert">
      Couldn&apos;t load your class, so quizzes can&apos;t be shown.
      <Link href="/learn/allQuizzes" className="inline-flex min-h-11 w-fit items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Retry</Link>
    </Alert>;
  }
  if (visibleItems.length === 0) {
    return (
      <EmptyState
        title={
          kind === "ASSIGNMENT"
            ? "No assignments yet"
            : "No quizzes yet"
        }
        description={
          kind === "ASSIGNMENT"
            ? "Your assignments will appear here once your teachers add them."
            : "Quizzes assigned to you by your teachers will appear here."
        }
      />
    );
  }

  return (
    <div className="min-w-0 space-y-[16px]">
      {loadError ? <Alert tone="warning" role="status"
        title={kind === "ASSIGNMENT" ? "Couldn't refresh assignments" : "Couldn't refresh quizzes"}>
        <span>Showing the last loaded list. Submission actions are unavailable until a successful refresh.</span>
        <Button type="button" variant="secondary" className="mt-2 w-fit"
          onClick={() => router.refresh()}>Retry</Button>
      </Alert> : null}
      {kind==="QUIZ" ? (
        <section aria-label="Quiz summary" className="flex min-w-0 flex-wrap items-center gap-2 border-b border-border pb-3 text-sm font-semibold text-body">
          <Badge tone="neutral">{scopedAttentionItems.length} {scopedAttentionItems.length===1?"Quiz":"Quizzes"}</Badge>
          <Disclosure title={`${submittedQuizzes.length} Submitted`} className="min-w-0">
            {submittedQuizzes.length>0 ? (
              <>
                <ul role="region" aria-label="Submitted quizzes, scroll for more" tabIndex={0}
                  className="mt-2 max-h-48 space-y-1 overflow-y-auto overscroll-contain pr-2 text-xs font-normal focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                  {submittedQuizzes.map(item=><li key={item.deliveryId+":"+item.id}>{item.title}</li>)}
                </ul>
                {submittedQuizzes.length>5?<p className="mt-1 text-xs font-normal text-muted-foreground">
                  Scroll to see more submitted quizzes.
                </p>:null}
              </>
            ) : <p className="mt-2 text-xs font-normal">No quizzes submitted yet.</p>}
          </Disclosure>
        </section>
      ) : (<Disclosure title="Assessment totals" className="border-b border-border" contentClassName="pb-4"><div className={styles.metricGrid} aria-label="Assessment totals">
        <StatTile className={styles.tile}
          label={
            kind === "ASSIGNMENT"
              ? "Assignments"
              : "Quizzes"
          }
          value={scopedAttentionItems.length}
        ><span className={styles.icon}><AssessmentMetricGlyph kind="assignment" /></span></StatTile>
        <StatTile className={styles.tile}
          label="Courses"
          value={learnerAssessmentCourseScopeCount(courses,activeCourseId)}
        ><span className={styles.icon}><AssessmentMetricGlyph kind="courses" /></span></StatTile>
        <StatTile className={styles.tile} label="Needs action" value={actionCounts.pending}>
          <span className={styles.icon}><AssessmentMetricGlyph kind="pending" /></span>
        </StatTile>
        <StatTile className={styles.tile} label="Overdue / missed" value={actionCounts.overdue}>
          <span className={styles.icon}><AssessmentMetricGlyph kind="overdue" /></span>
        </StatTile>
        <StatTile className={styles.tile}
          label={
            kind === "ASSIGNMENT"
              ? "Submitted"
              : "Attempted"
          }
          value={completed}
        ><span className={styles.icon}><AssessmentMetricGlyph kind="submitted" /></span></StatTile>
      </div></Disclosure>
      )}

      <NeedsDoingChips
        label={kind === "ASSIGNMENT" ? "Assignment quick views:" : "Quiz quick views:"}
        items={quickCounts.map(quick => ({
          key: quick.value,
          label: LEARNER_ASSESSMENT_STATE_OPTIONS.find(option => option.value === quick.value)?.label ?? quick.value,
          count: quick.count,
          tone: "neutral",
        }))}
        selectedKey={stateFilter}
        onSelect={(key) => {
          setStateFilter(value => value === key ? "ALL" : key as LearnerAssessmentStateFilter);
          setPage(1);
        }}
      />
      <div className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
        <label className="w-full text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search {kind === "ASSIGNMENT" ? "assignments" : "quizzes"}</span>
          <Input type="search" value={search} maxLength={100}
            onChange={event => {setSearch(event.target.value);setPage(1);}}
            placeholder="Title, lesson or course"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="w-full text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Course
          </span>
          <Select className="min-h-11 md:min-h-9"
            value={activeCourseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setPage(1);
              router.push(learnerAssessmentCourseHref(kind,event.target.value||null));
            }}
          >
            <option value="">
              All courses
            </option>
            {courses.map((course) => (
              <option
                key={course.id}
                value={course.id}
              >
                {course.name} · {course.code}{initialCourseId&&initialCourseId!==course.id?"":` (${countsByCourse.get(course.id)??0})`}
              </option>
            ))}
          </Select>
        </label>
      </div>
      <Disclosure title="State · Sort" className="border-b border-border" contentClassName="grid min-w-0 gap-[var(--lms-space-3)] pb-4 md:grid-cols-2">
        <label className="min-w-0 w-full text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">State</span>
          <Select className="min-h-11 md:min-h-9" value={stateFilter}
            onChange={event => {
              setStateFilter(event.target.value as LearnerAssessmentStateFilter);
              setPage(1);
            }}>
            {LEARNER_ASSESSMENT_STATE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>
        <label className="w-full text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Sort</span>
          <Select className="min-h-11 md:min-h-9" value={sort} onChange={event => {
            setSort(event.target.value as LearnerAssessmentSort);setPage(1);
          }}>
            {LEARNER_ASSESSMENT_SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>
      </Disclosure>

      <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p role="status" className="min-w-0 text-sm text-muted-foreground">
          {learnerAssessmentPageSummary({
            filteredCount:filtered.length,totalCount:visibleItems.length,
            currentPage,pageSize:PAGE_SIZE,label:kind==="ASSIGNMENT"?"assignments":"quizzes",
          })}
        </p>
        {learnerAssessmentFiltersActive({courseId:activeCourseId,search,stateFilter,sort}) ? (
          <Button type="button" onClick={() => {
            setCourseId("");setSearch("");setStateFilter("ALL");setSort("DUE");setPage(1);
            if(initialCourseId)router.push(learnerAssessmentCourseHref(kind,null));
          }} variant="secondary" className="min-h-11 w-full shrink-0 sm:w-auto md:min-h-9">
            Clear assessment filters
          </Button>
        ) : null}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          {...learnerAssessmentEmptyMessage({kind,courseSelected:Boolean(activeCourseId),search,stateFilter})}
        />
      ) : (
        <>
        {kind==="QUIZ" ? (
          <DataTable
            caption="Quiz list"
            rows={paged.filter((item): item is LearnerQuizOverviewItem => item.kind==="QUIZ")}
            getRowKey={item=>item.deliveryId+":"+item.id}
            empty={<EmptyState title="No quizzes found" description="Try adjusting your filters." />}
            columns={[
              {key:"overview",header:"Overview",mobilePriority:"primary" as const,
                cell:(item)=><div className="min-w-0">
                  <strong className="block break-words text-foreground">{item.title}</strong>
                  {item.description?<p className="mt-1 max-w-prose line-clamp-2 break-words text-xs text-muted-foreground">{item.description}</p>:null}
                </div>},
              {key:"course",header:"Course",mobilePriority:"secondary" as const,
                cell:(item)=><span className="break-words">{item.courseName}</span>},
              {key:"lesson",header:"Lesson",mobilePriority:"secondary" as const,
                cell:(item)=><span className="break-words">{item.lessonName}</span>},
              {key:"status",header:"Status",mobilePriority:"secondary" as const,
                cell:(item)=><span className="block min-w-0">
                  <StatusBadge tone={quizOverviewActionState(item,currentNowMs).tone}>
                    {quizOverviewActionState(item,currentNowMs).label}
                  </StatusBadge>
                  <span className="block text-xs text-muted-foreground md:hidden">
                    {learnerQuizMobileState(item,currentNowMs).detail}
                  </span>
                </span>},
              {key:"due",header:"Due Date",mobilePriority:"secondary" as const,
                cell:(item)=>item.dueAt?formatDate(item.dueAt):"No deadline"},
              {key:"grade",header:"Grade",mobilePriority:"secondary" as const,
                cell:(item)=>{
                  if (item.attemptsUsed === 0) return "–";
                  if (!item.resultsPublished) return "Not released";
                  const score = item.latestScore;
                  const maximum = item.latestMaxScore;
                  return typeof score === "number" && Number.isFinite(score) &&
                    typeof maximum === "number" && Number.isFinite(maximum) && maximum >= 0 &&
                    score >= 0 && score <= maximum
                      ? `${score} / ${maximum}`
                      : "View result";
                }},
              {key:"actions",header:"Actions",mobilePriority:"action" as const,
                cell:(item)=>{
                  const state=quizOverviewActionState(item,currentNowMs);
                  return <div className="flex min-w-0 flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    <Link href={`/quiz?quizId=${encodeURIComponent(item.id)}&deliveryId=${encodeURIComponent(item.deliveryId)}${state.review?"&review=true":""}`}
                      className="inline-flex min-h-11 w-full items-center justify-center break-words font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">{state.action}</Link>
                    <Link href={"/learn/allQuizzes/"+encodeURIComponent(item.id)+"?deliveryId="+encodeURIComponent(item.deliveryId)}
                      className="inline-flex min-h-11 w-full items-center justify-center break-words font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Attempt history</Link>
                  </div>;
                }},
            ]}
          />
        ) : null}
        {kind==="ASSIGNMENT" ? (
        <div className="space-y-3" aria-label="Assignment list">
          {paged.map((item) => {
            const state =
              item.kind === "ASSIGNMENT"
                ? { ...assignmentOverviewState(item, currentNowMs), review: false }
                : quizOverviewActionState(item, currentNowMs);
            const href =
              item.kind === "QUIZ"
                ? `/quiz?quizId=${encodeURIComponent(item.id)}&deliveryId=${encodeURIComponent(item.deliveryId)}${state.review ? "&review=true" : ""}`
                : `/learn/courses/${item.deliveryId}/roadmap?filter=assessments&lesson=${encodeURIComponent(item.lessonId)}&content=${encodeURIComponent(item.id)}`;

            return (
              <article
                key={`${item.deliveryId}-${item.id}`}
                className="min-w-0 rounded-[12px] border border-border bg-white px-4 py-4 md:px-5"
              >
                <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-6">
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
                    <h2 className="mt-2 break-words text-base font-semibold text-foreground">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-sm text-body">
                      {item.courseName} ·{" "}
                      {item.lessonName}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.kind==="ASSIGNMENT"&&!item.dueAt
                        ? `Created: ${formatDate(item.createdAt)}`
                        : item.dueAt
                          ? `Due ${formatDate(item.dueAt)}`
                          : "No deadline"}
                    </p>
                    {item.kind === "ASSIGNMENT" ? (
                      <p className="mt-2 break-words text-xs font-semibold text-body md:hidden"
                        role="status">
                        {learnerAssignmentMobileState(item,currentNowMs).label}
                        {" · "}{learnerAssignmentMobileState(item,currentNowMs).detail}
                      </p>
                    ) : null}
                    {item.kind === "QUIZ" ? (
                      <p role="status"
                        className="mt-2 break-words text-xs font-semibold text-body md:hidden">
                        {learnerQuizMobileState(item,currentNowMs).label}
                        {" · "}{learnerQuizMobileState(item,currentNowMs).detail}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-2 max-w-prose line-clamp-2 text-sm leading-[22px] text-body">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex w-full min-w-0 flex-col items-stretch gap-2 md:w-auto md:shrink-0 md:items-end">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.kind ===
                      "ASSIGNMENT"
                        ? `${item.maxPoints} points`
                        : `${item.totalPoints} points · ${item.attemptsUsed}/${item.maxAttempts} attempts`}
                    </span>
                    {item.kind === "ASSIGNMENT" ? (
                      <Button
                        type="button"
                        onClick={() =>
                          setSelectedAssignmentKey(
                            `${item.deliveryId}:${item.id}`,
                          )
                        }
                        className="min-h-11 w-full md:w-auto"
                      >
                        {state.action}
                      </Button>
                    ) : (
                      <Link
                        href={href}
                        className="inline-flex min-h-11 md:min-h-9 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] transition-colors hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[rgba(38,186,199,0.35)] md:w-auto"
                      >
                        {state.action}
                      </Link>
                    )}
                    {item.kind === "QUIZ" ? (
                      <Link
                        href={"/learn/allQuizzes/" + encodeURIComponent(item.id) + "?deliveryId=" + encodeURIComponent(item.deliveryId)}
                        className="inline-flex min-h-11 w-full items-center justify-center text-xs font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9 md:w-auto"
                      >
                        Attempt history
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        ) : null}
        </>
      )}

      <Drawer
        open={Boolean(selectedAssignment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedAssignmentKey(null);
          }
        }}
        title={selectedAssignment?.title ?? "Assignment"}
        description={
          selectedAssignment
            ? `${selectedAssignment.courseName} · ${selectedAssignment.lessonName}`
            : undefined
        }
        footer={
          selectedAssignment ? (
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Link
              href={`/learn/courses/${selectedAssignment.deliveryId}/roadmap?filter=assessments&lesson=${encodeURIComponent(selectedAssignment.lessonId)}&content=${encodeURIComponent(selectedAssignment.id)}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-white)] px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-button-primary)] hover:bg-[var(--lms-button-primary)] hover:text-[var(--lms-on-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto text-sm"
            >
              Open in Learning Path
            </Link>
            <Link href={"/learn/allAssignments/" + encodeURIComponent(selectedAssignment.id) + "?deliveryId=" + encodeURIComponent(selectedAssignment.deliveryId)}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-[var(--lms-space-3)] text-[var(--lms-font-base)] font-[650] text-[var(--lms-on-primary)] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:w-auto text-sm">
              Full assignment details
            </Link>
            </div>
          ) : undefined
        }
      >
        {selectedAssignment ? (
          <div className="min-w-0 space-y-4 md:space-y-6">
            <div className="grid min-w-0 grid-cols-2 gap-4 border-b border-border pb-4">
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Due
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(selectedAssignment.dueAt)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Points
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {selectedAssignment.maxPoints}
                </p>
              </div>
            </div>

            <section aria-label="Instructions and resources" className="space-y-3">
              <h3 className="m-0 text-sm font-semibold text-foreground">
                Instructions & resources
              </h3>
              {selectedAssignment.description ? (
                <article className="rounded-[var(--lms-control-radius)] border border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <span aria-hidden="true">▤</span> Instructions
                  </div>
                  <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">
                    {selectedAssignment.description}
                  </p>
                </article>
              ) : null}
              {(selectedAssignment.resources ?? []).map(resource => {
                const openHref = safeResourceHref(resource.href);
                const downloadHref = safeResourceHref(resource.downloadHref);
                const isFile = resource.kind === "FILE" || resource.kind === "PDF";
                return (
                  <article key={resource.id} className="min-w-0 rounded-[var(--lms-control-radius)] border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <strong className="block break-words text-sm text-foreground">
                          <span aria-hidden="true">{resource.kind === "PDF" ? "▣" : isFile ? "▤" : resource.kind === "LINK" ? "↗" : "▤"} </span>
                          {resource.title || resource.kind}
                        </strong>
                        <span className="block text-xs text-muted-foreground">{resource.kind === "PDF" ? "PDF" : resource.kind === "FILE" ? "File" : resource.kind === "LINK" ? "Link" : "Instructions"}</span>
                      </div>
                      {openHref ? (
                        <ThirdPartyLink href={openHref} label={resource.kind === "PDF" ? "Open PDF" : isFile ? "Open file" : "Open link"} />
                      ) : isFile || resource.kind === "LINK" ? (
                        <span className="text-xs text-muted-foreground">File preview is unavailable right now.</span>
                      ) : null}
                      {isFile && downloadHref ? (
                        <a href={downloadHref} target="_blank" rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
                          Download
                        </a>
                      ) : null}
                    </div>
                    {resource.kind === "INSTRUCTIONS" && resource.text ? (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-body">{resource.text}</p>
                    ) : null}
                  </article>
                );
              })}
              {!selectedAssignment.description && !selectedAssignment.resources?.length ? (
                <p className="text-sm text-muted-foreground">No additional resources were provided.</p>
              ) : null}
              <Link href={`/learn/courses/${selectedAssignment.deliveryId}/roadmap?filter=assessments&lesson=${encodeURIComponent(selectedAssignment.lessonId)}&content=${encodeURIComponent(selectedAssignment.id)}`}
                className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">
                Open assignment resources in Learning Path
              </Link>
            </section>

            {!loadError && !selectedAssignment.submissionReadUnavailable && selectedAssignment.submissionId ?
              <AssignmentFileOpenControl key={selectedAssignment.submissionId}
                submissionId={selectedAssignment.submissionId} enabled={fileUploadsEnabled} /> : null}
            {(loadError || selectedAssignment.submissionReadUnavailable) ? (
              <Alert tone="error" role="alert" title="Submission status unavailable">
                We couldn't check your submission. Retry before submitting any work.
                <Button type="button" variant="secondary" className="mt-2 w-fit"
                  onClick={() => router.refresh()}>Retry</Button>
              </Alert>
            ) : selectedAssignment.submissionId ? (
              <section className="min-w-0 space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-sm font-semibold text-foreground">
                      Your submission
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">This is what you submitted for this assignment.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Submitted {formatDate(selectedAssignment.submittedAt)}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      selectedAssignment.gradePublished
                        ? "success"
                        : "info"
                    }
                  >
                    {selectedAssignment.gradePublished
                      ? learnerAssignmentPublishedGradeLabel(selectedAssignment.pointsAwarded,selectedAssignment.maxPoints)
                      : "Submitted · awaiting grade"}
                  </StatusBadge>
                </div>

                {selectedAssignment.submissionText ? (
                  <div className="min-w-0 border-t border-border pt-3">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Written Response
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                      {selectedAssignment.submissionText}
                    </p>
                  </div>
                ) : null}

                {selectedAssignment.submissionUrl ? (
                  <div className="min-w-0 border-t border-border pt-3">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Submitted Link
                    </p>
                    {learnerAssessmentSubmittedLinkHref(selectedAssignment.submissionUrl) ? (
                      <div className="mt-2"><ThirdPartyLink
                        href={learnerAssessmentSubmittedLinkHref(selectedAssignment.submissionUrl)!}
                        label={selectedAssignment.submissionUrl}/></div>
                    ) : (
                      <p className="mt-2 break-all text-sm text-body">
                        {selectedAssignment.submissionUrl}
                      </p>
                    )}
                  </div>
                ) : null}

                {selectedAssignment.submissionType === "FILE" ? (
                  <div className="min-w-0 border-t border-border pt-3">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      File submission received
                    </p>
                    <p className="mt-2 text-sm text-body">
                      Your uploaded file is recorded for this assignment. Open the course assignment for its attachment details.
                    </p>
                  </div>
                ) : null}

                <AssignmentSubmissionLinks submissionId={selectedAssignment.submissionId}/>
                <p className="text-xs text-muted-foreground">Multi-part submissions can include text, website links, repository links and one or more private files. Each part is loaded from your authorized submission; a missing part is not assumed.</p>
                {selectedAssignment.gradePublished &&
                selectedAssignment.feedback ? (
                  <div className="min-w-0 border-t border-border pt-3">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Faculty feedback
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                      {selectedAssignment.feedback}
                    </p>
                  </div>
                ) : null}
              </section>
            ) : (
              <>
                {(!selectedAssignment.dueAt ||
                new Date(selectedAssignment.dueAt).getTime() <=
                  currentNowMs) ? (
                  <Alert tone="warning" role="status">
                    <strong className="text-foreground">
                      {selectedAssignment.dueAt ? "Submissions are closed" : "Submission unavailable"}
                    </strong>{" "}
                    {selectedAssignment.dueAt ? "Submission deadline has passed" : "Assignment deadline is not configured"}
                  </Alert>
                ) : null}

                {selectedAssignment.dueAt && new Date(selectedAssignment.dueAt).getTime() > currentNowMs ? (
                  <AssignmentSubmissionControl
                    key={selectedAssignment.deliveryId+":"+selectedAssignment.id}
                    fileUploadsEnabled={fileUploadsEnabled}
                    assignmentId={selectedAssignment.id}
                    deliveryId={selectedAssignment.deliveryId}
                  />
                ) : <Button type="button" disabled aria-disabled="true"
                  variant="secondary" className="mt-3 min-h-11">
                  {selectedAssignment.dueAt?"Submission closed":"Unavailable"}
                </Button>}
              </>
            )}
          </div>
        ) : null}
      </Drawer>

      {filtered.length > PAGE_SIZE ? (
        <nav
          aria-label={kind === "ASSIGNMENT" ? "Assignment pages" : "Quiz pages"}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            variant="secondary" className="min-h-11"
          >
            Previous
          </Button>
          <span className="text-sm font-semibold text-body">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            variant="secondary" className="min-h-11"
          >
            Next
          </Button>
        </nav>
      ) : null}
    </div>
  );
}
