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
  if (!parsed.success) return <div className="space-y-5">
    <PageHeader title="Lessons" />
    <ErrorState title="Invalid lesson filters" description="Check the search, status and page values."
      action={<Link href="/admin/lessons" className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover md:min-h-9">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="space-y-5">
    <PageHeader title="Lessons" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its lessons." />
  </div>;
  requireSuperAdminSelectedCollege(context,"courses.manage");
  const [dataResult,filtersResult,pathsResult]=await Promise.allSettled([
    listCollegeLessons(context,parsed.data),
    getSuperAdminLearningFilterOptions(context),
    listSuperAdminLearningPathPicker(context),
  ]);
  if(dataResult.status==="rejected")return <div className="space-y-5">
    <PageHeader title="Lessons" />
    <ErrorState title="Lessons unavailable"
      description="The lesson directory could not be loaded. Your filters have not changed."
      action={<Link href={adminLearningHref("LESSONS",parsed.data)}
        className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:text-primary-hover md:min-h-9">Retry loading lessons</Link>} />
  </div>;
  const data=dataResult.value;
  const filters=filtersResult.status==="fulfilled"?filtersResult.value:{courses:[],cohorts:[]};
  const paths=pathsResult.status==="fulfilled"?pathsResult.value:[];
  const summary = adminLessonStats(data.items);
  return <div className="space-y-5">
    <PageHeader title="Lessons"
      description="Authored lesson catalogue in your selected college. Counts reflect registered content records, not learner completion."
      actions={<a href={"/api/admin/lessons/export?"+new URLSearchParams({q:data.query.q,status:data.query.status,...(data.query.courseCode?{courseCode:data.query.courseCode}:{}),...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{})}).toString()}
     className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text">Export lessons.csv</a>}
    />
    
    <form className="grid gap-3 py-1 md:grid-cols-2 xl:grid-cols-5">
      <label className="grid gap-1 text-xs font-semibold leading-4 text-body">Search
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q} placeholder="Lesson or course"
          className="min-h-11 md:min-h-9" />
      </label>
      <label className="grid gap-1 text-xs font-semibold leading-4 text-body">Status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </label>
      <SuperAdminLearningFilterFields courses={filters.courses} cohorts={filters.cohorts} selectedCourse={data.query.courseCode} selectedCohort={data.query.cohortCode}/>
      <Button type="submit" className="min-h-11 self-end md:min-h-9">Filter</Button>
    </form>
    <Link className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text" href="/admin/lessons">Clear filters</Link>
    <p className="text-sm text-muted-foreground">{data.total} matching lessons · on this page: {summary.authored} content records, {summary.published} published</p>
    {filtersResult.status==="rejected"?<Alert tone="warning">
      Course and cohort filter choices are temporarily unavailable. Your selected filters are still applied.
    </Alert>:null}
    {pathsResult.status==="fulfilled"?<SuperAdminLessonCreate paths={paths}/>:
      <Alert tone="warning">Lesson creation options are temporarily unavailable. Existing lessons remain visible.</Alert>}
    {data.items.length?<SuperAdminLessonBulkVisibility lessons={data.items}/>:null}
    {data.items.length ? <div className="divide-y divide-border border-y border-border">
      {data.items.map(lesson => <article key={lesson.id} className="min-w-0 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words text-base font-semibold text-foreground">{lesson.name}</h2>
          <StatusBadge tone={lesson.status === "ACTIVE" ? "success" : "neutral"}>{lesson.status}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{lesson.courseName} ({lesson.courseCode})</p>
        <p className="mt-1 text-xs text-muted-foreground">{lesson.cohortName} · {lesson.periodName} · Order {lesson.sequence + 1}</p>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-body">Learning path: <StatusBadge tone={lesson.pathStatus==="PUBLISHED"?"success":"neutral"}>{lesson.pathStatus}</StatusBadge> Offering: <StatusBadge tone={lesson.offeringStatus==="ACTIVE"?"success":"neutral"}>{lesson.offeringStatus}</StatusBadge></p>
        <p className="mt-2 text-sm text-body">{lesson.publishedContentCount} published / {lesson.contentCount} authored content records</p>
        {lesson.status==="ACTIVE"?<div className="mt-3 flex flex-wrap items-center gap-3">
          <LessonActions lesson={{id:lesson.id,name:lesson.name,description:lesson.description,sequence:lesson.sequence}}/>
          <CollegeLessonVisibilityControl lesson={{id:lesson.id,name:lesson.name,
            visibleToStudents:lesson.visibleToStudents,updatedAt:lesson.updatedAt.toISOString()}}/>
          <CollegeLessonReorderActions learningPathId={lesson.learningPathId} lessonId={lesson.id}
            expectedSequence={lesson.sequence} canMoveUp={lesson.sequence>0} canMoveDown={true}/>
        </div>:null}
        <Link href={`/admin/courses/offerings/${encodeURIComponent(lesson.offeringId)}`}
          className="mt-3 inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Open offering to add lessons →
        </Link>
      </article>)}
    </div> : <EmptyState title="No lessons found" description="The current college and filters have no recorded lessons." />}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <Pagination page={data.query.page} pageCount={data.totalPages}
        hrefForPage={page=>adminLearningHref("LESSONS",{...data.query,page})}
        label="Lesson pages" showBoundaryLinks={false}/>
    </div>
    <Link href="/admin/courses" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text">← Courses</Link>
  </div>;
}
