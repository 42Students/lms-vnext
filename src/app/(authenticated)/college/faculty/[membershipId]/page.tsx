import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { getCollegeFacultyDetail } from "@/modules/people/college-faculty-detail-service";
import { CollegePersonNotFoundError } from "@/modules/people/college-person-detail-model";
import {CollegeFacultyScheduleReassign} from "@/components/college/college-faculty-schedule-reassign";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

export default async function CollegeFacultyDetailPage({ params, searchParams }: {
  params: Promise<{ membershipId: string }>;
  searchParams: Promise<{status?:string|string[];role?:string|string[];page?:string|string[];pageSize?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const { membershipId } = await params;
  const query=await searchParams;
  const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v;
  let data: Awaited<ReturnType<typeof getCollegeFacultyDetail>>;
  try {
    data = await getCollegeFacultyDetail(context, membershipId, {status:first(query.status)??"ALL",role:first(query.role)??"ALL",page:first(query.page)??1,pageSize:first(query.pageSize)??25});
  } catch (error) {
    if (error instanceof CollegePersonNotFoundError) notFound();
    throw error;
  }
  return <div className="min-w-0 max-w-full space-y-4">
    <PageHeader title={data.person.name}
      actions={<div className="flex w-full min-w-0 items-center gap-2 md:w-auto">
        <PageBackLink href="/college/faculty" label="Back to faculty"/>
        <div className="min-w-0 flex-1 md:flex-none">
          <CollegeFacultyScheduleReassign membershipId={membershipId} name={data.person.name}/>
        </div>
      </div>} />
    <section className="min-w-0 border-b border-border pb-4">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold leading-6 text-[var(--lms-heading)]">Faculty record</h2>
        <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Lifecycle audit</Link>
      </div>
      <dl className="mt-4 grid min-w-0 gap-x-6 gap-y-3 text-sm md:grid-cols-2 [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:font-medium [&_dd]:text-foreground">
        <div><dt className="text-muted-foreground">Title</dt><dd>{data.person.academicTitle ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Department</dt><dd>{data.person.departmentName ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Employment type</dt><dd>{data.person.employmentType ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Membership</dt><dd><StatusBadge tone={data.person.status==="ACTIVE"?"success":"warning"}>{data.person.status}</StatusBadge></dd></div>
      </dl>
    </section>
    <section className="min-w-0 border-b border-border pb-4">
      <h2 className="font-semibold text-foreground">Faculty teaching assignments</h2>
      <p className="mt-3 text-sm text-body">{data.counts.totalAssignments} total assignments ·
        {" "}{data.counts.activeAssignments} active ·
        {" "}{data.counts.distinctOfferings} distinct course offerings ·
        {" "}{data.counts.distinctCourses} courses ·
        {" "}{data.counts.distinctClasses} classes ·
        {" "}{data.counts.distinctPrograms} programs
      </p>
      <p className="mt-2 max-w-2xl text-xs text-muted-foreground">College-scoped teaching record. These are assignment counts, not teaching hours or a complete workload measure.</p>
      <details className="mt-4 min-w-0 border-y border-border py-2" open={data.filter.status!=="ALL"||data.filter.role!=="ALL"}>
        <summary className="min-h-11 cursor-pointer py-2.5 font-semibold text-primary-text hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 md:py-2">Filter</summary>
        <form method="get" className="mt-3 grid min-w-0 grid-cols-1 items-end gap-3 md:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]"
          action={`/college/faculty/${encodeURIComponent(membershipId)}`}>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:w-full">
          Assignment history
          <Select name="status" defaultValue={data.filter.status}
            >
            <option value="ALL">All assignments</option>
            <option value="ACTIVE">Active only</option>
            <option value="ENDED">Ended only</option>
          </Select>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] max-[767px]:w-full">
          Teaching role
          <Select name="role" defaultValue={data.filter.role}
            >
            <option value="ALL">All teaching roles</option>
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-Teacher</option>
            <option value="TA">Teaching Assistant</option>
          </Select>
        </label>
          <label className="grid min-w-0 gap-1 text-[13px] font-semibold">
            Rows
            <Select name="pageSize" defaultValue={String(data.pagination.pageSize)}>
              {[10,25,50,100,200].map(size=><option key={size} value={size}>{size}</option>)}
            </Select>
          </label>
          <Button type="submit" className="min-h-11 w-full md:col-span-2 md:min-h-9 min-[992px]:col-span-1 min-[992px]:w-auto">Filter</Button>
        </form>
      </details>
      <div className="mt-4 min-w-0">
        {data.assignments.length === 0
        ? <EmptyState title="No teaching assignments" description="No college-scoped teaching assignments recorded."
            action={data.filter.status!=="ALL"||data.filter.role!=="ALL" ?
              <Link href={`/college/faculty/${encodeURIComponent(membershipId)}`}
                className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">All assignments</Link>
              : null}/>
        : <DataTable
            caption="Persisted teaching assignments"
            rows={data.assignments}
            getRowKey={item => item.id}
            empty={<EmptyState title="No teaching assignments" description="No college-scoped teaching assignments recorded."/>}
            columns={[
              { key: "course", header: "Course", mobilePriority: "primary",
                cell: item => <Link href={`/college/courses/offerings/${encodeURIComponent(item.offeringId)}`}
                  className="font-semibold text-link hover:underline active:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] underline-offset-4">
                  {item.courseName} ({item.courseCode})
                </Link> },
              { key: "class", header: "Class / cohort", mobilePriority: "secondary",
                cell: item => item.sectionName + " · " + item.cohortName + " · " + item.periodName },
              { key: "role", header: "Role", mobilePriority: "secondary", cell: item => item.role },
              { key: "status", header: "Status", mobilePriority: "secondary", cell: item => <StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>{item.status}</StatusBadge> },
            ]}
          />}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>{data.pagination.total===0?0:(data.pagination.page-1)*data.pagination.pageSize+1}–{Math.min(data.pagination.total,data.pagination.page*data.pagination.pageSize)} of {data.pagination.total} teaching assignments</span>
        <nav aria-label="Teaching assignment history pages" className="flex flex-wrap gap-3">
          {data.pagination.page>1?<Link className="font-semibold text-link underline" href={`?status=${data.filter.status}&role=${data.filter.role}&pageSize=${data.pagination.pageSize}&page=${data.pagination.page-1}`}>Previous</Link>:null}
          <span>Page {data.pagination.page} of {Math.max(1,data.pagination.totalPages)}</span>
          {data.pagination.page<data.pagination.totalPages?<Link className="font-semibold text-link underline" href={`?status=${data.filter.status}&role=${data.filter.role}&pageSize=${data.pagination.pageSize}&page=${data.pagination.page+1}`}>Next</Link>:null}
        </nav>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Assignment history includes ended deliveries. Hours, session duration and schedule conflicts are not inferred.
      </p>
    </section>
  </div>;
}
