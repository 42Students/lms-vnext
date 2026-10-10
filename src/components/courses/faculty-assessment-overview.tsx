"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { FacultyAssignmentReview } from "./faculty-assignment-review";
import { FacultyQuizReview } from "./faculty-quiz-review";
import { FacultyAssessmentEditor } from "./faculty-assessment-editor";
import type { getFacultyAssessmentOverview } from "@/modules/courses/faculty-assessment-service";

type Overview = Awaited<ReturnType<typeof getFacultyAssessmentOverview>>;
type Assessment = Overview["assignments"][number] | Overview["quizzes"][number];
const PAGE_SIZE = 20;

export function FacultyAssessmentOverview({
  overview,
  kind,
}: {
  overview: Overview;
  kind: "ASSIGNMENT" | "QUIZ";
}) {
  const [courseId, setCourseId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const items: Assessment[] =
    kind === "ASSIGNMENT" ? overview.assignments : overview.quizzes;

  const filtered = useMemo(
    () =>
      items.filter(
        (item) =>
          (!courseId || item.deliveryId === courseId) &&
          (!status || item.status === status),
      ),
    [items, courseId, status],
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
      <EmptyState
        title={kind === "QUIZ" ? "No quizzes in your teaching sections" : "No assignments in your teaching sections"}
        description="Your learning-path assessments appear here after your Section teaching assignment is active. Open a Course to create or publish assessments."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: kind === "QUIZ" ? "Quizzes" : "Assignments", value: items.length },
          { label: "Published", value: items.filter((item) => item.status === "PUBLISHED").length },
          { label: "Sections", value: new Set(items.map((item) => item.deliveryId)).size },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{metric.label}</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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
            <option value="">All teaching sections</option>
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching assessments"
          description="Change Course / Section or Status to see other assessments."
        />
      ) : (
        <div className="space-y-4" aria-label={kind === "QUIZ" ? "All quizzes" : "All assignments"}>
          {rows.map((item) => (
            <article
              key={`${item.deliveryId}:${item.id}`}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone={item.status === "PUBLISHED" ? "success" : item.status === "DRAFT" ? "warning" : "neutral"}>
                      {item.status}
                    </StatusBadge>
                    <StatusBadge tone="info">
                      {item.authoredDeliveryId ? "This Section" : "Shared Offering"}
                    </StatusBadge>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 text-sm text-body">
                    {item.courseName} · {item.sectionName} · {item.lessonName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.academicPeriodName} · Due {formatDate(item.dueAt)}
                  </p>
                  {item.description ? (
                    <p className="mt-2 line-clamp-2 text-sm text-body">{item.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.facultyOwned ? (
                    <FacultyAssessmentEditor
                      assessment={{
                        id: item.id,
                        kind: item.kind,
                        title: item.title,
                        description: item.description,
                        dueAt: item.dueAt,
                        status: item.status,
                        ...(item.kind === "QUIZ"
                          ? { maxAttempts: item.maxAttempts }
                          : { maxPoints: item.maxPoints }),
                      }}
                    />
                  ) : null}
                  <Link
                    href={`/teacher/report/${item.kind === "QUIZ" ? "quiz" : "assignment"}/${item.id}?deliveryId=${encodeURIComponent(item.deliveryId)}`}
                    className="rounded-md border border-primary px-3 py-2 text-sm font-semibold text-primary-text hover:bg-primary-subtle"
                  >
                    View Report
                  </Link>
                  <Link
                    href={`/teach/courses/${item.deliveryId}`}
                    className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary-text hover:border-primary"
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
                    quizId={item.id}
                    deliveryId={item.deliveryId}
                    status={item.status}
                    resultsPublished={item.resultsPublished}
                    deliveryOwned={item.facultyOwned}
                  />
                </>
              ) : (
                <>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {item.maxPoints} points · Grade visible to learner only after publication
                  </p>
                  <FacultyAssignmentReview
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
            className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-body disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-body disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      ) : null}
    </div>
  );
}
