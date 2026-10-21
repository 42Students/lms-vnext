import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import {FacultyCourseCover} from "./faculty-course-cover";
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
  thumbnailUrl?:string|null;
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
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <div className="flex min-w-0 flex-wrap items-center gap-3 text-sm text-body" role="status">
        <Disclosure title={scopeCount+" "+(scopeCount===1?"Teaching assignment":"Teaching assignments")} className="relative min-w-0">
          <ScrollCue axis="y" label="Teaching assignments" className="mt-2" viewportClassName="max-h-48"><ul className="space-y-1 text-xs">
            {assignmentChoices.map(item=><li key={item.deliveryId}>
              <Link className="inline-flex min-h-11 items-center text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" href={"/teacher/courses/"+encodeURIComponent(item.deliveryId)+"/home"}>
                {item.courseName} · {item.sectionName} · {item.academicPeriodName}
              </Link>
            </li>)}
          </ul></ScrollCue>
        </Disclosure>
        <Disclosure title={sections.length+" "+(sections.length===1?"Section":"Sections")} className="min-w-0">
          <ScrollCue axis="y" label="Teaching Sections" className="mt-2" viewportClassName="max-h-48"><ul className="space-y-1 text-xs">
            {sections.map(section=><li key={section.id}>{section.name} · {section.count} teaching assignment(s)</li>)}
          </ul></ScrollCue>
        </Disclosure>
      </div>
      <form action="/teacher/courses" method="get" key={facultyCourseListHref(query)}
        className="min-w-0 space-y-3">
        <FacultyCourseFilterAutoSubmit />
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-[6px] text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Search courses
            <Input name="q" type="search" defaultValue={query.q} maxLength={120}
              placeholder="Search Courses..."
              className="text-[var(--lms-font-base)] md:text-sm" />
          </label>
          <label className="grid gap-[6px] text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Academic period
            <Select name="period" defaultValue={query.period}
              className="text-[var(--lms-font-base)] md:text-sm">
              <option value="">All assigned periods</option>
              {periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Section
            <Select aria-label="Filter by section" name="section" defaultValue={query.section}
              className="text-[var(--lms-font-base)] md:text-sm">
              <option value="">All sections ({sections.length})</option>
              {sections.map(section=><option key={section.id} value={section.id}>
                {section.name} ({section.count})
              </option>)}
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] leading-4 font-semibold text-[var(--lms-neutral-400)]">Teaching role
            <Select name="role" defaultValue={query.role}
              className="text-[var(--lms-font-base)] md:text-sm">
              <option value="">All assigned roles</option>
              {COURSE_TEACHING_ROLES.map(role => <option key={role} value={role}>{role.replaceAll("_"," ")}</option>)}
            </Select>
          </label>
        </div>
        <div className="flex min-w-0 flex-col gap-2 min-[768px]:flex-row min-[768px]:flex-wrap min-[768px]:items-center">
          <Button type="submit" variant="primary" className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto">Apply filters</Button>
          <Link href="/teacher/courses" className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] min-[768px]:w-auto bg-[var(--lms-surface)] px-[var(--lms-space-4)] text-[14px] font-semibold text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Clear filters</Link>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Showing {rows.length} of {pagination.total} matching course Sections · Page {pagination.page} of {pagination.totalPages}
          </p>
        </div>
      </form>
      {rows.length === 0 ? (
        <EmptyState
          title={query.q?"No courses match “"+query.q+"”":"No teaching assignments in this section."}
          description="Try changing the filters to see your courses."
          action={<Link href="/teacher/courses" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 min-[768px]:min-h-9">Clear filters</Link>}
        />
      ) : (
      <div data-testid="teacher.courses.grid" className="grid min-w-0 gap-x-6 gap-y-0 border-y border-[var(--lms-canvas-border)] lg:grid-cols-2">
      {rows.map(({ course, workspace,thumbnailUrl }) => (
        <Link
          key={course.deliveryId}
          href={`/teacher/courses/${course.deliveryId}/home`}
          data-testid="teacher.courses.card.open"
          className="group flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface shadow-none transition-colors hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          <FacultyCourseCover url={thumbnailUrl??null} title={course.courseName}/>
          <div className="flex min-w-0 flex-wrap items-start gap-3 px-4 pt-4">
            <div className="min-w-0 flex-1">
              <p className="m-0 text-xs font-bold uppercase tracking-[0.08em] text-[var(--lms-teal-deep)]">
                {course.courseCode}
              </p>
              <h2 className="mt-1 break-words text-lg font-semibold text-[var(--lms-heading)]">
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

          <p className="mt-2 line-clamp-2 px-4 text-sm leading-6 text-body">
            {course.courseDescription ??
              "Teaching workspace for this exact Section delivery."}
          </p>

          <div className="mt-3 flex min-w-0 flex-wrap gap-2 px-4 text-xs text-muted-foreground">
            <Badge  tone="neutral">
              {course.sectionName} ({course.cohortName})
            </Badge>
            <Badge  tone="neutral">
              {course.academicPeriodName}
            </Badge>
            <Badge title="Academic year / period" tone="neutral">
              {course.academicPeriodCode||course.academicPeriodName}
            </Badge>
            <Badge tone={course.teachingRole==="PRIMARY"?"info":"warning"}>
              {course.teachingRole==="PRIMARY"?"Primary Instructor":
                course.teachingRole.replaceAll("_"," ")}
            </Badge>
          </div>

          <div className="mt-auto px-4 pb-4 pt-4">
            <dl aria-label="Course content summary" className="grid grid-cols-3 gap-3 border-t border-[var(--lms-canvas-border)] pt-3 text-xs"><div className="min-w-0"><dt className="text-muted-foreground">Content</dt><dd className="mt-1 text-base font-semibold tabular-nums">{workspace.summary.contents}</dd></div><div className="min-w-0"><dt className="text-muted-foreground">Assignments</dt><dd className="mt-1 text-base font-semibold tabular-nums">{workspace.summary.assignments}</dd></div><div className="min-w-0"><dt className="text-muted-foreground">Quizzes</dt><dd className="mt-1 text-base font-semibold tabular-nums">{workspace.summary.quizzes}</dd></div></dl>
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
      {pagination.totalPages > 1 ? <Pagination label="Faculty Courses pages" page={pagination.page} pageCount={pagination.totalPages}
        hrefForPage={page=>facultyCourseListHref({...query,page})} /> : null}
    </div>
  );
}
