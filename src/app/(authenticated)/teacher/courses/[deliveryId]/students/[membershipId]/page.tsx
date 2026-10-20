import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
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
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Faculty · Course Students" title={name}
      description={[data.course.courseName, data.course.sectionName,
        data.course.academicPeriodName].join(" · ")}
      actions={<Link href={root + "/students"} className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">← Students</Link>} />
    <section aria-label="Student details" className="grid grid-cols-1 gap-x-4 border-y border-[var(--lms-canvas-border)] sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Roll number", data.student.rollNumber ?? "Not assigned"],
        ["Email", data.student.email ?? "Not available"],
        ["Phone", data.student.phoneE164 ?? "Not available"],
        ["Recorded attendance", data.summary.percent === null
          ? "Unknown" : data.summary.percent + "%"],
      ].map(([label, value]) =>
        <div key={label} className="min-w-0 py-3">
          <p className="text-xs font-semibold text-muted-foreground leading-5">{label}</p>
          <p className="mt-1 break-all text-sm font-semibold leading-6 text-foreground">{value}</p>
        </div>)}
    </section>
    <section className="min-w-0 space-y-3">
      <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Course attendance</h2>
      <div className="grid grid-cols-2 gap-x-4 border-y border-[var(--lms-canvas-border)] sm:grid-cols-4">
        {[
          ["Present", data.summary.present], ["Absent", data.summary.absent],
          ["Unmarked", data.summary.unmarked], ["Upcoming", data.summary.upcoming],
        ].map(([label, value]) =>
          <div key={label} className="min-w-0 py-4"><p className="text-xs font-semibold leading-5 text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold leading-7 tabular-nums text-[var(--lms-heading)]">{value}</p></div>)}
      </div>
      <p className="max-w-prose text-xs leading-5 text-muted-foreground">
        Attendance percentage uses recorded Present/Absent marks only.
        Unmarked or upcoming sessions are not assumed Present.
        This is a Course-level history, not an institution-wide eligibility ruling.
      </p>
    </section>
    <section className="space-y-3">
      <h2 className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">Session history</h2>
      {data.sessions.length === 0
        ? <EmptyState title="No scheduled sessions"
            description="No scheduled class sessions exist for this Course delivery." />
        : <DataTable caption="Session history" rows={data.sessions} getRowKey={row=>row.id}
            empty={<EmptyState title="No scheduled sessions"
              description="No scheduled class sessions exist for this Course delivery."/>}
            columns={[
              { key:"session", header:"Session", mobileLabel:"Session",
                mobilePriority:"primary" as const,
                cell:row=><div className="min-w-0 font-medium text-foreground">{row.title}
                  {row.note?<p className="mt-1 max-w-sm whitespace-pre-wrap break-words text-xs font-normal text-body leading-5">Note: {row.note}</p>:null}
                </div> },
              { key:"scheduled", header:"Scheduled", mobileLabel:"Scheduled",
                mobilePriority:"secondary" as const, cell:row=>dateText(row.startsAt) },
              { key:"attendance", header:"Attendance", mobileLabel:"Attendance",
                mobilePriority:"secondary" as const, cell:row=>row.label },
              { key:"recorded", header:"Recorded", mobileLabel:"Recorded",
                mobilePriority:"secondary" as const,
                cell:row=>row.markedAt?dateText(row.markedAt):"Not recorded" },
            ]}/>}
      <Link href={root + "/attendanceDetail"}
        className="inline-flex min-h-11 w-full items-center justify-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto md:min-h-9">
        View monthly class attendance →
      </Link>
    </section>
  </div>;
}
