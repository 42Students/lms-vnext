import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import {CollegeArchivedLessonRestore} from "./college-archived-lesson-restore";
import {LessonActions} from "./admin-learning-structure-actions";
import {CollegeLessonVisibilityControl,CollegeLessonBulkVisibility} from "./college-lesson-visibility-controls";
import { COLLEGE_COURSE_TAB_COPY, collegeLessonVisibilityLabel } from "@/modules/courses/college-course-tabs-copy";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { collegeLearningHref,
  collegeLearningDirectoryHasPageCap, collegeOfferingLessonsHref, collegeOfferingProgressHref, collegeProgressDescription } from "@/modules/courses/college-learning-directory-model";
import type {
  listCollegeCourseProgress,
  listCollegeLessons,
} from "@/modules/courses/college-learning-directory-service";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeLessons>>
  | Awaited<ReturnType<typeof listCollegeCourseProgress>>;

export function CollegeLearningDirectory({ data, courseChoices=[], prepend, showHeader=true }: { data: DirectoryData; courseChoices?:readonly {code:string;name:string}[]; prepend?:ReactNode; showHeader?:boolean }) {
  const lessons = data.kind === "LESSONS";
  const title = lessons ? COLLEGE_COURSE_TAB_COPY.lessonsTitle : COLLEGE_COURSE_TAB_COPY.progressTitle;
  const href = lessons ? "/college/lessons" : "/college/course-progress";
  const activeAdvanced = Object.entries(data.query).some(([key,value]) =>
    !["q","page","pageSize"].includes(key) && value != null && value !== "" && value !== "ALL"
  );
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      {showHeader ? <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={title}
        description={lessons ? undefined : COLLEGE_COURSE_TAB_COPY.progressDescription}
        actions={
          <Link href="/college/courses"
            className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Course offerings
          </Link>
        }
      /> : null}
      {prepend ? <div data-slot="page-tools" className="min-w-0">{prepend}</div> : null}
      <section aria-label={title + " filters"} className="min-w-0 pb-[var(--lms-space-4)]">
        <form method="get" action={href} className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] md:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Course or {lessons ? "lesson" : "cohort"}
            <Input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              placeholder="Search registered records"
              className="min-h-11 md:min-h-9" />
          </label>
          <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-2)] md:col-span-3" open={activeAdvanced || undefined}>
            <summary className="min-h-11 cursor-pointer py-2 font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Advanced filters</summary>
            <div className="grid min-w-0 grid-cols-1 gap-3 pt-3 md:grid-cols-2 min-[992px]:grid-cols-4">
          {lessons?<label className="grid min-w-32 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Rows per page
            <Select name="pageSize" defaultValue={data.query.pageSize}
              className="min-h-11 md:min-h-9">
              {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
            </Select>
          </label>:null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Parent program lifecycle
              <Select name="programStatus" defaultValue={data.query.programStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Parent batch lifecycle
              <Select name="cohortStatus" defaultValue={data.query.cohortStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period lifecycle
              <Select name="periodStatus" defaultValue={data.query.periodStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">CLOSED</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Parent course lifecycle
              <Select name="courseStatus" defaultValue={data.query.courseStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department code (exact)
              <Input type="search" name="departmentCode" maxLength={64} defaultValue={data.query.departmentCode ?? ""}
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Parent program lifecycle
              <Select name="programStatus" defaultValue={data.query.programStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Parent batch lifecycle
              <Select name="cohortStatus" defaultValue={data.query.cohortStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period lifecycle
              <Select name="periodStatus" defaultValue={data.query.periodStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">CLOSED</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Parent course lifecycle
              <Select name="courseStatus" defaultValue={data.query.courseStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department code (exact)
              <Input name="departmentCode" type="search" maxLength={64} defaultValue={data.query.departmentCode ?? ""}
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            {lessons ? "Lesson status" : "Offering status"}
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 md:min-h-9">
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </Select>
          </label>
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period code (exact)
              <Input name="periodCode" type="search" maxLength={64}
                defaultValue={data.query.periodCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code (exact)
              <Input name="cohortCode" type="search" maxLength={64}
                defaultValue={data.query.cohortCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program code (exact)
              <Input name="programCode" type="search" maxLength={64}
                defaultValue={data.query.programCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course
              <Select name="courseCode" defaultValue={data.query.courseCode??""}
                className="min-h-11 md:min-h-9">
                <option value="">All courses</option>
                {courseChoices.map(option=><option key={option.code} value={option.code}>
                  {option.name} ({option.code})
                </option>)}
                {data.query.courseCode&&!courseChoices.some(option=>option.code===data.query.courseCode)?
                  <option value={data.query.courseCode}>{data.query.courseCode} (not in current authoring list)</option>:null}
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Course offering type
              <Select name="offeringType" defaultValue={data.query.offeringType??"ALL"}
                className="min-h-11 md:min-h-9">
                <option value="ALL">Any offering type</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Course department name (exact)
              <Input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Published and visibility-flagged content
              <Select name="flaggedVisibility" defaultValue={data.query.flaggedVisibility} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_FLAGGED">Has flagged content</option><option value="NONE_FLAGGED">No flagged content</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Authored assignments
              <Select name="assignmentPresence" defaultValue={data.query.assignmentPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_ASSIGNMENTS">Has assignments</option><option value="NO_ASSIGNMENTS">No assignments</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Authored quizzes
              <Select name="quizPresence" defaultValue={data.query.quizPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_QUIZZES">Has quizzes</option><option value="NO_QUIZZES">No quizzes</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Published lesson content
              <Select name="publishedContent" defaultValue={data.query.publishedContent} className="min-h-11 md:min-h-9">
                <option value="ALL">Any publication</option><option value="HAS_PUBLISHED">Has published content</option><option value="NONE_PUBLISHED">No published content</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Authored lesson items
              <Select name="contentPresence" defaultValue={data.query.contentPresence??"ALL"}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_CONTENT">Contains authored content</option>
                <option value="EMPTY">No content authored</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Learning path lifecycle
              <Select name="pathStatus" defaultValue={data.query.pathStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All paths</option>
                <option value="DRAFT">Draft paths</option><option value="PUBLISHED">Published paths</option>
                <option value="ARCHIVED">Archived paths</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Offering lifecycle
              <Select name="offeringStatus" defaultValue={data.query.offeringStatus}
                className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option>
                <option value="ACTIVE">Active offerings</option>
                <option value="ARCHIVED">Archived offerings</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course offering type
              <Select name="offeringType" defaultValue={data.query.offeringType??"ALL"} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course department (exact name)
              <Input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""} className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Recorded learner activity
              <Select name="activityState" defaultValue={data.query.activityState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="RECORDED">Has activity rows</option><option value="UNRECORDED">No recorded activity</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Content completion evidence
              <Select name="completionEvidence" defaultValue={data.query.completionEvidence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="COMPLETED_CONTENT">Has completed content records</option><option value="NO_COMPLETED_CONTENT">No completed content records</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Shared learning path
              <Select name="learningPathPresence" defaultValue={data.query.learningPathPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_PATH">Has a path</option><option value="NO_PATH">No learning path</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Published learning path
              <Select name="publishedPathPresence" defaultValue={data.query.publishedPathPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">Any publication</option><option value="HAS_PUBLISHED_PATH">Published path exists</option><option value="NO_PUBLISHED_PATH">No published path</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch / cohort code (exact)
              <Input name="cohortCode" type="search" maxLength={64}
                defaultValue={data.query.cohortCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period code (exact)
              <Input name="periodCode" type="search" maxLength={64}
                defaultValue={data.query.periodCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program code (exact)
              <Input name="programCode" type="search" maxLength={64}
                defaultValue={data.query.programCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course code (exact)
              <Input name="courseCode" type="search" maxLength={64}
                defaultValue={data.query.courseCode??""}
                className="min-h-11 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved content kind
              <Select name="contentType" defaultValue={data.query.contentType} className="min-h-11 md:min-h-9">
                <option value="ALL">All kinds</option>
                <option value="RESOURCE">Resource</option>
                <option value="VIDEO">Uploaded video</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="LIVE_CLASS">Live class</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved content lifecycle
              <Select name="contentLifecycle" defaultValue={data.query.contentLifecycle} className="min-h-11 md:min-h-9">
                <option value="ALL">Any content state</option>
                <option value="DRAFT">Draft exists</option>
                <option value="PUBLISHED">Published exists</option>
                <option value="ARCHIVED">Archived exists</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Starting lesson order (1-based)
              <Input name="sequenceFrom" type="number" min={1} max={10000} step={1} defaultValue={data.query.sequenceFrom ?? ""} className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Last lesson order (1-based)
              <Input name="sequenceThrough" type="number" min={1} max={10000} step={1} defaultValue={data.query.sequenceThrough ?? ""} className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact saved lesson title
              <Input name="lessonName" type="search" maxLength={255} defaultValue={data.query.lessonName ?? ""} className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved lessons
              <Select name="lessonPresence" defaultValue={data.query.lessonPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_LESSONS">Has authored lessons</option><option value="NO_LESSONS">No authored lessons</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Authored course assignments
              <Select name="assignmentPresence" defaultValue={data.query.assignmentPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_ASSIGNMENTS">Assignments authored</option><option value="NO_ASSIGNMENTS">No assignments authored</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Authored course quizzes
              <Select name="quizPresence" defaultValue={data.query.quizPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_QUIZZES">Quizzes authored</option><option value="NO_QUIZZES">No quizzes authored</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved resources
              <Select name="resourcePresence" defaultValue={data.query.resourcePresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_RESOURCES">Has resources</option><option value="NO_RESOURCES">No resources</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Scheduled live-class content
              <Select name="liveClassPresence" defaultValue={data.query.liveClassPresence} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_LIVE">Has saved live classes</option><option value="NO_LIVE">No saved live classes</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Authored content audience
              <Select name="contentAudience" defaultValue={data.query.contentAudience} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="SHARED">Has shared content</option><option value="SECTION">Has section-bound content</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Published items hidden from students
              <Select name="hiddenPublished" defaultValue={data.query.hiddenPublished} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_HIDDEN">Has hidden published item</option><option value="NO_HIDDEN">No hidden published items</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Authored video or YouTube
              <Select name="videoEvidence" defaultValue={data.query.videoEvidence} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_VIDEO">With videos</option><option value="NO_VIDEO">Without videos</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved resource items
              <Select name="resourceEvidence" defaultValue={data.query.resourceEvidence} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_RESOURCE">Has resources</option><option value="NO_RESOURCE">No resources</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved live-class items
              <Select name="liveEvidence" defaultValue={data.query.liveEvidence} className="min-h-11 md:min-h-9">
                <option value="ALL">All lessons</option><option value="HAS_LIVE">Has live-class items</option><option value="NO_LIVE">No live-class items</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Offering video material
              <Select name="videoContentState" defaultValue={data.query.videoContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_VIDEO">Contains video content</option><option value="NO_VIDEO">No video content</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Published authored content
              <Select name="publishedContentState" defaultValue={data.query.publishedContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_PUBLISHED">Contains published content</option><option value="NO_PUBLISHED">No published content</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Hidden published content
              <Select name="hiddenContentState" defaultValue={data.query.hiddenContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_HIDDEN">Contains hidden published item</option><option value="NO_HIDDEN">No hidden published items</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Shared learning content
              <Select name="sharedContentState" defaultValue={data.query.sharedContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_SHARED">Has shared content</option><option value="NO_SHARED">No shared content</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section-bound authored content
              <Select name="sectionContentState" defaultValue={data.query.sectionContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_SECTION">Has section-bound items</option><option value="NO_SECTION">No section-bound items</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-48 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact lesson ID
              <Input name="lessonId" defaultValue={data.query.lessonId??""} placeholder="Lesson UUID"
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-48 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Offering ID
              <Input name="offeringId" defaultValue={data.query.offeringId??""} placeholder="Course offering UUID"
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-48 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact offering ID
              <Input name="offeringId" defaultValue={data.query.offeringId??""} placeholder="Course offering UUID"
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-48 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact learning path ID
              <Input name="pathId" defaultValue={data.query.pathId??""} placeholder="Path UUID"
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum authored items
              <Input type="number" name="minContentCount" min={1} max={1000} defaultValue={data.query.minContentCount??""}
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum authored items
              <Input type="number" name="maxContentCount" min={0} max={1000} defaultValue={data.query.maxContentCount??""}
                className="min-h-11 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Draft lesson content
              <Select name="draftContentState" defaultValue={data.query.draftContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_DRAFT">Contains drafts</option><option value="NO_DRAFT">No saved drafts</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Archived lesson content
              <Select name="archivedContentState" defaultValue={data.query.archivedContentState} className="min-h-11 md:min-h-9">
                <option value="ALL">All offerings</option><option value="HAS_ARCHIVED">Contains archived items</option><option value="NO_ARCHIVED">No archived items</option>
              </Select>
            </label>
          ) : null}
            </div>
          </details>
          <Button type="submit" className="min-h-11 w-full px-6 md:min-h-9 md:w-auto">Filter</Button>
          <Link href={href} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-[650] text-primary-text transition-colors hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Clear
          </Link>
        </form>
      </section>
      {data.kind==="LESSONS" && data.items.length>0 ?
        <CollegeLessonBulkVisibility items={data.items.map(item=>({
          id:item.id,name:item.name,visibleToStudents:item.visibleToStudents,
          updatedAt:item.updatedAt.toISOString(),
        }))}/> : null}
      <section aria-label={title + " records"} className="min-w-0 border-y border-[var(--lms-canvas-border)]">
        <p className="border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-sm text-muted-foreground">
          {data.total} matching {lessons ? "lessons" : "course offerings"}
        </p>
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? lessons
                ? "No persisted lessons match these filters. Learning paths and lessons may not have been authored."
                : "No course offerings match these filters. No completion or learner activity is inferred."
              : "No records exist on this page. Return to an earlier page."}
          </p>
        ) : (<>
          <div className="divide-y divide-border px-2 md:hidden" aria-label={title+" mobile records"}>
           {data.kind==="LESSONS" ? (
            <>
            {data.items.map(item=><article key={item.id} className="min-w-0 space-y-2 py-4">
             <h3 className="break-words font-semibold">{item.name}</h3>
             <Link className="inline-flex min-h-11 max-w-full items-center break-words text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
              href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}>
              {item.courseName} ({item.courseCode})
             </Link>
             <p className="text-xs text-body">{item.cohortName} · {item.periodName} · Lesson #{item.sequence+1}</p>
             <StatusBadge tone={item.status==="ARCHIVED"?"neutral":item.visibleToStudents?"success":"warning"}>{collegeLessonVisibilityLabel(item)}</StatusBadge>
             {item.status==="ARCHIVED"?
              <CollegeArchivedLessonRestore id={item.id} name={item.name}/>:
              <CollegeLessonVisibilityControl lesson={{id:item.id,name:item.name,
               visibleToStudents:item.visibleToStudents,updatedAt:item.updatedAt.toISOString()}}/>}
             <Link href={collegeOfferingProgressHref(item.offeringId)} className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">View recorded course activity</Link>
             {item.status!=="ARCHIVED"?
               <div aria-label="Lesson actions" className="flex min-w-0 flex-wrap gap-2">
                 <LessonActions lesson={{id:item.id,name:item.name,description:item.description,sequence:item.sequence}}/>
               </div>:null}
            </article>)}
            </>
           ) : (
            <>
            {data.items.map(item=><article key={item.offeringId} className="min-w-0 space-y-2 py-4">
             <Link className="inline-flex min-h-11 max-w-full items-center break-words font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
              href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}>
              {item.courseName} ({item.courseCode})
             </Link>
             <p className="text-xs text-body">{item.cohortName} · {item.periodName}</p>
             <p className="flex flex-wrap items-center gap-2 text-xs text-body">Offering state: <StatusBadge tone={item.offeringStatus==="ACTIVE"?"success":"neutral"}>{item.offeringStatus}</StatusBadge></p>
             <p className="text-xs text-body">{collegeProgressDescription(item)}</p>
             <Link href={collegeOfferingLessonsHref(item.offeringId)}
              className="inline-flex min-h-11 items-center text-xs font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">View authored lessons</Link>
            </article>)}
            </>
           )}
          </div>
          <div className="hidden min-w-0 md:block">
            {data.kind === "LESSONS" ? <DataTable
              caption="Lesson directory"
              rows={data.items}
              getRowKey={item=>item.id}
              empty={<p className="text-sm text-body">No lessons found for the selected filters.</p>}
              columns={[
                {key:"lesson",header:COLLEGE_COURSE_TAB_COPY.lessonColumns.name,
                  mobilePriority:"primary" as const,cell:item=><strong className="break-words text-foreground">{item.name}</strong>},
                {key:"course",header:COLLEGE_COURSE_TAB_COPY.lessonColumns.course,mobilePriority:"secondary" as const,
                  cell:item=><div className="min-w-0">
                    <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                      className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                      {item.courseName} ({item.courseCode})
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                  </div>},
                {key:"order",header:COLLEGE_COURSE_TAB_COPY.lessonColumns.order,mobilePriority:"secondary" as const,
                  cell:item=>item.sequence+1},
                {key:"students",header:COLLEGE_COURSE_TAB_COPY.lessonColumns.studentsSeeIt,mobilePriority:"secondary" as const,
                  cell:item=><div className="min-w-0 space-y-2">
                    <StatusBadge tone={item.status==="ARCHIVED"?"neutral":item.visibleToStudents?"success":"warning"}>{collegeLessonVisibilityLabel(item)}</StatusBadge>
                    {item.status==="ARCHIVED"?
                      <CollegeArchivedLessonRestore id={item.id} name={item.name}/>:
                      <CollegeLessonVisibilityControl lesson={{id:item.id,name:item.name,
                        visibleToStudents:item.visibleToStudents,updatedAt:item.updatedAt.toISOString()}}/>}
                    <Link href={collegeOfferingProgressHref(item.offeringId)}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                      View recorded course activity
                    </Link>
                  </div>},
                {key:"actions",header:"Actions",mobilePriority:"action" as const,
                  cell:item=>item.status==="ARCHIVED"
                    ? <span className="text-xs text-muted-foreground">Restore using the visibility column</span>
                    : <LessonActions lesson={{id:item.id,name:item.name,description:item.description,sequence:item.sequence}}/>},
              ]}
            /> : <DataTable
              caption="Recorded course progress"
              rows={data.items}
              getRowKey={item=>item.offeringId}
              empty={<p className="text-sm text-body">No course progress found for the selected filters.</p>}
              columns={[
                {key:"course",header:"Course / offering",mobilePriority:"primary" as const,
                  cell:item=><div className="min-w-0">
                    <Link href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}
                      className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                      {item.courseName} ({item.courseCode})
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                    <Link href={collegeOfferingLessonsHref(item.offeringId)}
                      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
                      View authored lessons
                    </Link>
                  </div>},
                {key:"state",header:"Offering state",mobilePriority:"secondary" as const,
                  cell:item=><StatusBadge tone={item.offeringStatus==="ACTIVE"?"success":"neutral"}>{item.offeringStatus}</StatusBadge>},
                {key:"activity",header:"Recorded learner activity",mobilePriority:"secondary" as const,
                  cell:item=>collegeProgressDescription(item)},
              ]}
            />}
          </div>
        </>)}
      </section>
      <div className="flex min-w-0 flex-col items-stretch gap-3 text-sm md:flex-row md:items-center md:justify-between">
        <span className="text-muted-foreground">{data.total===0?0:Math.min(data.total,(data.query.page-1)*data.query.pageSize+1)}–{Math.min(data.total,data.query.page*data.query.pageSize)} of {data.total} · Page {data.query.page} of {data.totalPages}</span>
        <div className="flex flex-wrap items-center gap-2">
          {lessons&&data.totalPages>1?<form method="get" action={href} className="flex items-center gap-2">
            {Array.from(new URL(collegeLearningHref(data.kind,{...data.query,page:1}),"https://local.invalid").searchParams.entries())
              .filter(([key])=>key!=="page").map(([key,value])=>
                <Input key={key} type="hidden" name={key} value={value}/>)}
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Jump to page
              <Input type="number" name="page" min={1} max={data.totalPages} defaultValue={data.query.page}
                className="ml-2 min-h-11 w-20 md:min-h-9"/>
            </label>
            <Button type="submit" className="min-h-11 md:min-h-9">Go</Button>
          </form>:null}
          <Pagination page={data.query.page} pageCount={data.totalPages}
            hrefForPage={page=>collegeLearningHref(data.kind,{...data.query,page})}
            label={title+" pagination"} showBoundaryLinks={false}/>
        </div>
      </div>
      {collegeLearningDirectoryHasPageCap(data.total,data.query.pageSize)?<p role="status" className="text-sm text-warning-text">Only the first 1,000 pages are accessible. Narrow your filters to reach older records.</p>:null}
      <p className="text-xs leading-5 text-muted-foreground">
        {lessons
          ? "This catalogue is based on registered lesson and content rows. Edit and Archive actions use the authorized lesson API; Archive retains history and files. Bulk selection remains in the separate visibility picker; no signed media URLs are queried."
          : "Counts use recorded learner-content progress rows only. Learners without activity are absent from counts. Completion flags reflect individual content records, not finished courses, distinct eligible learners, assignments, quizzes or attendance. Historic records may remain after enrollment changes."}
        Exact legacy reports, exports and browser parity remain unverified.
      </p>
    </div>
  );
}
