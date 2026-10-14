import Link from "next/link";
import { facultyCourseListHref, type FacultyCourseListQuery } from "@/modules/courses/faculty-course-list-model";
import { COURSE_TEACHING_ROLES } from "@/modules/courses/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type {
  getFacultyCourseWorkspace,
  listFacultyCourseDeliveries,
} from "@/modules/courses/faculty-course-service";

type Course = Awaited<
  ReturnType<
    typeof listFacultyCourseDeliveries
  >
>[number];

type Workspace = Awaited<
  ReturnType<
    typeof getFacultyCourseWorkspace
  >
>;

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

export function FacultyCourseList({rows,query,pagination,scopeCount,periods}: {
  rows: readonly FacultyCourseListRow[];
  query: FacultyCourseListQuery;
  pagination: {page:number;totalPages:number;total:number};
  scopeCount: number;
  periods: readonly {id:string;name:string}[];
}) {
  if (scopeCount === 0) {
    return (
      <EmptyState
        title="No active teaching Courses"
        description="A Course appears here after an active teaching assignment is attached to one of its Section deliveries."
      />
    );
  }

  return (
    <div className="space-y-5">
      <form action="/teacher/courses" method="get" key={facultyCourseListHref(query)}
        className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-sm font-semibold text-body">Search courses
            <input name="q" type="search" defaultValue={query.q} maxLength={120}
              placeholder="Course, code, Section or academic period"
              className="min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Academic period
            <select name="period" defaultValue={query.period}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-sm text-foreground">
              <option value="">All assigned periods</option>
              {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
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
          title="No courses match your filters"
          description="Try a different Course name, academic period or teaching role."
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
              {course.sectionName}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {course.academicPeriodName}
            </span>
            <span className="rounded-full bg-muted px-2.5 py-1">
              {course.teachingRole.replaceAll(
                "_",
                " ",
              )}
            </span>
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
