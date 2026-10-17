"use client";

import Link from "next/link";
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
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { AssignmentFileOpenControl } from "./assignment-file-open-control";
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

function formatDate(value:string|null) {
  return learnerAssessmentDateLabel(value);
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

const PAGE_SIZE = 20;

export function LearnerAssessmentOverview({
  courses,
  items,
  kind,
  snapshotNowMs,
  fileUploadsEnabled = false,
}: {
  courses: readonly CourseChoice[];
  items: readonly Item[];
  kind: "ASSIGNMENT" | "QUIZ";
  snapshotNowMs: number;
  fileUploadsEnabled?: boolean;
}) {
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

  const [courseId, setCourseId] =
    useState("");
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
      learnerAssessmentSort(items.filter(item =>
        (!activeCourseId || item.courseId === activeCourseId) &&
        learnerAssessmentMatchesSearch(item, search) &&
        learnerAssessmentMatchesState(item, stateFilter, currentNowMs),
      ),sort),
    [activeCourseId, items, search, stateFilter, currentNowMs,sort],
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

  const countsByCourse=useMemo(()=>learnerAssessmentCourseCounts(items),[items]);
  const scopedAttentionItems=learnerAssessmentScopedItems(items,activeCourseId);
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
      ? items.find(
          (item):item is LearnerAssignmentOverviewItem =>
            item.kind==="ASSIGNMENT" &&
            `${item.deliveryId}:${item.id}`===selectedAssignmentKey,
        )
      : undefined,
    [items,filtered,selectedAssignmentKey],
  );

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
            ? "Your assignments will appear here once your teachers add them."
            : "Quizzes assigned to you by your teachers will appear here."
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {kind==="QUIZ" ? (
        <section aria-label="Quiz summary" className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold text-body">
          <span className="rounded-full border border-border px-3 py-1">{scopedAttentionItems.length} {scopedAttentionItems.length===1?"Quiz":"Quizzes"}</span>
          <details className="min-w-0 rounded-lg border border-border px-3 py-1">
            <summary className="cursor-pointer text-primary-text">{submittedQuizzes.length} Submitted</summary>
            {submittedQuizzes.length>0 ? (
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs font-normal">
                {submittedQuizzes.map(item=><li key={item.deliveryId+":"+item.id}>{item.title}</li>)}
              </ul>
            ) : <p className="mt-2 text-xs font-normal">No quizzes submitted yet.</p>}
          </details>
        </section>
      ) : (<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Metric
          label={
            kind === "ASSIGNMENT"
              ? "Assignments"
              : "Quizzes"
          }
          value={scopedAttentionItems.length}
        />
        <Metric
          label="Courses"
          value={learnerAssessmentCourseScopeCount(courses,activeCourseId)}
        />
        <Metric label="Needs action" value={actionCounts.pending} />
        <Metric label="Overdue / missed" value={actionCounts.overdue} />
        <Metric
          label={
            kind === "ASSIGNMENT"
              ? "Submitted"
              : "Attempted"
          }
          value={completed}
        />
      </div>
      )}

      <nav aria-label={kind === "ASSIGNMENT" ? "Assignment quick views" : "Quiz quick views"}
        className="flex flex-wrap gap-2">
        {quickCounts.map(quick => (
          <button key={quick.value} type="button" aria-pressed={stateFilter === quick.value}
            onClick={() => { setStateFilter(value => value === quick.value ? "ALL" : quick.value); setPage(1); }}
            className={stateFilter === quick.value
              ? "min-h-11 rounded-lg border border-primary bg-primary-subtle px-4 text-sm font-semibold text-primary-text"
              : "min-h-11 rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-body"}>
            {LEARNER_ASSESSMENT_STATE_OPTIONS.find(option => option.value === quick.value)?.label} ({quick.count})
          </button>
        ))}
      </nav>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="w-full">
          <span className="mb-1.5 block text-xs font-semibold text-body">Search {kind === "ASSIGNMENT" ? "assignments" : "quizzes"}</span>
          <input type="search" value={search} maxLength={100}
            onChange={event => {setSearch(event.target.value);setPage(1);}}
            placeholder="Title, lesson or course"
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground" />
        </label>
        <label className="w-full">
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Course
          </span>
          <Select
            value={activeCourseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setPage(1);
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
                {course.name} · {course.code} ({countsByCourse.get(course.id)??0})
              </option>
            ))}
          </Select>
        </label>
        <label className="w-full">
          <span className="mb-1.5 block text-xs font-semibold text-body">State</span>
          <Select value={stateFilter}
            onChange={event => {
              setStateFilter(event.target.value as LearnerAssessmentStateFilter);
              setPage(1);
            }}>
            {LEARNER_ASSESSMENT_STATE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>
        <label className="w-full">
          <span className="mb-1.5 block text-xs font-semibold text-body">Sort</span>
          <Select value={sort} onChange={event => {
            setSort(event.target.value as LearnerAssessmentSort);setPage(1);
          }}>
            {LEARNER_ASSESSMENT_SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </Select>
        </label>
      </div>

      {learnerAssessmentFiltersActive({courseId:activeCourseId,search,stateFilter,sort}) ? (
        <button type="button" onClick={() => {
          setCourseId("");setSearch("");setStateFilter("ALL");setSort("DUE");setPage(1);
        }} className="inline-flex min-h-11 items-center rounded-lg border border-border bg-surface px-4 text-sm font-semibold text-primary-text">
          Clear assessment filters
        </button>
      ) : null}
      <p role="status" className="text-sm text-muted-foreground">
        {learnerAssessmentPageSummary({
          filteredCount:filtered.length,totalCount:items.length,
          currentPage,pageSize:PAGE_SIZE,label:kind==="ASSIGNMENT"?"assignments":"quizzes",
        })}
      </p>
      {filtered.length === 0 ? (
        <EmptyState
          {...learnerAssessmentEmptyMessage({kind,courseSelected:Boolean(activeCourseId),search,stateFilter})}
        />
      ) : (
        <>
        {kind==="QUIZ" ? (
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface lg:block">
            <table className="w-full min-w-[790px] text-left text-sm">
              <thead className="bg-surface-subtle text-foreground"><tr>
                {["Overview","Course","Lesson","Due Date","Status","Grade","Actions"].map(heading=>
                  <th key={heading} scope="col" className="border-b border-border px-4 py-3 font-semibold">{heading}</th>)}
              </tr></thead>
              <tbody>{paged.filter((item): item is LearnerQuizOverviewItem => item.kind==="QUIZ").map(item=>{
                const state=quizOverviewActionState(item,currentNowMs);
                const target=`/quiz?quizId=${encodeURIComponent(item.id)}&deliveryId=${encodeURIComponent(item.deliveryId)}${state.review?"&review=true":""}`;
                return <tr key={item.deliveryId+":"+item.id} className="border-b border-border">
                  <th scope="row" className="px-4 py-3 font-semibold">{item.title}</th>
                  <td className="px-4 py-3">{item.courseName}</td>
                  <td className="px-4 py-3">{item.lessonName}</td>
                  <td className="px-4 py-3">{item.dueAt?formatDate(item.dueAt):"–"}</td>
                  <td className="px-4 py-3">{state.label}</td>
                  <td className="px-4 py-3">{item.attemptsUsed===0?"–":item.resultsPublished?"View result":"Not released"}</td>
                  <td className="px-4 py-3">
                    <Link href={target} className="inline-flex min-h-10 items-center font-semibold text-primary-text underline">{state.action}</Link>
                  </td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        ) : null}
        <div
          className={kind==="QUIZ"?"space-y-3 lg:hidden":"space-y-3"}
          aria-label={
            kind === "ASSIGNMENT"
              ? "Assignment list"
              : "Quiz list"
          }
        >
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
                className="min-w-0 rounded-xl border border-border bg-surface p-4 sm:p-5"
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
                      <p className="mt-2 rounded-md bg-surface-subtle px-3 py-2 text-xs font-semibold text-body sm:hidden"
                        role="status">
                        {learnerAssignmentMobileState(item,currentNowMs).label}
                        {" · "}{learnerAssignmentMobileState(item,currentNowMs).detail}
                      </p>
                    ) : null}
                    {item.kind === "QUIZ" ? (
                      <p role="status"
                        className="mt-2 rounded-md bg-surface-subtle px-3 py-2 text-xs font-semibold text-body sm:hidden">
                        {learnerQuizMobileState(item,currentNowMs).label}
                        {" · "}{learnerQuizMobileState(item,currentNowMs).detail}
                      </p>
                    ) : null}
                    {item.description ? (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-body">
                        {item.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                    <span className="text-xs font-semibold text-muted-foreground">
                      {item.kind ===
                      "ASSIGNMENT"
                        ? `${item.maxPoints} points`
                        : `${item.totalPoints} points · ${item.attemptsUsed}/${item.maxAttempts} attempts`}
                    </span>
                    {item.kind === "ASSIGNMENT" ? (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAssignmentKey(
                            `${item.deliveryId}:${item.id}`,
                          )
                        }
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover sm:w-auto"
                      >
                        {state.action}
                      </button>
                    ) : (
                      <Link
                        href={href}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover sm:w-auto"
                      >
                        {state.action}
                      </Link>
                    )}
                    {item.kind === "QUIZ" ? (
                      <Link
                        href={"/learn/allQuizzes/" + encodeURIComponent(item.id) + "?deliveryId=" + encodeURIComponent(item.deliveryId)}
                        className="inline-flex min-h-11 w-full items-center justify-center text-xs font-semibold text-primary-text underline sm:min-h-9 sm:w-auto"
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
            <>
            <Link
              href={`/learn/courses/${selectedAssignment.deliveryId}/roadmap?filter=assessments&lesson=${encodeURIComponent(selectedAssignment.lessonId)}&content=${encodeURIComponent(selectedAssignment.id)}`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary-text sm:w-auto"
            >
              Open in Learning Path
            </Link>
            <Link href={"/learn/allAssignments/" + encodeURIComponent(selectedAssignment.id) + "?deliveryId=" + encodeURIComponent(selectedAssignment.deliveryId)}
              className="mt-2 inline-flex min-h-11 w-full items-center justify-center rounded-md border border-primary px-3 text-sm font-semibold text-primary-text hover:underline sm:ml-2 sm:mt-0 sm:w-auto">
              Full assignment details
            </Link>
            </>
          ) : undefined
        }
      >
        {selectedAssignment ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface-subtle p-4">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Due
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {formatDate(selectedAssignment.dueAt)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-surface-subtle p-4">
                <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Points
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {selectedAssignment.maxPoints}
                </p>
              </div>
            </div>

            {selectedAssignment.description ? (
              <section>
                <h3 className="m-0 text-sm font-semibold text-foreground">
                  Instructions & resources
                </h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                  {selectedAssignment.description}
                </p>
              </section>
            ) : null}

            {selectedAssignment.submissionId && selectedAssignment.submissionType === "FILE" ?
              <AssignmentFileOpenControl key={selectedAssignment.submissionId}
                submissionId={selectedAssignment.submissionId} enabled={fileUploadsEnabled} /> : null}
            {selectedAssignment.submissionId ? (
              <section className="rounded-xl border border-border bg-surface-subtle p-4">
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

                {selectedAssignment.submissionType === "TEXT" &&
                selectedAssignment.submissionText ? (
                  <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Written Response
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-body">
                      {selectedAssignment.submissionText}
                    </p>
                  </div>
                ) : null}

                {selectedAssignment.submissionType === "LINK" &&
                selectedAssignment.submissionUrl ? (
                  <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Submitted Link
                    </p>
                    {learnerAssessmentSubmittedLinkHref(selectedAssignment.submissionUrl) ? (
                      <a
                        href={learnerAssessmentSubmittedLinkHref(selectedAssignment.submissionUrl)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 block break-all text-sm font-semibold text-primary-text underline"
                      >
                        {selectedAssignment.submissionUrl}
                      </a>
                    ) : (
                      <p className="mt-2 break-all text-sm text-body">
                        {selectedAssignment.submissionUrl}
                      </p>
                    )}
                  </div>
                ) : null}

                {selectedAssignment.submissionType === "FILE" ? (
                  <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                    <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      File submission received
                    </p>
                    <p className="mt-2 text-sm text-body">
                      Your uploaded file is recorded for this assignment. Open the course assignment for its attachment details.
                    </p>
                  </div>
                ) : null}

                {selectedAssignment.gradePublished &&
                selectedAssignment.feedback ? (
                  <div className="mt-4 rounded-lg border border-border bg-surface p-4">
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
                  <div
                    role="status"
                    className="rounded-lg border border-warning bg-[var(--lms-warning-subtle)] p-4 text-sm text-body"
                  >
                    <strong className="text-foreground">
                      {selectedAssignment.dueAt ? "Submissions are closed" : "Submission unavailable"}
                    </strong>{" "}
                    {selectedAssignment.dueAt ? "Submission deadline has passed" : "Assignment deadline is not configured"}
                  </div>
                ) : null}

                {selectedAssignment.dueAt && new Date(selectedAssignment.dueAt).getTime() > currentNowMs ? (
                  <AssignmentSubmissionControl
                    fileUploadsEnabled={fileUploadsEnabled}
                    assignmentId={selectedAssignment.id}
                    deliveryId={selectedAssignment.deliveryId}
                  />
                ) : <button type="button" disabled aria-disabled="true"
                  className="mt-3 min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-muted-foreground">
                  {selectedAssignment.dueAt?"Submission closed":"Unavailable"}
                </button>}
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
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-body">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
