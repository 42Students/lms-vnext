import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import {getSuperAdminLearningFilterOptions} from "@/modules/admin-ui/super-admin-learning-filter-options-service";
import {SuperAdminLearningFilterFields} from "@/components/admin/super-admin-learning-filter-fields";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { listCollegeCourseProgress } from "@/modules/courses/college-learning-directory-service";
import { adminLearningHref, adminProgressStats } from "@/modules/courses/admin-learning-read-model";
import {parseSuperAdminLearningQuery} from "@/modules/admin-ui/super-admin-learning-query-model";

export default async function SuperAdminCourseProgressPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const raw = await searchParams;
  const parsed = parseSuperAdminLearningQuery(raw);
  if (!parsed.success) return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Course Progress" />
    <ErrorState title="Invalid course progress filters" description="Search, status or page is invalid."
      action={<Link href="/admin/course-progress" className="font-semibold text-[var(--lms-teal-deep)]">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  if (!context.adminScope?.collegeId) return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Course Progress" />
    <EmptyState title="Select a college to continue" description="Choose a college in the header above to see its course progress." />
  </div>;
  const [dataResult,filtersResult]=await Promise.allSettled([
    listCollegeCourseProgress(context,parsed.data),
    getSuperAdminLearningFilterOptions(context),
  ]);
  if(dataResult.status==="rejected")return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Course Progress" />
    <ErrorState title="Course progress unavailable"
      description="The selected college course progress could not be loaded. Your filters have not changed."
      action={<Link href={adminLearningHref("PROGRESS",parsed.data)}
        className="font-semibold text-[var(--lms-teal-deep)]">Retry loading course progress</Link>} />
  </div>;
  const data=dataResult.value;
  const filters=filtersResult.status==="fulfilled"?filtersResult.value:{courses:[],cohorts:[]};
  const summary = adminProgressStats(data.items);
  return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Courses" title="Course Progress"
      description="Read-only recorded learner content activity by offering. This is not a completion rate, attendance summary, or count of eligible learners." />
    <p className="rounded-md border border-border bg-surface p-3 text-sm text-body">
      Progress counts videos watched to the end, assignments submitted and quizzes attempted. Resources are not counted toward completion. Recorded progress is not a substitute for attendance or assessed achievement.
    </p>
    <a href={"/api/admin/course-progress/export?"+new URLSearchParams({q:data.query.q,status:data.query.status,...(data.query.courseCode?{courseCode:data.query.courseCode}:{}),...(data.query.cohortCode?{cohortCode:data.query.cohortCode}:{})}).toString()}
     className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">Export course-progress.csv</a>
    <form className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5">
      <label className="grid gap-1 text-sm font-semibold text-body">Course or cohort
        <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}
          className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-body">Offering status
        <Select name="status" defaultValue={data.query.status} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
          <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
        </Select>
      </label>
      <SuperAdminLearningFilterFields courses={filters.courses} cohorts={filters.cohorts} selectedCourse={data.query.courseCode} selectedCohort={data.query.cohortCode}/>
      <Button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 font-semibold text-foreground">Filter</Button>
    </form>
    {filtersResult.status==="rejected"?<p role="status"
      className="rounded-lg border border-warning-border bg-warning-subtle p-3 text-sm text-body">
      Course and cohort filter choices are temporarily unavailable. Your selected filters are still applied.
    </p>:null}
    <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--lms-teal-deep)]" href="/admin/course-progress">Clear filters</Link>
    <p className="text-sm text-muted-foreground">
      {data.total} matching offerings · on this page: {summary.contentRecords} recorded content progress rows,
      {" "}{summary.completedContentRecords} completed rows. Learner counts are per-offering, not additive.
    </p>
    {data.items.length ? <div className="grid gap-3 md:grid-cols-2">
      {data.items.map(item => <article key={item.offeringId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="m-0 break-words font-semibold text-foreground">{item.courseName} ({item.courseCode})</h2>
          <StatusBadge tone={item.offeringStatus === "ACTIVE" ? "success" : "neutral"}>{item.offeringStatus}</StatusBadge>
        </div>
        <p className="mt-1 text-sm text-body">{item.cohortName} · {item.periodName}</p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-body">
          <div><dt className="text-xs text-muted-foreground">Recorded content rows</dt><dd className="text-lg font-semibold tabular-nums">{item.recordedRows}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Completed content rows</dt><dd className="text-lg font-semibold tabular-nums">{item.completedRows}</dd></div>
          <div className="col-span-2"><dt className="text-xs text-muted-foreground">Learners with recorded activity</dt><dd className="text-lg font-semibold tabular-nums">{item.learnersWithRecords}</dd></div>
        </dl>
        <Link href={`/admin/courses/offerings/${encodeURIComponent(item.offeringId)}`}
          className="mt-3 inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">
          Open offering →
        </Link>
        <Link href={`/admin/course-progress/students?offeringId=${encodeURIComponent(item.offeringId)}`}
         className="ml-3 mt-3 inline-flex min-h-11 items-center rounded-md border border-border px-3 text-sm font-semibold text-[var(--lms-teal-deep)]">
          View student progress →
        </Link>
      </article>)}
    </div> : <EmptyState title="No recorded course progress" description="No course offerings match these filters. The absence of records is not proof of incomplete student work." />}
    <nav aria-label="Course progress pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
      <div className="flex gap-2">
        {data.query.page > 1 ? <Link href={adminLearningHref("PROGRESS", { ...data.query, page: data.query.page - 1 })}
          className="rounded-md border border-border px-4 py-2 font-semibold text-[var(--lms-teal-deep)]">Previous</Link> : null}
        {data.query.page < data.totalPages ? <Link href={adminLearningHref("PROGRESS", { ...data.query, page: data.query.page + 1 })}
          className="rounded-md border border-border px-4 py-2 font-semibold text-[var(--lms-teal-deep)]">Next</Link> : null}
      </div>
    </nav>
    <Link href="/admin/courses" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)]">← Courses</Link>
  </div>;
}
