import Link from "next/link";
import { facultyCourseListHref, type FacultyCourseListQuery } from "@/modules/courses/faculty-course-list-model";
import { COURSE_TEACHING_ROLES } from "@/modules/courses/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { listFacultyCourseDeliveries } from "@/modules/courses/faculty-course-service";
import type { FacultyCourseCardSummary } from "@/modules/courses/faculty-course-card-summary-service";

type Course = Awaited<
  ReturnType<
    typeof listFacultyCourseDeliveries
  >
>[number];

type Workspace = FacultyCourseCardSummary;

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

export function FacultyCourseList({rows,query,pagination,scopeCount,periods,sections,assignmentChoices}: {
  rows: readonly FacultyCourseListRow[];
  query: FacultyCourseListQuery;
  pagination: {page:number;totalPages:number;total:number};
  scopeCount: number;
  periods: readonly {id:string;name:string}[];
  sections:readonly {id:string;name:string;count:number}[];
  assignmentChoices:readonly {deliveryId:string;courseName:string;sectionName:string;academicPeriodName:string}[];
}) {
  if (scopeCount === 0) {
    return (
      <EmptyState
        title="No teaching assignments found. Please contact your administrator."
        description="Your teaching courses will appear after your administrator assigns a class."
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-body" role="status">
        <details className="relative rounded-lg border border-border bg-surface px-3 py-2">
          <summary className="cursor-pointer font-semibold">{scopeCount} Teaching assignment(s)</summary>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs">
            {assignmentChoices.map(item=><li key={item.deliveryId}>
              <Link className="text-primary-text underline" href={"/teacher/courses/"+encodeURIComponent(item.deliveryId)+"/home"}>
                {item.courseName} · {item.sectionName} · {item.academicPeriodName}
              </Link>
            </li>)}
          </ul>
        </details>
        <details className="rounded-lg border border-border bg-surface px-3 py-2">
          <summary className="cursor-pointer font-semibold">{sections.length} Section(s)</summary>
          <ul className="mt-2 max-h-48 space-y-1 overflow-auto text-xs">
            {sections.map(section=><li key={section.id}>{section.name} · {section.count} teaching assignment(s)</li>)}
          </ul>
        </details>
      </div>
      <form action="/teacher/courses" method="get" key={facultyCourseListHref(query)}
        className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-body">Search courses
            <input name="q" type="search" defaultValue={query.q} maxLength={120}
              placeholder="Search courses…"
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Academic period
            <select name="period" defaultValue={query.period}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="">All assigned periods</option>
              {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Section
            <select name="section" defaultValue={query.section}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="">All sections ({sections.length})</option>
              {sections.map(section=><option key={section.id} value={section.id}>
                {section.name} ({section.count})
              </option>)}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Teaching role
            <select name="role" defaultValue={query.role}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="">All assigned roles</option>
              {COURSE_TEACHING_ROLES.map(role => <option key={role} value={role}>{role.replaceAll("_"," ")}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Apply filters</button>
          <Link href="/teacher/courses" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text">Clear filters</Link>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {rows.length} of {pagination.total} matching course Sections · Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
      </form>
      {rows.length === 0 ? (
        <EmptyState
          title={query.q?"No courses match “"+query.q+"”":"No teaching assignments in this section."}
          description="Try changing the filters to see your courses."
        />
      ) : (
      <div data-testid="teacher.courses.grid" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rows.map(({ course, workspace }) => (
        <Link
          key={course.deliveryId}
          href={`/teacher/courses/${course.deliveryId}/home`}
          data-testid="teacher.courses.card.open"
          className="group flex min-h-64 flex-col rounded-xl border border-border bg-surface p-5 transition hover:border-primary hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
        >
          <div className="flex items-start justify-between gap-3">
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-lg border border-border bg-primary-subtle text-xl font-bold text-primary-text">
              {course.courseName.trim().slice(0,2).toUpperCase()||"CS"}
            </span>
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
              {course.sectionName} ({course.cohortName})
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {course.academicPeriodName}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1" title="Academic year / period">
              {course.academicPeriodCode}
            </span>
            {course.teachingRole!=="PRIMARY"?<span className="rounded-full bg-muted px-2.5 py-1">
              Your role: {course.teachingRole.replaceAll("_"," ").toLowerCase()}
            </span>:null}
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
      <nav aria-label="Faculty Courses pages" className="flex flex-wrap items-center justify-between gap-3">
        {pagination.page > 1 ? <Link href={facultyCourseListHref({...query,page:pagination.page-1})}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Previous</Link> : <span />}
        {pagination.page < pagination.totalPages ? <Link href={facultyCourseListHref({...query,page:pagination.page+1})}
          className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Next</Link> : null}
      </nav>
    </div>
  );
}
