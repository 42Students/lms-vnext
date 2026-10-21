import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";
import {SuperAdminLearningFilterFields} from "@/components/admin/super-admin-learning-filter-fields";
import {SuperAdminLessonBulkVisibility} from "@/components/courses/super-admin-lesson-bulk-visibility";
import {LessonActions} from "@/components/courses/admin-learning-structure-actions";
import {CollegeLessonReorderActions} from "@/components/courses/college-lesson-reorder-actions";
import {SuperAdminLessonCreate} from "@/components/courses/super-admin-lesson-create";
import {listSuperAdminLearningPathPicker} from "@/modules/courses/super-admin-learning-path-picker";
import {CollegeLessonVisibilityControl} from "@/components/courses/college-lesson-visibility-controls";
import { getCurrentRequestContext } from "@/auth/request-context";
import {requireSuperAdminSelectedCollege} from "@/modules/admin-ui/super-admin-selected-college";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { listCollegeLessons } from "@/modules/courses/college-learning-directory-service";
import { adminLearningHref, adminLessonStats } from "@/modules/courses/admin-learning-read-model";
import {parseSuperAdminLearningQuery} from "@/modules/admin-ui/super-admin-learning-query-model";

export default async function SuperAdminLessonsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const parsed = parseSuperAdminLearningQuery(raw);
  if (!parsed.success) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons" />
    <ErrorState title="Invalid lesson filters" description="Check the search, status and page values."
      action={<Link href="/admin/lessons" className="inline-flex min-h-11 items-center font-[650] text-primary-text hover:text-primary-hover md:min-h-9 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its lessons." />
  </div>;
  requireSuperAdminSelectedCollege(context,"courses.manage");
  const [dataResult,filtersResult,pathsResult]=await Promise.allSettled([
    listCollegeLessons(context,parsed.data),
    getSuperAdminLearningFilterOptions(context),
    listSuperAdminLearningPathPicker(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons" />
    <ErrorState title="Lessons unavailable"
      description="The lesson directory could not be loaded. Your filters have not changed."
      action={<Link href={adminLearningHref("LESSONS",parsed.data)}
        className="inline-flex min-h-11 items-center font-[650] text-primary-text hover:text-primary-hover md:min-h-9 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Retry loading lessons</Link>} />
  </div>;
  const data=dataResult.value;
  const filters=filtersResult.status==="fulfilled"?filtersResult.value:{courses:[],cohorts:[]};
  const paths=pathsResult.status==="fulfilled"?pathsResult.value:[];
  const summary = adminLessonStats(data.items);
  // The directory is atomic, but unavailable filter choices make a bulk selection unsafe.
  const listIncomplete = filtersResult.status === "rejected";
  // A move is safe only with every lesson of one path visible, including archived rows.
  // The server still checks the expected sequence before applying any change.
  const allRowsOfOnePath = !data.query.q && !data.query.courseCode && !data.query.cohortCode &&
    data.query.status === "ALL" && data.total === data.items.length &&
    data.items.length > 1 && new Set(data.items.map(item => item.learningPathId)).size === 1 &&
    data.items.every(item => item.status === "ACTIVE");
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons"
      description="Authored lesson catalogue in your selected college. Counts reflect registered content records, not learner completion."
      actions={<a href={"/api/admin/lessons/export?"+new URLSearchParams({q:data.query.q,status:data.query.status,...(data.query.courseCode?{courseCode:data.query.courseCode}:{}),...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{})}).toString()}
     className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-[14px] font-[650] leading-5 text-[var(--lms-primary-text)] transition-colors duration-150 hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export</a>}
    />
    
    <form className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
      <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q} placeholder="Lesson or course"
          className="min-h-11 md:min-h-9" />
      </label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </label>
        <Button type="submit" className="min-h-11 w-full self-end sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
      </div>
      <details className="min-w-0" open={Boolean(data.query.courseCode || data.query.cohortCode)}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2">
          <SuperAdminLearningFilterFields courses={filters.courses} cohorts={filters.cohorts} selectedCourse={data.query.courseCode} selectedCohort={data.query.cohortCode}/>
        </div>
      </details>
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-[var(--lms-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/admin/lessons">Clear filters</Link>
    </form>
    <p className="text-sm text-muted-foreground">{data.total.toLocaleString("en-IN")} matching lessons · on this page: {summary.authored} content records, {summary.published} published{" "}
      <Link href={adminLearningHref("LESSONS",data.query)} className="font-semibold text-primary-text underline underline-offset-4">Reload results</Link>
    </p>
    {filtersResult.status==="rejected"?<Alert tone="warning">
      Courses could not be loaded. The lesson directory and your applied filters remain visible.{" "}
      <Link href={adminLearningHref("LESSONS",data.query)} className="font-semibold underline">Retry filter choices</Link>.
    </Alert>:null}
    {pathsResult.status==="fulfilled"?<SuperAdminLessonCreate paths={paths}/>:
      <Alert tone="warning">Lesson creation options are temporarily unavailable. Existing lessons remain visible.{" "}
        <Link href={adminLearningHref("LESSONS",data.query)} className="font-semibold underline">Retry creation options</Link>.
      </Alert>}
    {data.items.length?<SuperAdminLessonBulkVisibility lessons={data.items} listIncomplete={listIncomplete}/>:null}
    {data.items.length && !allRowsOfOnePath?<p className="text-xs text-muted-foreground">
      Reordering is unavailable in a filtered, multi-path or incomplete list. Open the offering to manage its complete lesson order.
    </p>:null}
    {data.items.length ? <div className="min-w-0 divide-y divide-border border-y border-border">
      {data.items.map(lesson => <article key={lesson.id} className="min-w-0 py-[var(--lms-space-4)] first:pt-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 min-w-0 break-words text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">{lesson.name}</h2>
          <StatusBadge tone={lesson.status === "ACTIVE" ? "success" : "neutral"}>{lesson.status}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{lesson.courseName} ({lesson.courseCode})</p>
        <p className="mt-1 text-xs text-muted-foreground">{lesson.cohortName} · {lesson.periodName} · Order {lesson.sequence + 1}</p>
        <p className="mt-[var(--lms-space-2)] flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)] text-sm text-body">
          Students see it: <StatusBadge tone={lesson.status==="ACTIVE" && lesson.visibleToStudents &&
            lesson.pathStatus==="PUBLISHED" && lesson.offeringStatus==="ACTIVE"?"success":"neutral"}>
            {lesson.status==="ACTIVE" && lesson.visibleToStudents &&
              lesson.pathStatus==="PUBLISHED" && lesson.offeringStatus==="ACTIVE"?"Visible":"Hidden"}
          </StatusBadge>
          Learning path: <StatusBadge tone={lesson.pathStatus==="PUBLISHED"?"success":"neutral"}>{lesson.pathStatus}</StatusBadge>
          Offering: <StatusBadge tone={lesson.offeringStatus==="ACTIVE"?"success":"neutral"}>{lesson.offeringStatus}</StatusBadge>
        </p>
        <p className="mt-2 text-sm text-body">{lesson.publishedContentCount} published / {lesson.contentCount} authored content records</p>
        {lesson.status==="ACTIVE"?<details className="mt-[var(--lms-space-2)] min-w-0">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Actions</summary>
          <div className="flex min-w-0 flex-col items-start gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:items-center">
          <LessonActions lesson={{id:lesson.id,name:lesson.name,description:lesson.description,sequence:lesson.sequence}}/>
          <CollegeLessonVisibilityControl lesson={{id:lesson.id,name:lesson.name,
            visibleToStudents:lesson.visibleToStudents,updatedAt:lesson.updatedAt.toISOString()}}/>
          {allRowsOfOnePath?<CollegeLessonReorderActions learningPathId={lesson.learningPathId} lessonId={lesson.id}
            expectedSequence={lesson.sequence}
            canMoveUp={data.items.some(other=>other.learningPathId===lesson.learningPathId && other.sequence===lesson.sequence-1)}
            canMoveDown={data.items.some(other=>other.learningPathId===lesson.learningPathId && other.sequence===lesson.sequence+1)}/>:null}
          </div>
        </details>:<p className="mt-2 text-xs text-muted-foreground">Archived lesson retained with its content and order. Restoration requires an authorized server workflow.</p>}
        <Link href={`/admin/courses/offerings/${encodeURIComponent(lesson.offeringId)}`}
          className="mt-[var(--lms-space-2)] inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text underline focus-visible:outline hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary-subtle)] active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          Open offering to add lessons →
        </Link>
      </article>)}
    </div> : <EmptyState title="No lessons found" description="The current college and filters have no recorded lessons." />}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
      <span className="text-sm text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <Pagination page={data.query.page} pageCount={data.totalPages}
        hrefForPage={page=>adminLearningHref("LESSONS",{...data.query,page})}
        label="Lesson pages" showBoundaryLinks={false}/>
    </div>
    <Link href="/admin/courses" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text hover:text-[var(--lms-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">← Courses</Link>
  </div>;
}
