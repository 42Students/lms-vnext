import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";
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
  // Legacy lesson directory has an explicit all-courses opt-in, separate from
  // the authenticated tenant selection; never infer a college from query input.
  const safeRaw={...raw};
  delete safeRaw.allCourses;delete safeRaw.pageSize;
  const parsed = parseSuperAdminLearningQuery(safeRaw);
  const validAllCourses=raw.allCourses===undefined||raw.allCourses==="true";
  const allCourses=raw.allCourses==="true"&&!raw.courseCode;
  const validPageSize=typeof raw.pageSize!=="object"&&
    (raw.pageSize===undefined||["10","25","50","100"].includes(raw.pageSize));
  const pageSize=validPageSize&&raw.pageSize?Number(raw.pageSize):25;
  if (!parsed.success||!validPageSize||!validAllCourses) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons" />
    <ErrorState title="Invalid lesson filters" description="Check the search, status and page values."
      action={<Link href="/admin/lessons" className="inline-flex min-h-11 items-center font-[650] text-primary-text hover:text-primary-hover md:min-h-9 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons" />
    <Alert tone="warning" role="alert" title="Select a college to manage Lessons">
      Choose a college in the header above to see its lessons.
    </Alert>
  </div>;
  requireSuperAdminSelectedCollege(context,"courses.manage");
  const [dataResult,filtersResult,pathsResult]=await Promise.allSettled([
    listCollegeLessons(context,{...parsed.data,pageSize}),
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
  const hasCourseSelection=Boolean(data.query.courseCode)||allCourses;
  const listedLessons=hasCourseSelection?data.items:[];
  const selectedScopeHref=(query:typeof data.query)=>{
    const href=adminLearningHref("LESSONS",query);
    return href+(href.includes("?")?"&":"?")+"pageSize="+pageSize+
      (allCourses?"&allCourses=true":"");
  };
  const unscopedHref=adminLearningHref("LESSONS",{...data.query,courseCode:undefined,page:1});
  const viewAllHref=unscopedHref+(unscopedHref.includes("?")?"&":"?")+
    "pageSize="+pageSize+"&allCourses=true";
  const closeAllHref=unscopedHref+(unscopedHref.includes("?")?"&":"?")+
    "pageSize="+pageSize;
  const filters=filtersResult.status==="fulfilled"?filtersResult.value:{courses:[],cohorts:[]};
  const paths=pathsResult.status==="fulfilled"?pathsResult.value:[];
  const summary = adminLessonStats(listedLessons);
  // The directory is atomic, but unavailable filter choices make a bulk selection unsafe.
  const listIncomplete = filtersResult.status === "rejected";
  // A move is safe only with every lesson of one path visible, including archived rows.
  // The server still checks the expected sequence before applying any change.
  const allRowsOfOnePath = hasCourseSelection && !allCourses && !data.query.q &&
    Boolean(data.query.courseCode) && !data.query.cohortCode &&
    data.query.status === "ALL" && data.total === data.items.length &&
    data.items.length > 1 && new Set(data.items.map(item => item.learningPathId)).size === 1 &&
    data.items.every(item => item.status === "ACTIVE");
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Lessons"
      description="Authored lessons in the selected college."
    />
    
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
      <aside aria-label="Create New Lesson" className="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Create New Lesson</h2>
        {pathsResult.status==="fulfilled"?<SuperAdminLessonCreate paths={paths}/>:
          <Alert tone="warning" role="alert">Courses could not be loaded.{" "}
            <Link href={selectedScopeHref(data.query)} className="font-semibold underline">Retry</Link>
          </Alert>}
        {pathsResult.status==="fulfilled"&&paths.length===0?<p className="mt-3 text-sm text-body">
          No courses in this college yet.{" "}
          <Link href="/admin/courses" className="font-semibold text-primary-text underline">Go to Courses</Link>
        </p>:null}
      </aside>
      <section aria-label="Lessons table" className="min-w-0 rounded-[var(--lms-radius-card)] border border-[var(--lms-canvas-border)] bg-surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Lessons</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link href={selectedScopeHref(data.query)}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">Refresh</Link>
            {hasCourseSelection?<a download="lessons.csv" href={"/api/admin/lessons/export?"+new URLSearchParams({
              q:data.query.q,status:data.query.status,
              ...(data.query.courseCode?{courseCode:data.query.courseCode}:{}),
              ...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{})
            }).toString()} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">
              Export lessons.csv
            </a>:<span className="text-xs text-muted-foreground">
              Choose a course to export
            </span>}
          </div>
        </div>
        <form className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
          <input type="hidden" name="pageSize" value={pageSize}/>
          {allCourses?<input type="hidden" name="allCourses" value="true"/>:null}
      <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q} placeholder="Search lessons"
          className="min-h-11 md:min-h-9" />
      </label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </label>
        <Button type="submit" className="min-h-11 w-full self-end sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
      </div>
      <label className="grid min-w-0 gap-2 text-sm font-semibold text-[var(--lms-neutral-400)]">
        Course
        <Select aria-label="Filter lessons by course" name="courseCode"
          defaultValue={data.query.courseCode??""} className="min-h-11 md:min-h-9">
          <option value="">Choose a course</option>
          {filters.courses.map(item=><option key={item.code} value={item.code}>
            {item.name} ({item.code})
          </option>)}
        </Select>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        {!allCourses?<Link href={viewAllHref}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
          View all courses (slower)
        </Link>:<Link href={closeAllHref}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
          Close all-courses view
        </Link>}
        {allCourses?<Alert tone="warning">
          Loading all courses may take longer. Use a single course when possible.
        </Alert>:null}
      </div>
      <details className="min-w-0" open={Boolean(data.query.cohortCode)}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-semibold text-[var(--lms-neutral-400)]">
            Choose batch
            <Select name="cohortCode" defaultValue={data.query.cohortCode??""}
              className="min-h-11 w-full md:min-h-9">
              <option value="">All batches</option>
              {filters.cohorts.map(item=><option key={item.code} value={item.code}>
                {item.name} ({item.code})
              </option>)}
            </Select>
          </label>
        </div>
      </details>
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-[var(--lms-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href="/admin/lessons">Clear filters</Link>
    </form>
    <p className="mt-3 text-sm text-muted-foreground">{hasCourseSelection?data.total.toLocaleString("en-IN"):"0"} matching lessons · on this page: {summary.authored} content records, {summary.published} published{" "}
      <Link href={selectedScopeHref(data.query)} className="font-semibold text-primary-text underline underline-offset-4">Reload results</Link>
    </p>
    {filtersResult.status==="rejected"?<Alert tone="warning">
      Courses could not be loaded. The lesson directory and your applied filters remain visible.{" "}
      <Link href={adminLearningHref("LESSONS",data.query)} className="font-semibold underline">Retry filter choices</Link>.
    </Alert>:null}

    {listedLessons.length?<SuperAdminLessonBulkVisibility lessons={listedLessons} listIncomplete={listIncomplete}/>:null}
    {listedLessons.length>0 && !allRowsOfOnePath?<p className="text-xs text-muted-foreground">
      Reordering is unavailable in a filtered, multi-path or incomplete list. Open the offering to manage its complete lesson order.
    </p>:null}
    {hasCourseSelection&&listedLessons.length?<div className="mt-4 min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-border"
      role="region" aria-label="Lessons table" tabIndex={0}>
      <table className="w-full min-w-[770px] border-collapse text-left text-sm">
        <thead className="bg-[var(--lms-canvas-subtle)] text-[var(--lms-neutral-400)]">
          <tr>
            <th scope="col" className="whitespace-nowrap border-b border-border p-3 font-semibold">Lesson Name</th>
            <th scope="col" className="whitespace-nowrap border-b border-border p-3 font-semibold">Course</th>
            <th scope="col" className="whitespace-nowrap border-b border-border p-3 font-semibold">Order</th>
            <th scope="col" className="whitespace-nowrap border-b border-border p-3 font-semibold">Students see it</th>
            <th scope="col" className="whitespace-nowrap border-b border-border p-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {listedLessons.map((lesson,index)=>{
            const visible=lesson.status==="ACTIVE"&&lesson.visibleToStudents&&
              lesson.pathStatus==="PUBLISHED"&&lesson.offeringStatus==="ACTIVE";
            const lessonName=lesson.name?.trim()||"Untitled lesson";
            return <tr key={lesson.id} className="align-top hover:bg-[var(--lms-primary-subtle)]">
              <td className="max-w-[260px] p-3">
                <p className="break-words font-semibold text-foreground">{lessonName}</p>
                <details className="mt-1 text-xs text-muted-foreground">
                  <summary className="cursor-pointer text-primary-text underline">Details</summary>
                  <p className="mt-2">{lesson.cohortName} · {lesson.periodName}</p>
                  <p>{lesson.publishedContentCount} published / {lesson.contentCount} authored records</p>
                  <p>Learning path: {lesson.pathStatus} · Offering: {lesson.offeringStatus}</p>
                </details>
              </td>
              <td className="max-w-[220px] break-words p-3">
                {lesson.courseName?.trim()||"Course name unavailable"}{" "}
                <span className="text-xs text-muted-foreground">({lesson.courseCode})</span>
              </td>
              <td className="p-3 font-semibold">{(data.query.page-1)*pageSize+index+1}</td>
              <td className="p-3">
                <StatusBadge tone={visible?"success":"neutral"}>{visible?"Visible":"Hidden"}</StatusBadge>
              </td>
              <td className="min-w-[195px] p-3">
                {lesson.status==="ACTIVE"?<div className="flex flex-wrap items-center gap-2">
                  <LessonActions lesson={{id:lesson.id,name:lessonName,
                    description:lesson.description,sequence:lesson.sequence}}/>
                  <details className="w-full">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center font-semibold text-primary-text underline md:min-h-9">
                      More actions
                    </summary>
                    <div className="mt-2 flex flex-col items-start gap-2">
                      <CollegeLessonVisibilityControl lesson={{id:lesson.id,name:lessonName,
                        visibleToStudents:lesson.visibleToStudents,updatedAt:lesson.updatedAt.toISOString()}}/>
                      {allRowsOfOnePath?<CollegeLessonReorderActions learningPathId={lesson.learningPathId}
                        lessonId={lesson.id} expectedSequence={lesson.sequence}
                        canMoveUp={listedLessons.some(other=>
                          other.learningPathId===lesson.learningPathId&&other.sequence===lesson.sequence-1)}
                        canMoveDown={listedLessons.some(other=>
                          other.learningPathId===lesson.learningPathId&&other.sequence===lesson.sequence+1)}/>:null}
                      <Link href={"/admin/courses/offerings/"+encodeURIComponent(lesson.offeringId)}
                        className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
                        Open offering
                      </Link>
                    </div>
                  </details>
                </div>:<p className="text-xs text-muted-foreground">
                  Archived lesson retained. Restoration requires an authorized workflow.
                </p>}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
    </div>:<div className="mt-4 border border-border p-6 text-sm text-muted-foreground">
      {!hasCourseSelection?"Choose a course, or opt in to all-courses view.":
        data.query.q?"No matching lessons. Clear search to see the course.":
        data.query.courseCode?"No lessons in this course yet. Create one on the left.":
        "No lessons found"}
      {data.query.q?<Link href={selectedScopeHref({...data.query,q:"",page:1})}
        className="ml-2 font-semibold text-primary-text underline">Clear search</Link>:null}
    </div>}
    <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>Page {data.query.page} of {data.totalPages} · {pageSize} per page</span>
        <form className="flex items-center gap-2">
          <input type="hidden" name="q" value={data.query.q}/>
          <input type="hidden" name="status" value={data.query.status}/>
          {data.query.courseCode?<input type="hidden" name="courseCode" value={data.query.courseCode}/>:null}
          {data.query.cohortCode?<input type="hidden" name="cohortCode" value={data.query.cohortCode}/>:null}
          {allCourses?<input type="hidden" name="allCourses" value="true"/>:null}
          <label htmlFor="lessons-page-size" className="font-semibold">Rows per page</label>
          <Select id="lessons-page-size" name="pageSize" defaultValue={String(pageSize)}
            className="min-h-11 md:min-h-9">
            {[10,25,50,100].map(size=><option key={size} value={String(size)}>{size}</option>)}
          </Select>
          <Button type="submit" variant="secondary" className="min-h-11 md:min-h-9">Apply</Button>
        </form>
      </div>
      {hasCourseSelection?<Pagination page={data.query.page} pageCount={data.totalPages}
        hrefForPage={page=>selectedScopeHref({...data.query,page})}
        label="Lesson pages" showBoundaryLinks={false}/>:null}
    </div>
    <Link href="/admin/courses" className="mt-4 inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text hover:text-[var(--lms-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">← Courses</Link>
      </section>
    </div>
  </div>;
}
