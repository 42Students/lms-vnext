import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";
import {SuperAdminLearningFilterFields} from "@/components/admin/super-admin-learning-filter-fields";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { PageBackLink } from "@/components/ui/page-back-link";
import { Disclosure } from "@/components/ui/disclosure";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Pagination } from "@/components/ui/pagination";
import { listCollegeCourseProgress } from "@/modules/courses/college-learning-directory-service";
import { adminLearningHref, adminProgressStats } from "@/modules/courses/admin-learning-read-model";
import {parseSuperAdminCourseProgressParams} from "@/modules/courses/super-admin-course-progress-query";
import {requirePermission} from "@/modules/permissions/policy";

export default async function SuperAdminCourseProgressPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const context = await getCurrentRequestContext();
  requirePermission(context,"admin-scope.select");
  const parsed = parseSuperAdminCourseProgressParams(await searchParams);
  if (!parsed) return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title="Course Progress" />
    <ErrorState title="Invalid course progress filters" description="Search, status or page is invalid."
      action={<Link href="/admin/course-progress" className="inline-flex min-h-11 items-center font-[650] text-primary-text hover:text-primary-hover md:min-h-9 hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-6">
    <PageHeader title="Course Progress" />
    <Alert tone="warning" role="status">Select a college to view course progress.</Alert>
  </div>;
  const [dataResult,filtersResult] = await Promise.allSettled([
    listCollegeCourseProgress(context, parsed),
    getSuperAdminLearningFilterOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-6">
    <PageHeader title="Course Progress"/>
    <ErrorState title="Couldn't refresh course progress"
      description="The selected college's progress report could not be loaded. Your current filters are preserved; no stale student data is shown."
      action={<Link href={adminLearningHref("PROGRESS",parsed)}
        className="font-semibold text-primary-text underline">Retry course progress</Link>}/>
  </div>;
  const data=dataResult.value;
  const filters=filtersResult.status==="fulfilled"?filtersResult.value:{courses:[],cohorts:[]};
  const summary = adminProgressStats(data.items);
  const selected=Boolean(data.query.courseCode&&data.query.cohortCode);
  const selectedNames={
    course:filters.courses.find(item=>item.code===data.query.courseCode)?.name??data.query.courseCode,
    batch:filters.cohorts.find(item=>item.code===data.query.cohortCode)?.name??data.query.cohortCode,
  };
  const uniqueLearnerCount=data.items.reduce((value,item)=>value+item.learnersWithRecords,0);
  // Offering counts are not per-student completion percentages. The existing
  // authorized offering detail route remains the source of measured reports.
  const exportHref="/api/admin/course-progress/export?"+new URLSearchParams({
   q:data.query.q,status:data.query.status,
   ...(data.query.courseCode?{courseCode:data.query.courseCode}:{}),
   ...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{}),
  }).toString();
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Course Progress"
      description="See measured completion for a class and course, then focus on the students furthest behind."
      actions={<PageBackLink href="/admin/courses" label="Courses" />}
    />
    <Alert tone="info">
      <strong>Measured work only.</strong> Progress counts videos watched to the end, assignments submitted and quizzes attempted.
      Resources are not counted, because they are marked done by the student&apos;s own click.
    </Alert>
    <p className="text-xs text-muted-foreground">The offering directory below is based on recorded content rows; a learner completion percentage is available only in the authorized per-student report.</p>
    
    <form method="get" action="/admin/course-progress" role="search" aria-label="Select class and course progress"
      className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-5">
      <h2 className="text-base font-semibold text-[var(--lms-heading)]">Choose a class, then one of its courses.</h2>
      <p className="text-xs text-muted-foreground">Class sections are represented by their active batch in this directory. Use the offering detail for authorized class-level learner completion.</p>
      <div className="grid min-w-0 items-end gap-3 min-[768px]:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
        <SuperAdminLearningFilterFields courses={filters.courses} cohorts={filters.cohorts}
          selectedCourse={data.query.courseCode} selectedCohort={data.query.cohortCode}/>
        <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9">
          <span aria-hidden="true" className="mr-2">↻</span> Refresh
        </Button>
        {selected&&data.items.length>0?<a href={exportHref}
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle md:min-h-9">Export CSV</a>:
         <span aria-disabled="true" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-muted px-4 text-sm text-muted-foreground md:min-h-9">Export CSV</span>}
      </div>
      <details className="border-t border-border pt-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text">More filters</summary>
        <div className="grid gap-3 pt-2 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">Search offering
            <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}/>
          </label>
          <label className="grid gap-2 text-sm">Offering status
            <Select name="status" defaultValue={data.query.status}>
             <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
            </Select>
          </label>
        </div>
      </details>
    </form>
    {filtersResult.status==="rejected"?<Alert tone="warning">
      Some course-progress filters could not be loaded. Your saved filters still apply to the visible offerings.{" "}
      <Link href={adminLearningHref("PROGRESS",data.query)} className="font-semibold text-primary-text underline">Retry filter choices</Link>.
    </Alert>:null}
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:underline" href="/admin/course-progress">Clear filters</Link>
    {selected?<div className="space-y-3">
      <p className="text-sm font-semibold text-[var(--lms-heading)]">Selected batch: {selectedNames.batch} · Course: {selectedNames.course}</p>
      <dl className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        {[
          {label:"Offerings",value:data.items.length},
          {label:"Recorded content rows",value:summary.contentRecords},
          {label:"Completed content rows",value:summary.completedContentRecords},
          {label:"Learners with records",value:uniqueLearnerCount},
        ].map(stat=><div key={stat.label} className="rounded-[var(--lms-canvas-radius)] border border-border p-4">
          <dt className="text-xs text-muted-foreground">{stat.label}</dt>
          <dd className="mt-2 text-xl font-semibold tabular-nums">{stat.value}</dd>
        </div>)}
      </dl>
      <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Per student</h2>
      <p className="text-sm text-body">Open the authorized offering report to see the learners furthest behind. Retakes count only the current enrolled attempt.</p>
    </div>:<EmptyState title="Pick a class, then one of its courses." description="Choose a batch and a taught course to see recorded activity. No learner report has been requested."/>}
    <p role="status" className="text-sm text-muted-foreground">
      {data.total.toLocaleString("en-IN")} matching offerings · on this page: {summary.contentRecords} recorded content progress rows,
      {" "}{summary.completedContentRecords} completed rows. Learner counts are per-offering, not additive.
    </p>
    {selected&&data.items.length ? <div className="divide-y divide-border border-y border-border">
      {data.items.map(item => <article key={item.offeringId} className="min-w-0 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">{item.courseName} ({item.courseCode})</h2>
          <StatusBadge tone={item.offeringStatus === "ACTIVE" ? "success" : "neutral"}>{item.offeringStatus}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{item.cohortName} · {item.periodName}</p>
        <dl className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] text-sm text-body">
          <div><dt className="text-xs text-muted-foreground">Recorded content rows</dt><dd className="text-lg font-semibold tabular-nums">{item.recordedRows}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Completed content rows</dt><dd className="text-lg font-semibold tabular-nums">{item.completedRows}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-muted-foreground">Learners with recorded activity</dt><dd className="text-lg font-semibold tabular-nums">{item.learnersWithRecords}</dd></div>
        </dl>
        <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}`}
          className="mt-3 inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:bg-primary-subtle underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)]">
          Open offering →
        </Link>
        <Link href={`/admin/course-progress/students?offeringId=${encodeURIComponent(item.offeringId)}`}
         className="ml-3 mt-3 inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:bg-primary-subtle hover:border-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)]">
          View student progress →
        </Link>
      </article>)}
    </div> : selected?<EmptyState title="No recorded course progress" description="No course offerings match these filters. The absence of records is not proof of incomplete student work." />:null}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <Pagination page={data.query.page} pageCount={data.totalPages}
        hrefForPage={page=>adminLearningHref("PROGRESS",{...data.query,page})}
        label="Course progress pages" showBoundaryLinks={false}/>

    </div>
  </div>;
}
