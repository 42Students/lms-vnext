import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getFacultyStudentDetail } from "@/modules/courses/faculty-student-detail-service";

function dateText(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
  }).format(new Date(value)) + " IST";
}

export default async function FacultyStudentDetailPage({
  params,
}: {
  params: Promise<{ deliveryId: string; membershipId: string }>;
}) {
  const context = await getCurrentRequestContext();
  const data = await getFacultyStudentDetail(context, await params);
  const name = data.student.displayName?.trim() || "Unnamed learner";
  const root = "/teacher/courses/" + encodeURIComponent(data.course.deliveryId);
  return <div className="space-y-6">
    <Link href={root + "/students"}
      className="text-sm font-semibold text-primary-text hover:underline">← Students</Link>
    <PageHeader eyebrow="Faculty · Course Students" title={name}
      description={[data.course.courseName, data.course.sectionName,
        data.course.academicPeriodName].join(" · ")} />
    <section aria-label="Student details" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Roll number", data.student.rollNumber ?? "Not assigned"],
        ["Email", data.student.email ?? "Not available"],
        ["Phone", data.student.phoneE164 ?? "Not available"],
        ["Recorded attendance", data.summary.percent === null
          ? "Unknown" : data.summary.percent + "%"],
      ].map(([label, value]) =>
        <div key={label} className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-semibold text-muted-foreground">{label}</p>
          <p className="mt-2 break-words font-semibold text-foreground">{value}</p>
        </div>)}
    </section>
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2 className="text-lg font-semibold text-foreground">Course attendance</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        {[
          ["Present", data.summary.present], ["Absent", data.summary.absent],
          ["Unmarked", data.summary.unmarked], ["Upcoming", data.summary.upcoming],
        ].map(([label, value]) =>
          <div key={label} className="rounded-lg bg-surface-subtle p-3">
            <p className="text-xs text-body">{label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
          </div>)}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">
        Attendance percentage uses recorded Present/Absent marks only.
        Unmarked or upcoming sessions are not assumed Present.
        This is a Course-level history, not an institution-wide eligibility ruling.
      </p>
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">Session history</h2>
      {data.sessions.length === 0
        ? <EmptyState title="No scheduled sessions"
            description="No scheduled class sessions exist for this Course delivery." />
        : <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="bg-surface-subtle"><tr>
              <th scope="col" className="px-4 py-3">Session</th>
              <th scope="col" className="px-4 py-3">Scheduled</th>
              <th scope="col" className="px-4 py-3">Attendance</th>
              <th scope="col" className="px-4 py-3">Recorded</th>
            </tr></thead>
            <tbody>{data.sessions.map(row => <tr key={row.id} className="border-t border-border">
              <td className="px-4 py-3 font-medium">{row.title}</td>
              <td className="px-4 py-3">{dateText(row.startsAt)}</td>
              <td className="px-4 py-3">{row.label}</td>
              <td className="px-4 py-3">{row.markedAt ? dateText(row.markedAt) : "Not recorded"}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      <Link href={root + "/attendanceDetail"}
        className="inline-flex text-sm font-semibold text-primary-text hover:underline">
        View monthly class attendance →
      </Link>
    </section>
  </div>;
}
