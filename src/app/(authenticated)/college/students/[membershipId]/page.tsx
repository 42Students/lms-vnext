import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCollegeStudentDetail } from "@/modules/people/college-student-detail-service";
import { CollegePersonNotFoundError } from "@/modules/people/college-person-detail-model";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

export default async function CollegeStudentDetailPage({ params, searchParams }: {
  params: Promise<{ membershipId: string }>;
  searchParams: Promise<{status?:string|string[]}>;
}) {
  const context = await getCurrentRequestContext();
  const { membershipId } = await params;
  const query=await searchParams;
  let data: Awaited<ReturnType<typeof getCollegeStudentDetail>>;
  try {
    data = await getCollegeStudentDetail(context, membershipId, {status:query.status ?? "ALL"});
  } catch (error) {
    if (error instanceof CollegePersonNotFoundError) notFound();
    throw error;
  }
  return <div className="space-y-6">
    <PageHeader title={data.person.name}
      description="Read-only college-owned learner academic record; private identity and documents are excluded."
      actions={<PageBackLink href="/college/students" label="Back to students"/>} />
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Student record</h2>
      <dl className="mt-4 grid min-w-0 gap-3 text-sm md:grid-cols-2">
        <div><dt className="text-muted-foreground">Roll number</dt><dd>{data.person.rollNumber ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Registration number</dt><dd>{data.person.registrationNumber ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Membership</dt><dd><StatusBadge tone={data.person.status==="ACTIVE"?"success":"warning"}>{data.person.status}</StatusBadge></dd></div>
      </dl>
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Program and batch enrollments</h2>
      <form method="get" role="search" aria-label="Enrollment lifecycle filter" className="mt-3 flex min-w-0 flex-wrap items-end gap-3"
        action={`/college/students/${encodeURIComponent(membershipId)}`}>
        <label className="grid w-full min-w-0 basis-full gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:w-[220px] md:basis-auto">
          Enrollment lifecycle
          <Select name="status" defaultValue={data.filter.status}
            >
            <option value="ALL">All enrollments</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">{data.enrollmentTotal} total persisted enrollment(s), including other lifecycle statuses.</p>
      {data.enrollments.length === 0 ? <EmptyState title="No matching enrollments" description="No program enrollment matches the selected lifecycle status."/> :
        <ul className="mt-3 divide-y divide-border border-y border-border">{data.enrollments.map(row =>
          <li key={row.id} className="py-3 text-sm text-body">
            {row.programName} ({row.programCode}) · {row.cohortName} ({row.cohortCode}) · {row.status}
          </li>)}</ul>}
      <h3 className="mt-5 font-semibold text-foreground">Active classes</h3>
      {data.classes.length === 0 ? <EmptyState title="No active classes" description="No active class enrollment recorded."/> :
        <ul className="mt-2 divide-y divide-border border-y border-border">{data.classes.map(row =>
          <li key={row.enrollmentId + row.sectionCode} className="py-3 text-sm text-body">
            {row.sectionName} ({row.sectionCode})
          </li>)}</ul>}
    </section>
    <section className="border-b border-border pb-5">
      <h2 className="font-semibold text-foreground">Recorded attendance</h2>
      <p className="mt-2 text-sm text-body">
        {data.attendance.recordedMarkedEvents} marked-session record(s);
        {" "}{data.attendance.presentOrLate} explicitly present/late;
        {" "}{data.attendance.absent} absent;
        {" "}{data.attendance.excused} excused;
        {" "}{data.attendance.medical} medical.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        {data.attendance.recordedPercent === null
          ? "No explicitly recorded attendance rows; percentage unavailable."
          : `${data.attendance.recordedPercent}% of explicitly recorded rows show present/late.`}
        {" "}This is not an overall attendance rate: unrecorded presence and session eligibility are not inferred.
      </p>
    </section>
  </div>;
}
