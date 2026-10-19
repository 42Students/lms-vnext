import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
    <PageHeader eyebrow="College Admin · Students" title={data.person.name}
      description="Read-only college-owned learner academic record; private identity and documents are excluded."
      actions={<Link href="/college/students" className="inline-flex min-h-[var(--lms-control-height)] items-center text-sm font-semibold text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to students</Link>} />
    <section className="border-t border-border pt-5">
      <h2 className="font-semibold text-foreground">Student record</h2>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-muted-foreground">Roll number</dt><dd>{data.person.rollNumber ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Registration number</dt><dd>{data.person.registrationNumber ?? "Not recorded"}</dd></div>
        <div><dt className="text-muted-foreground">Membership</dt><dd>{data.person.status}</dd></div>
      </dl>
    </section>
    <section className="border-t border-border pt-5">
      <h2 className="font-semibold text-foreground">Program and batch enrollments</h2>
      <form method="get" role="search" aria-label="Enrollment lifecycle filter" className="mt-3 flex min-w-0 flex-wrap items-end gap-3"
        action={`/college/students/${encodeURIComponent(membershipId)}`}>
        <label className="grid gap-2 text-sm font-semibold text-body">
          Enrollment lifecycle
          <Select name="status" defaultValue={data.filter.status}
            >
            <option value="ALL">All enrollments</option>
            <option value="ACTIVE">Active</option>
            <option value="COMPLETED">Completed</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </Select>
        </label>
        <Button type="submit" >Filter</Button>
      </form>
      <p className="mt-2 text-xs text-muted-foreground">{data.enrollmentTotal} total persisted enrollment(s), including other lifecycle statuses.</p>
      {data.enrollments.length === 0 ? <p className="mt-3 text-sm text-body">No program enrollment matches the selected lifecycle status.</p> :
        <ul className="mt-3 space-y-2">{data.enrollments.map(row =>
          <li key={row.id} className="text-sm text-body">
            {row.programName} ({row.programCode}) · {row.cohortName} ({row.cohortCode}) · {row.status}
          </li>)}</ul>}
      <h3 className="mt-5 font-semibold text-foreground">Active classes</h3>
      {data.classes.length === 0 ? <p className="mt-2 text-sm text-body">No active class enrollment recorded.</p> :
        <ul className="mt-2 space-y-1">{data.classes.map(row =>
          <li key={row.enrollmentId + row.sectionCode} className="text-sm text-body">
            {row.sectionName} ({row.sectionCode})
          </li>)}</ul>}
    </section>
    <section className="border-t border-border pt-5">
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
