import { Button } from "@/components/ui/button";
import Link from "next/link";
import {CollegeArchivedLessonRestore} from "./college-archived-lesson-restore";
import {CollegeLessonVisibilityControl,CollegeLessonBulkVisibility} from "./college-lesson-visibility-controls";
import { COLLEGE_COURSE_TAB_COPY, collegeLessonVisibilityLabel } from "@/modules/courses/college-course-tabs-copy";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { collegeLearningHref, collegeOfferingLessonsHref, collegeOfferingProgressHref, collegeProgressDescription } from "@/modules/courses/college-learning-directory-model";
import type {
  listCollegeCourseProgress,
  listCollegeLessons,
} from "@/modules/courses/college-learning-directory-service";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeLessons>>
  | Awaited<ReturnType<typeof listCollegeCourseProgress>>;

export function CollegeLearningDirectory({ data,courseChoices=[] }: { data: DirectoryData;courseChoices?:readonly {code:string;name:string}[] }) {
  const lessons = data.kind === "LESSONS";
  const title = lessons ? COLLEGE_COURSE_TAB_COPY.lessonsTitle : COLLEGE_COURSE_TAB_COPY.progressTitle;
  const href = lessons ? "/college/lessons" : "/college/course-progress";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Courses & Content"
        title={title}
        description={lessons ? undefined : COLLEGE_COURSE_TAB_COPY.progressDescription}
        actions={
          <Link href="/college/courses"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Course offerings
          </Link>
        }
      />
      <section aria-label={title + " filters"} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form method="get" action={href} className="flex flex-wrap items-end gap-3">
          {lessons?<label className="grid min-w-32 gap-1 text-sm font-semibold text-body">
            Rows per page
            <select name="pageSize" defaultValue={data.query.pageSize}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              {[10,25,50,100].map(size=><option key={size} value={size}>{size}</option>)}
            </select>
          </label>:null}
          <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold text-body">
            Course or {lessons ? "lesson" : "cohort"}
            <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              placeholder="Search registered records"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent program lifecycle
              <select name="programStatus" defaultValue={data.query.programStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent batch lifecycle
              <select name="cohortStatus" defaultValue={data.query.cohortStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period lifecycle
              <select name="periodStatus" defaultValue={data.query.periodStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent course lifecycle
              <select name="courseStatus" defaultValue={data.query.courseStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Department code (exact)
              <input type="search" name="departmentCode" maxLength={64} defaultValue={data.query.departmentCode ?? ""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent program lifecycle
              <select name="programStatus" defaultValue={data.query.programStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent batch lifecycle
              <select name="cohortStatus" defaultValue={data.query.cohortStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period lifecycle
              <select name="periodStatus" defaultValue={data.query.periodStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="PLANNED">PLANNED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Parent course lifecycle
              <select name="courseStatus" defaultValue={data.query.courseStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Department code (exact)
              <input name="departmentCode" type="search" maxLength={64} defaultValue={data.query.departmentCode ?? ""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
            {lessons ? "Lesson status" : "Offering status"}
            <select name="status" defaultValue={data.query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </select>
          </label>
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period code (exact)
              <input name="periodCode" type="search" maxLength={64}
                defaultValue={data.query.periodCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Batch code (exact)
              <input name="cohortCode" type="search" maxLength={64}
                defaultValue={data.query.cohortCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Program code (exact)
              <input name="programCode" type="search" maxLength={64}
                defaultValue={data.query.programCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course
              <select name="courseCode" defaultValue={data.query.courseCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="">All courses</option>
                {courseChoices.map(option=><option key={option.code} value={option.code}>
                  {option.name} ({option.code})
                </option>)}
                {data.query.courseCode&&!courseChoices.some(option=>option.code===data.query.courseCode)?
                  <option value={data.query.courseCode}>{data.query.courseCode} (not in current authoring list)</option>:null}
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Course offering type
              <select name="offeringType" defaultValue={data.query.offeringType??"ALL"}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any offering type</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Course department name (exact)
              <input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Published and visibility-flagged content
              <select name="flaggedVisibility" defaultValue={data.query.flaggedVisibility} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_FLAGGED">Has flagged content</option><option value="NONE_FLAGGED">No flagged content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Authored assignments
              <select name="assignmentPresence" defaultValue={data.query.assignmentPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_ASSIGNMENTS">Has assignments</option><option value="NO_ASSIGNMENTS">No assignments</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Authored quizzes
              <select name="quizPresence" defaultValue={data.query.quizPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_QUIZZES">Has quizzes</option><option value="NO_QUIZZES">No quizzes</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Published lesson content
              <select name="publishedContent" defaultValue={data.query.publishedContent} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any publication</option><option value="HAS_PUBLISHED">Has published content</option><option value="NONE_PUBLISHED">No published content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Authored lesson items
              <select name="contentPresence" defaultValue={data.query.contentPresence??"ALL"}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_CONTENT">Contains authored content</option>
                <option value="EMPTY">No content authored</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Learning path lifecycle
              <select name="pathStatus" defaultValue={data.query.pathStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All paths</option>
                <option value="DRAFT">Draft paths</option><option value="PUBLISHED">Published paths</option>
                <option value="ARCHIVED">Archived paths</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">
              Offering lifecycle
              <select name="offeringStatus" defaultValue={data.query.offeringStatus}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option>
                <option value="ACTIVE">Active offerings</option>
                <option value="ARCHIVED">Archived offerings</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course offering type
              <select name="offeringType" defaultValue={data.query.offeringType??"ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course department (exact name)
              <input name="departmentName" type="search" maxLength={255} defaultValue={data.query.departmentName??""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Recorded learner activity
              <select name="activityState" defaultValue={data.query.activityState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="RECORDED">Has activity rows</option><option value="UNRECORDED">No recorded activity</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Content completion evidence
              <select name="completionEvidence" defaultValue={data.query.completionEvidence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="COMPLETED_CONTENT">Has completed content records</option><option value="NO_COMPLETED_CONTENT">No completed content records</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Shared learning path
              <select name="learningPathPresence" defaultValue={data.query.learningPathPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_PATH">Has a path</option><option value="NO_PATH">No learning path</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Published learning path
              <select name="publishedPathPresence" defaultValue={data.query.publishedPathPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any publication</option><option value="HAS_PUBLISHED_PATH">Published path exists</option><option value="NO_PUBLISHED_PATH">No published path</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Batch / cohort code (exact)
              <input name="cohortCode" type="search" maxLength={64}
                defaultValue={data.query.cohortCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Academic period code (exact)
              <input name="periodCode" type="search" maxLength={64}
                defaultValue={data.query.periodCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Program code (exact)
              <input name="programCode" type="search" maxLength={64}
                defaultValue={data.query.programCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Course code (exact)
              <input name="courseCode" type="search" maxLength={64}
                defaultValue={data.query.courseCode??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Saved content kind
              <select name="contentType" defaultValue={data.query.contentType} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All kinds</option>
                <option value="RESOURCE">Resource</option>
                <option value="VIDEO">Uploaded video</option>
                <option value="YOUTUBE">YouTube</option>
                <option value="LIVE_CLASS">Live class</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Saved content lifecycle
              <select name="contentLifecycle" defaultValue={data.query.contentLifecycle} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any content state</option>
                <option value="DRAFT">Draft exists</option>
                <option value="PUBLISHED">Published exists</option>
                <option value="ARCHIVED">Archived exists</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Starting lesson order (1-based)
              <input name="sequenceFrom" type="number" min={1} max={10000} step={1} defaultValue={data.query.sequenceFrom ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Last lesson order (1-based)
              <input name="sequenceThrough" type="number" min={1} max={10000} step={1} defaultValue={data.query.sequenceThrough ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Exact saved lesson title
              <input name="lessonName" type="search" maxLength={255} defaultValue={data.query.lessonName ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Saved lessons
              <select name="lessonPresence" defaultValue={data.query.lessonPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_LESSONS">Has authored lessons</option><option value="NO_LESSONS">No authored lessons</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Authored course assignments
              <select name="assignmentPresence" defaultValue={data.query.assignmentPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_ASSIGNMENTS">Assignments authored</option><option value="NO_ASSIGNMENTS">No assignments authored</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Authored course quizzes
              <select name="quizPresence" defaultValue={data.query.quizPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_QUIZZES">Quizzes authored</option><option value="NO_QUIZZES">No quizzes authored</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Saved resources
              <select name="resourcePresence" defaultValue={data.query.resourcePresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_RESOURCES">Has resources</option><option value="NO_RESOURCES">No resources</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Scheduled live-class content
              <select name="liveClassPresence" defaultValue={data.query.liveClassPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_LIVE">Has saved live classes</option><option value="NO_LIVE">No saved live classes</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Authored content audience
              <select name="contentAudience" defaultValue={data.query.contentAudience} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="SHARED">Has shared content</option><option value="SECTION">Has section-bound content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Published items hidden from students
              <select name="hiddenPublished" defaultValue={data.query.hiddenPublished} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_HIDDEN">Has hidden published item</option><option value="NO_HIDDEN">No hidden published items</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Authored video or YouTube
              <select name="videoEvidence" defaultValue={data.query.videoEvidence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_VIDEO">With videos</option><option value="NO_VIDEO">Without videos</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Saved resource items
              <select name="resourceEvidence" defaultValue={data.query.resourceEvidence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_RESOURCE">Has resources</option><option value="NO_RESOURCE">No resources</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Saved live-class items
              <select name="liveEvidence" defaultValue={data.query.liveEvidence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All lessons</option><option value="HAS_LIVE">Has live-class items</option><option value="NO_LIVE">No live-class items</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Offering video material
              <select name="videoContentState" defaultValue={data.query.videoContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_VIDEO">Contains video content</option><option value="NO_VIDEO">No video content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Published authored content
              <select name="publishedContentState" defaultValue={data.query.publishedContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_PUBLISHED">Contains published content</option><option value="NO_PUBLISHED">No published content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Hidden published content
              <select name="hiddenContentState" defaultValue={data.query.hiddenContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_HIDDEN">Contains hidden published item</option><option value="NO_HIDDEN">No hidden published items</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Shared learning content
              <select name="sharedContentState" defaultValue={data.query.sharedContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_SHARED">Has shared content</option><option value="NO_SHARED">No shared content</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Section-bound authored content
              <select name="sectionContentState" defaultValue={data.query.sectionContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_SECTION">Has section-bound items</option><option value="NO_SECTION">No section-bound items</option>
              </select>
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">Exact lesson ID
              <input name="lessonId" defaultValue={data.query.lessonId??""} placeholder="Lesson UUID"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">Offering ID
              <input name="offeringId" defaultValue={data.query.offeringId??""} placeholder="Course offering UUID"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">Exact offering ID
              <input name="offeringId" defaultValue={data.query.offeringId??""} placeholder="Course offering UUID"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-48 gap-1 text-sm font-semibold text-body">Exact learning path ID
              <input name="pathId" defaultValue={data.query.pathId??""} placeholder="Path UUID"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Minimum authored items
              <input type="number" name="minContentCount" min={1} max={1000} defaultValue={data.query.minContentCount??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "LESSONS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Maximum authored items
              <input type="number" name="maxContentCount" min={0} max={1000} defaultValue={data.query.maxContentCount??""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Draft lesson content
              <select name="draftContentState" defaultValue={data.query.draftContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_DRAFT">Contains drafts</option><option value="NO_DRAFT">No saved drafts</option>
              </select>
            </label>
          ) : null}
          {data.kind === "PROGRESS" ? (
            <label className="grid min-w-36 gap-1 text-sm font-semibold text-body">Archived lesson content
              <select name="archivedContentState" defaultValue={data.query.archivedContentState} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All offerings</option><option value="HAS_ARCHIVED">Contains archived items</option><option value="NO_ARCHIVED">No archived items</option>
              </select>
            </label>
          ) : null}
          <Button variant="primary" type="submit"
            >Filter</Button>
          <Link href={href} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Clear
          </Link>
        </form>
      </section>
      {data.kind==="LESSONS" && data.items.length>0 ?
        <CollegeLessonBulkVisibility items={data.items.map(item=>({
          id:item.id,name:item.name,visibleToStudents:item.visibleToStudents,
          updatedAt:item.updatedAt.toISOString(),
        }))}/> : null}
      <section aria-label={title + " records"} className="overflow-x-auto rounded-xl border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
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
          <div className="space-y-3 p-3 md:hidden" aria-label={title+" mobile records"}>
           {data.kind==="LESSONS" ? (
            <>
            {data.items.map(item=><article key={item.id} className="space-y-2 rounded-lg border border-border p-3">
             <h3 className="break-words font-semibold">{item.name}</h3>
             <Link className="block break-words text-sm font-semibold text-primary-text underline"
              href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}>
              {item.courseName} ({item.courseCode})
             </Link>
             <p className="text-xs text-body">{item.cohortName} · {item.periodName} · Lesson #{item.sequence+1}</p>
             <p className="text-xs">{collegeLessonVisibilityLabel(item)}</p>
             {item.status==="ARCHIVED"?
              <CollegeArchivedLessonRestore id={item.id} name={item.name}/>:
              <CollegeLessonVisibilityControl lesson={{id:item.id,name:item.name,
               visibleToStudents:item.visibleToStudents,updatedAt:item.updatedAt.toISOString()}}/>}
             <Link href={collegeOfferingProgressHref(item.offeringId)} className="inline-flex min-h-10 items-center text-xs font-semibold text-primary-text underline">View recorded course activity</Link>
            </article>)}
            </>
           ) : (
            <>
            {data.items.map(item=><article key={item.offeringId} className="space-y-2 rounded-lg border border-border p-3">
             <Link className="block break-words font-semibold text-primary-text underline"
              href={"/college/courses/offerings/"+encodeURIComponent(item.offeringId)}>
              {item.courseName} ({item.courseCode})
             </Link>
             <p className="text-xs text-body">{item.cohortName} · {item.periodName}</p>
             <p className="text-xs text-body">Offering state: {item.offeringStatus}</p>
             <p className="text-xs text-body">{collegeProgressDescription(item)}</p>
             <Link href={collegeOfferingLessonsHref(item.offeringId)}
              className="inline-flex min-h-10 items-center text-xs font-semibold text-primary-text underline">View authored lessons</Link>
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
                      className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text hover:underline">
                      {item.courseName} ({item.courseCode})
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                  </div>},
                {key:"order",header:COLLEGE_COURSE_TAB_COPY.lessonColumns.order,mobilePriority:"secondary" as const,
                  cell:item=>item.sequence+1},
                {key:"students",header:COLLEGE_COURSE_TAB_COPY.lessonColumns.studentsSeeIt,mobilePriority:"action" as const,
                  cell:item=><div className="min-w-0 space-y-2">
                    <p className="text-body">{collegeLessonVisibilityLabel(item)}</p>
                    {item.status==="ARCHIVED"?
                      <CollegeArchivedLessonRestore id={item.id} name={item.name}/>:
                      <CollegeLessonVisibilityControl lesson={{id:item.id,name:item.name,
                        visibleToStudents:item.visibleToStudents,updatedAt:item.updatedAt.toISOString()}}/>}
                    <Link href={collegeOfferingProgressHref(item.offeringId)}
                      className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
                      View recorded course activity
                    </Link>
                  </div>},
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
                      className="inline-flex min-h-11 items-center break-words font-semibold text-primary-text hover:underline">
                      {item.courseName} ({item.courseCode})
                    </Link>
                    <p className="text-xs text-muted-foreground">{item.cohortName} · {item.periodName}</p>
                    <Link href={collegeOfferingLessonsHref(item.offeringId)}
                      className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">
                      View authored lessons
                    </Link>
                  </div>},
                {key:"state",header:"Offering state",mobilePriority:"secondary" as const,
                  cell:item=>item.offeringStatus},
                {key:"activity",header:"Recorded learner activity",mobilePriority:"secondary" as const,
                  cell:item=>collegeProgressDescription(item)},
              ]}
            />}
          </div>
        </>)}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{data.total===0?0:Math.min(data.total,(data.query.page-1)*data.query.pageSize+1)}–{Math.min(data.total,data.query.page*data.query.pageSize)} of {data.total} · Page {data.query.page} of {data.totalPages}</span>
        <div className="flex flex-wrap items-center gap-2">
          {lessons&&data.totalPages>1?<form method="get" action={href} className="flex items-center gap-2">
            {Array.from(new URL(collegeLearningHref(data.kind,{...data.query,page:1}),"https://local.invalid").searchParams.entries())
              .filter(([key])=>key!=="page").map(([key,value])=>
                <input key={key} type="hidden" name={key} value={value}/>)}
            <label className="text-xs font-semibold">Jump to page
              <input type="number" name="page" min={1} max={data.totalPages} defaultValue={data.query.page}
                className="ml-2 w-20 rounded border border-border bg-surface p-2 text-foreground"/>
            </label>
            <Button variant="secondary" type="submit" className="text-primary-text">Go</Button>
          </form>:null}
          {data.query.page > 1 ? <Link
            href={collegeLearningHref(data.kind, { ...data.query, page: data.query.page - 1 })}
            className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link> : null}
          {data.query.page < data.totalPages ? <Link
            href={collegeLearningHref(data.kind, { ...data.query, page: data.query.page + 1 })}
            className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link> : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        {lessons
          ? "This catalogue is based on registered lesson and content rows. Content counts include historical draft/archived records; no file URLs or signed media are queried. Creation, editing, ordering and storage remain offering-scoped."
          : "Counts use recorded learner-content progress rows only. Learners without activity are absent from counts. Completion flags reflect individual content records, not finished courses, distinct eligible learners, assignments, quizzes or attendance. Historic records may remain after enrollment changes."}
        Exact legacy reports, exports and browser parity remain unverified.
      </p>
    </div>
  );
}
