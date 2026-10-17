import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="College Admin · Faculty" title={data.person.name}
      description="College-scoped teaching record. These are assignment counts, not teaching hours or a complete workload measure."
      actions={<div className="flex flex-wrap gap-3">
        <Link href={`/college/activity?subjectType=college_membership&subjectId=${encodeURIComponent(membershipId)}`}
          className="text-sm font-semibold text-primary-text">Lifecycle audit</Link>
        <CollegeFacultyScheduleReassign membershipId={membershipId} name={data.person.name}/>
        <Link href="/college/faculty" className="text-sm font-semibold text-primary-text">Back to faculty</Link>
      </div>} />
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Faculty record</h2>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Title</dt><dd>{data.person.academicTitle ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Department</dt><dd>{data.person.departmentName ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Employment type</dt><dd>{data.person.employmentType ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Membership</dt><dd>{data.person.status}</dd></div>
      </dl>
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Persisted teaching assignments</h2>
      <form method="get" className="mt-3 flex flex-wrap items-end gap-3"
        action={`/college/faculty/${encodeURIComponent(membershipId)}`}>
        <label className="grid gap-2 text-sm font-semibold text-body">
          Assignment history
          <select name="status" defaultValue={data.filter.status}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All assignments</option>
            <option value="ACTIVE">Active only</option>
            <option value="ENDED">Ended only</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-body">
          Teaching role
          <select name="role" defaultValue={data.filter.role}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="ALL">All teaching roles</option>
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-teacher</option>
            <option value="TA">Teaching assistant</option>
          </select>
        </label>
        <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
      </form>
      <p className="mt-2 text-sm text-body">{data.counts.totalAssignments} total assignments ·
        {" "}{data.counts.activeAssignments} active ·
        {" "}{data.counts.distinctOfferings} distinct course offerings
      </p>
      {data.assignments.length === 0
        ? <p className="mt-4 text-sm text-muted-foreground">No college-scoped teaching assignments recorded.</p>
        : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[42rem] text-left text-sm">
          <thead className="bg-muted"><tr>
            <th scope="col" className="p-3">Course</th>
            <th scope="col" className="p-3">Class / cohort</th>
            <th scope="col" className="p-3">Role</th>
            <th scope="col" className="p-3">Status</th>
          </tr></thead>
          <tbody>{data.assignments.map(item => <tr key={item.id} className="border-t border-border">
            <td className="p-3"><Link href={`/college/courses/offerings/${item.offeringId}`}
              className="font-semibold text-primary-text hover:underline">
              {item.courseName} ({item.courseCode})
            </Link></td>
            <td className="p-3">{item.sectionName} · {item.cohortName} · {item.periodName}</td>
            <td className="p-3">{item.role}</td>
            <td className="p-3">{item.status}</td>
          </tr>)}</tbody>
        </table></div>}
      {data.truncated ? <p className="mt-3 text-sm text-muted-foreground">
        Showing the first 100 matching assignment rows; summary totals include all assignment states.
      </p> : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Assignment history includes ended deliveries. Hours, session duration and schedule conflicts are not inferred.
      </p>
    </section>
  </div>;
}
