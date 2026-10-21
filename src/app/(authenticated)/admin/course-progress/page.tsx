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
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its course progress." />
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
  return <div className="min-w-0 space-y-6">
    <PageHeader title="Course Progress"
      description="View course progress by class and course. Select an offering below to see its learner progress report; this directory shows recorded content activity, not a measured completion rate."
      actions={<PageBackLink href="/admin/courses" label="Courses" />}
    />
    <Alert tone="info">
      Progress counts videos watched to the end, assignments submitted and quizzes attempted. Resources are not counted toward completion. Recorded progress is not a substitute for attendance or assessed achievement.
      Select a course offering, then choose View student progress for the individual learner report. A complete class/course measured-completion report requires verified teaching assignments and completion denominators.
    </Alert>
    
    <form className="grid min-w-0 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] min-[768px]:grid-cols-2 min-[1200px]:grid-cols-[minmax(0,1fr)_auto]">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course or cohort
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}
          className="min-h-11 md:min-h-9" />
      </label>
      <Disclosure title="More filters" className="min-w-0 order-last min-[768px]:col-span-2"
        contentClassName="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-3)] min-[768px]:grid-cols-2">
      <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Offering status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </label>
      <SuperAdminLearningFilterFields courses={filters.courses} cohorts={filters.cohorts} selectedCourse={data.query.courseCode} selectedCohort={data.query.cohortCode}/>
      </Disclosure>
      <Button type="submit" className="min-h-11 w-full self-end md:min-h-9 md:w-auto">Filter</Button>
    </form>
    {filtersResult.status==="rejected"?<Alert tone="warning">
      Some course-progress filters could not be loaded. Your saved filters still apply to the visible offerings.{" "}
      <Link href={adminLearningHref("PROGRESS",data.query)} className="font-semibold text-primary-text underline">Retry filter choices</Link>.
    </Alert>:null}
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:underline" href="/admin/course-progress">Clear filters</Link>
    <p role="status" className="text-sm text-muted-foreground">
      {data.total.toLocaleString("en-IN")} matching offerings · on this page: {summary.contentRecords} recorded content progress rows,
      {" "}{summary.completedContentRecords} completed rows. Learner counts are per-offering, not additive.
    </p>
    {data.items.length ? <div className="divide-y divide-border border-y border-border">
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
    </div> : <EmptyState title="No recorded course progress" description="No course offerings match these filters. The absence of records is not proof of incomplete student work." />}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <Pagination page={data.query.page} pageCount={data.totalPages}
        hrefForPage={page=>adminLearningHref("PROGRESS",{...data.query,page})}
        label="Course progress pages" showBoundaryLinks={false}/>
      <div className="flex min-w-0 justify-start print:hidden">
        <a href={"/api/admin/course-progress/export?"+new URLSearchParams({q:data.query.q,status:data.query.status,...(data.query.courseCode?{courseCode:data.query.courseCode}:{}),...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{})}).toString()}
     className="inline-flex min-h-11 min-[768px]:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-white px-4 text-[14px] font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:bg-[var(--lms-primary-subtle)]">Export offering progress (course-progress.csv)</a>
      </div>
    </div>
  </div>;
}
