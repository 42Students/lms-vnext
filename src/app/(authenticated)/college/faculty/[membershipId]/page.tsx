import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { getCollegeFacultyDetail } from "@/modules/people/college-faculty-detail-service";
import { CollegePersonNotFoundError } from "@/modules/people/college-person-detail-model";
import {CollegeFacultyScheduleReassign} from "@/components/college/college-faculty-schedule-reassign";

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
  return <div className="min-w-0 overflow-x-clip space-y-6">
    <PageHeader eyebrow="College Admin · Faculty" title={data.person.name}
      description="College-scoped teaching record. These are assignment counts, not teaching hours or a complete workload measure."
      actions={<div className="flex flex-wrap gap-3">
        <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
          className="text-sm font-semibold text-link">Lifecycle audit</Link>
        <CollegeFacultyScheduleReassign membershipId={membershipId} name={data.person.name}/>
        <Link href="/college/faculty" className="text-sm font-semibold text-link lms-inline-link">Back to faculty</Link>
      </div>} />
    <section className="border-t border-border pt-5">
      <h2 className="font-semibold text-foreground">Faculty record</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Title</dt><dd>{data.person.academicTitle ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Department</dt><dd>{data.person.departmentName ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Employment type</dt><dd>{data.person.employmentType ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Membership</dt><dd>{data.person.status}</dd></div>
      </dl>
    </section>
    <section className="border-t border-border pt-5">
      <h2 className="font-semibold text-foreground">Faculty teaching assignments</h2>
      <form method="get" className="mt-3 flex flex-wrap items-end gap-3"
        action={`/college/faculty/${encodeURIComponent(membershipId)}`}>
        <label className="grid gap-2 text-sm font-semibold text-body">
          Assignment history
          <select name="status" defaultValue={data.filter.status}
            className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All assignments</option>
            <option value="ACTIVE">Active only</option>
            <option value="ENDED">Ended only</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-body">
          Teaching role
          <select name="role" defaultValue={data.filter.role}
            className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All teaching roles</option>
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-teacher</option>
            <option value="TA">Teaching assistant</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
      </form>
      <p className="mt-2 text-sm text-body">{data.counts.totalAssignments} total assignments ·
        {" "}{data.counts.activeAssignments} active ·
        {" "}{data.counts.distinctOfferings} distinct course offerings
      </p>
      {data.assignments.length === 0
        ? <p className="mt-4 text-sm text-muted-foreground">No college-scoped teaching assignments recorded.</p>
        : <div className="mt-4">
          <DataTable
            caption="Persisted teaching assignments"
            rows={data.assignments}
            getRowKey={item => item.id}
            empty={<p className="text-sm text-muted-foreground">No college-scoped teaching assignments recorded.</p>}
            columns={[
              { key: "course", header: "Course", mobilePriority: "primary",
                cell: item => <Link href={`/college/courses/offerings/${encodeURIComponent(item.offeringId)}`}
                  className="font-semibold text-link hover:underline">
                  {item.courseName} ({item.courseCode})
                </Link> },
              { key: "class", header: "Class / cohort", mobilePriority: "secondary",
                cell: item => item.sectionName + " · " + item.cohortName + " · " + item.periodName },
              { key: "role", header: "Role", mobilePriority: "secondary", cell: item => item.role },
              { key: "status", header: "Status", mobilePriority: "secondary", cell: item => item.status },
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
