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
  searchParams: Promise<{status?:string|string[];role?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const { membershipId } = await params;
  const query=await searchParams;
  let data: Awaited<ReturnType<typeof getCollegeFacultyDetail>>;
  try {
    data = await getCollegeFacultyDetail(context, membershipId, {status:query.status ?? "ALL",role:query.role ?? "ALL"});
  } catch (error) {
    if (error instanceof CollegePersonNotFoundError) notFound();
    throw error;
  }
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader title={data.person.name}
      description="College-scoped teaching record. These are assignment counts, not teaching hours or a complete workload measure."
      actions={<div className="flex flex-wrap gap-3">
        <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
          className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 md:min-h-9">Lifecycle audit</Link>
        <CollegeFacultyScheduleReassign membershipId={membershipId} name={data.person.name}/>
        <PageBackLink href="/college/faculty" label="Back to faculty"/>
      </div>} />
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Faculty record</h2>
      <dl className="mt-4 grid min-w-0 gap-4 text-sm md:grid-cols-2">
        <div><dt className="text-muted-foreground">Title</dt><dd>{data.person.academicTitle ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Department</dt><dd>{data.person.departmentName ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Employment type</dt><dd>{data.person.employmentType ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Membership</dt><dd><StatusBadge tone={data.person.status==="ACTIVE"?"success":"warning"}>{data.person.status}</StatusBadge></dd></div>
      </dl>
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Faculty teaching assignments</h2>
      <form method="get" className="mt-3 flex flex-wrap items-end gap-3"
        action={`/college/faculty/${encodeURIComponent(membershipId)}`}>
        <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Assignment history
          <Select name="status" defaultValue={data.filter.status}
            >
            <option value="ALL">All assignments</option>
            <option value="ACTIVE">Active only</option>
            <option value="ENDED">Ended only</option>
          </Select>
        </label>
        <label className="grid gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          Teaching role
          <Select name="role" defaultValue={data.filter.role}
            >
            <option value="ALL">All teaching roles</option>
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-teacher</option>
            <option value="TA">Teaching assistant</option>
          </Select>
        </label>
        <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
      </form>
      <p className="mt-2 text-sm text-body">{data.counts.totalAssignments} total assignments ·
        {" "}{data.counts.activeAssignments} active ·
        {" "}{data.counts.distinctOfferings} distinct course offerings
      </p>
      {data.assignments.length === 0
        ? <EmptyState title="No teaching assignments" description="No college-scoped teaching assignments recorded."/>
        : <div className="mt-4">
          <DataTable
            caption="Persisted teaching assignments"
            rows={data.assignments}
            getRowKey={item => item.id}
            empty={<EmptyState title="No teaching assignments" description="No college-scoped teaching assignments recorded."/>}
            columns={[
              { key: "course", header: "Course", mobilePriority: "primary",
                cell: item => <Link href={`/college/courses/offerings/${encodeURIComponent(item.offeringId)}`}
                  className="font-semibold text-link hover:underline">
                  {item.courseName} ({item.courseCode})
                </Link> },
              { key: "class", header: "Class / cohort", mobilePriority: "secondary",
                cell: item => item.sectionName + " · " + item.cohortName + " · " + item.periodName },
              { key: "role", header: "Role", mobilePriority: "secondary", cell: item => item.role },
              { key: "status", header: "Status", mobilePriority: "secondary", cell: item => <StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>{item.status}</StatusBadge> },
            ]}
          />
        </div>}
      {data.truncated ? <p className="mt-3 text-sm text-muted-foreground">
        Showing the first 100 matching assignment rows; summary totals include all assignment states.
      </p> : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Assignment history includes ended deliveries. Hours, session duration and schedule conflicts are not inferred.
      </p>
    </section>
  </div>;
}
