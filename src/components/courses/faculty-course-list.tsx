import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Image from "next/image";
import {FacultyCourseFilterAutoSubmit} from "./faculty-course-filter-auto-submit";
import { facultyCourseListHref, type FacultyCourseListQuery } from "@/modules/courses/faculty-course-list-model";
import { COURSE_TEACHING_ROLES } from "@/modules/courses/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ScrollCue } from "@/components/ui/scroll-cue";
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
    <div className="min-w-0 max-w-full space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm text-body" role="status">
        <details className="relative rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">{scopeCount} Teaching assignment(s)</summary>
          <ScrollCue axis="y" label="Teaching assignments" className="mt-2" viewportClassName="max-h-48"><ul className="space-y-1 text-xs">
            {assignmentChoices.map(item=><li key={item.deliveryId}>
              <Link className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]" href={"/teacher/courses/"+encodeURIComponent(item.deliveryId)+"/home"}>
                {item.courseName} · {item.sectionName} · {item.academicPeriodName}
              </Link>
            </li>)}
          </ul></ScrollCue>
        </details>
        <details className="rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2">
          <summary className="flex min-h-11 cursor-pointer items-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">{sections.length} Section(s)</summary>
          <ScrollCue axis="y" label="Teaching Sections" className="mt-2" viewportClassName="max-h-48"><ul className="space-y-1 text-xs">
            {sections.map(section=><li key={section.id}>{section.name} · {section.count} teaching assignment(s)</li>)}
          </ul></ScrollCue>
        </details>
      </div>
      <form action="/teacher/courses" method="get" key={facultyCourseListHref(query)}
        className="space-y-3">
        <FacultyCourseFilterAutoSubmit />
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-body">Search courses
            <Input name="q" type="search" defaultValue={query.q} maxLength={120}
              placeholder="Course, code, Section or academic period"
              className="text-base sm:text-sm" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Academic period
            <Select name="period" defaultValue={query.period}
              className="text-base sm:text-sm">
              <option value="">All assigned periods</option>
              {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Section
            <Select name="section" defaultValue={query.section}
              className="text-base sm:text-sm">
              <option value="">All sections ({sections.length})</option>
              {sections.map(section=><option key={section.id} value={section.id}>
                {section.name} ({section.count})
              </option>)}
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Teaching role
            <Select name="role" defaultValue={query.role}
              className="text-base sm:text-sm">
              <option value="">All assigned roles</option>
              {COURSE_TEACHING_ROLES.map(role => <option key={role} value={role}>{role.replaceAll("_"," ")}</option>)}
            </Select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary">Apply filters</Button>
          <Link href="/teacher/courses" className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
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
          className="group flex min-h-64 flex-col rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-5 transition hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="flex items-start justify-between gap-3">
            <span aria-hidden="true" className="grid size-16 shrink-0 place-items-center rounded-lg border border-border bg-primary-subtle">
              <Image src="/assets/images/common/course.svg" alt="" width={64} height={64}
                className="size-full rounded-lg object-contain" />
            </span>
            <div className="min-w-0">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--lms-teal-deep)]">
                {course.courseCode}
              </p>
              <h2 className="mt-2 line-clamp-2 text-lg font-semibold text-[var(--lms-heading)]">
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

          <p className="mt-3 line-clamp-2 min-h-11 text-sm leading-5 text-body">
            {course.courseDescription ??
              "Teaching workspace for this exact Section delivery."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge  tone="neutral">
              {course.sectionName} ({course.cohortName})
            </Badge>
            <Badge  tone="neutral">
              {course.academicPeriodName}
            </Badge>
            <Badge  title="Academic year / period" tone="neutral">
              {course.academicPeriodCode}
            </Badge>
            {course.teachingRole!=="PRIMARY"?<Badge  tone="neutral">
              Your role: {course.teachingRole.replaceAll("_"," ").toLowerCase()}
            </Badge>:null}
          </div>

          <div className="mt-auto pt-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-50)] p-2.5">
                <p className="m-0 text-lg font-semibold text-foreground">
                  {workspace.summary.contents}
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  Content
                </p>
              </div>
              <div className="rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-50)] p-2.5">
                <p className="m-0 text-lg font-semibold text-foreground">
                  {workspace.summary.assignments}
                </p>
                <p className="m-0 text-xs text-muted-foreground">
                  Assignments
                </p>
              </div>
              <div className="rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-50)] p-2.5">
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
                className="text-lg text-[var(--lms-teal-deep)] motion-safe:transition-transform motion-safe:duration-[var(--lms-motion-fast)] group-hover:translate-x-0.5 motion-reduce:transform-none"
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
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">Previous</Link> : <span />}
        {pagination.page < pagination.totalPages ? <Link href={facultyCourseListHref({...query,page:pagination.page+1})}
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">Next</Link> : null}
      </nav>
    </div>
  );
}
