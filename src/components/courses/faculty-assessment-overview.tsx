"use client";
import { Badge } from "@/components/ui/badge";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { filterFacultyAssessments } from "@/modules/courses/faculty-assessment-filter";
import { StatusBadge } from "@/components/ui/status-badge";
import { FacultyAssignmentReview } from "./faculty-assignment-review";
import { FacultyQuizReview } from "./faculty-quiz-review";
import { FacultyAssessmentEditor } from "./faculty-assessment-editor";
import { FacultyQuizQuestionEditor } from "./faculty-quiz-question-editor";
import { FacultyAssessmentCreate } from "./faculty-assessment-create";
import type { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";
import { facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";
import { FacultyAssessmentLifecycle } from "./faculty-assessment-lifecycle";

type Overview = Awaited<ReturnType<typeof getFacultyAssessmentOverview>>;
type Assessment = Overview["assignments"][number] | Overview["quizzes"][number];
const PAGE_SIZE = 20;

export function FacultyAssessmentOverview({
  overview,
  kind,
  filesEnabled,
  initialQuizId=null,
}: {
  filesEnabled: boolean;
  initialQuizId?:string|null;
  overview: Overview;
  kind: "ASSIGNMENT" | "QUIZ";
}) {
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(()=>{
    if(kind!=="QUIZ"||!initialQuizId)return 1;
    const index=overview.quizzes.findIndex(item=>item.id===initialQuizId);
    return index<0?1:Math.floor(index/PAGE_SIZE)+1;
  });
  const items: Assessment[] =
    kind === "ASSIGNMENT" ? overview.assignments : overview.quizzes;

  const filtered = useMemo(
    () => filterFacultyAssessments(items, { deliveryId: courseId, status, search }),
    [items, courseId, status, search],
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const formatDate = (date: Date | string | null) => {
    if (!date) return "No due date";
    const value = new Date(date);
    return Number.isNaN(value.getTime())
      ? "Date unavailable"
      : new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium", timeStyle: "short",
        }).format(value);
  };

  if (items.length === 0) {
    return (
      <div className="space-y-5">
        <FacultyAssessmentCreate kind={kind} lessons={overview.lessonChoices} />
        <EmptyState
          title={kind === "QUIZ" ? "No quizzes yet" : "No assignments yet"}
          description={kind==="QUIZ"?"Create your first quiz to get started.":"Create your first assignment to get started."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <FacultyAssessmentCreate kind={kind} lessons={overview.lessonChoices} />
      <div aria-label={kind === "QUIZ" ? "Quiz totals" : "Assignment totals"} className="flex flex-wrap items-center gap-2">
        <Badge  tone="neutral">
          {items.length} {kind === "QUIZ" ? (items.length === 1 ? "Quiz" : "Quizzes") : (items.length === 1 ? "Assignment" : "Assignments")}
        </Badge>
        <Badge  tone="neutral">
          {new Set(items.map(item => item.courseCode)).size} {new Set(items.map(item => item.courseCode)).size === 1 ? "Course" : "Courses"}
        </Badge>
      </div>

      <details className="rounded-[var(--lms-control-radius)] border border-border bg-surface p-3">
        <summary className="cursor-pointer text-sm font-semibold">
          {kind==="QUIZ"?"Quizzes by Course":"Assignments by Course"}
        </summary>
        <ul className="mt-3 grid gap-2 text-sm text-body sm:grid-cols-2">
          {Array.from(new Set(items.map(item=>item.courseCode))).sort().map(code=>
            <li key={code} className="flex justify-between gap-3 rounded-[var(--lms-control-radius)] border border-border px-3 py-2">
              <span>{items.find(item=>item.courseCode===code)?.courseName??code}</span>
              <strong>{items.filter(item=>item.courseCode===code).length}</strong>
            </li>)}
        </ul>
      </details>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm font-semibold text-body">
          Course / Section
          <Select
            value={courseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setPage(1);
            }}
            className="mt-1.5"
          >
            <option value="">All courses</option>
            {overview.courses.map((course) => (
              <option key={course.deliveryId} value={course.deliveryId}>
                {course.courseCode} · {course.courseName} · {course.sectionName}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">
          Status
          <Select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="mt-1.5"
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            {kind === "QUIZ" ? <option value="CLOSED">Closed</option> : null}
            <option value="ARCHIVED">Archived</option>
          </Select>
        </label>
        <label className="text-sm font-semibold text-body">
          Search assessments
          <Input
            className="mt-1.5"
            aria-label="Search assessments"
            placeholder="Title, lesson, Course or Section"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      <p aria-live="polite" className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} {kind === "QUIZ" ? "quizzes" : "assignments"}
      </p>

      {filtered.length === 0 ? (
        <EmptyState
          title={kind==="QUIZ"?"No matching quizzes":"No matching assignments"}
          description="Change Course / Section or Status to see other assessments."
        />
      ) : (
        <div className="space-y-4" aria-label={kind === "QUIZ" ? "All quizzes" : "All assignments"}>
          {rows.map((item) => (
            <article
              key={`${item.deliveryId}:${item.id}`}
              className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-3 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.status === "PUBLISHED" ? "success" : item.status === "DRAFT" ? "warning" : "neutral"}>
                      {item.status==="DRAFT"&&item.kind==="QUIZ"&&!item.dueAt?"Needs due date":item.status==="DRAFT"?"Draft":item.status==="PUBLISHED"?"Open":item.status==="CLOSED"?"Closed":"Archived"}
                    </StatusBadge>
                    <StatusBadge tone="info">
                      {item.authoredDeliveryId ? "This Section" : "Shared Offering"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm text-body">
                    {item.courseName} · {item.sectionName} · {item.lessonName} · {item.dueAt?`Due date: ${formatDate(item.dueAt)}`:"Needs due date"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.academicPeriodName} · {item.dueAt?`Due ${formatDate(item.dueAt)}`:`Created: ${formatDate(item.createdAt)}`}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Course: {item.courseName} · Lesson: {item.lessonName}
                    {" · "}{item.dueAt?`Due date: ${formatDate(item.dueAt)}`:"Needs due date"}
                  </p>
                  {item.status==="DRAFT"?<p className="mt-1 text-xs font-semibold text-warning">
                    Draft · hidden from students
                  </p>:null}
                  {item.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-body">{item.description}</p>
                  ) : null}
                </div>
                <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
                  {item.facultyOwned ? (
                    <>
                      <FacultyAssessmentEditor
                        assessment={{
                          id: item.id,
                          kind: item.kind,
                          title: item.title,
                          description: item.description,
                          dueAt: item.dueAt,
                          status: item.status,
                          updatedAt: item.updatedAt,
                          ...(item.kind === "QUIZ"
                            ? { maxAttempts: item.maxAttempts }
                            : { maxPoints: item.maxPoints, hasSubmissions:item.hasSubmissions }),
                        }}
                      />
                      {item.kind === "QUIZ" &&
                      item.status === "DRAFT" ? (
                        <FacultyQuizQuestionEditor
                          quizId={item.id}
                          deliveryId={item.deliveryId}
                        />
                      ) : null}
                      <Link
                        href={"/teacher/courses/" + encodeURIComponent(item.deliveryId) +
                          (item.kind === "QUIZ" ? "/quizzes/manage" : "/assignments/manage")}
                        className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-[var(--lms-teal-deep)] hover:border-primary"
                      >
                        Manage {item.kind === "QUIZ" ? "quiz" : "assignment"}
                      </Link>
                      <FacultyAssessmentLifecycle
                        key={item.id + ":" + new Date(item.updatedAt).toISOString()}
                        kind={item.kind}
                        id={item.id}
                        deliveryId={item.deliveryId}
                        updatedAt={item.updatedAt}
                        status={item.status}
                        owned={item.facultyOwned}
                      />
                    </>
                  ) : null}
                  <Link
                    href={`/teacher/report/${item.kind === "QUIZ" ? "quiz" : "assignment"}/${item.id}?deliveryId=${encodeURIComponent(item.deliveryId)}`}
                    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-primary px-3 py-2 text-sm font-semibold text-[var(--lms-teal-deep)] hover:bg-primary-subtle"
                  >
                    View Report
                  </Link>
                  {item.kind==="ASSIGNMENT"?<Link
                    href={`/teacher/report/assignment/${item.id}?deliveryId=${encodeURIComponent(item.deliveryId)}#submissions`}
                    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-[var(--lms-teal-deep)]">
                    View submissions
                  </Link>:null}
                  <Link
                    href={facultyCourseTabHref(item.deliveryId, "blueprint")}
                    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm font-semibold text-[var(--lms-teal-deep)] hover:border-primary"
                  >
                    Open Course
                  </Link>
                </div>
              </div>
              {item.kind === "QUIZ" ? (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.maxAttempts} allowed attempts · {item.totalPoints} points ·
                    {" "}{item.resultsPublished ? "Results published" : "Results private"}
                  </p>
                  <FacultyQuizReview
                    quizTitle={item.title}
                    quizId={item.id}
                    autoOpen={kind==="QUIZ"&&initialQuizId===item.id}
                    deliveryId={item.deliveryId}
                    status={item.status}
                    resultsPublished={item.resultsPublished}
                    updatedAt={new Date(item.updatedAt).toISOString()}
                    deliveryOwned={item.facultyOwned}
                  />
                </>
              ) : (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.maxPoints} points · Grade visible to learner only after publication
                  </p>
                  <FacultyAssignmentReview
                    filesEnabled={filesEnabled}
                    assignmentId={item.id}
                    deliveryId={item.deliveryId}
                    maxPoints={item.maxPoints}
                    status={item.status}
                  />
                </>
              )}
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Assessment pages" className="flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-body hover:bg-primary-subtle disabled:opacity-50 sm:min-h-9"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-body hover:bg-primary-subtle disabled:opacity-50 sm:min-h-9"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
