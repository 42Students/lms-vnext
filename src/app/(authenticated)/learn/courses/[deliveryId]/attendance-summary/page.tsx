import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOwnLearnerCourseAttendanceHistory } from "@/modules/courses/learner-course-drilldown-service";
import { learnerAttendanceMonthSchema } from "@/modules/courses/learner-course-drilldown-model";
import { courseSectionDeliveryIdSchema } from "@/modules/courses/validation";

const formatWhen = (value: Date) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
}).format(value) + " IST";

export default async function LearnerCourseAttendanceSummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ deliveryId: string }>;
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const { deliveryId } = await params;
  if (!courseSectionDeliveryIdSchema.safeParse(deliveryId).success) notFound();
  const query = await searchParams;
  const parsedMonth = learnerAttendanceMonthSchema.safeParse(query.month);
  const selectedMonth = parsedMonth.success ? parsedMonth.data : null;
  const context = await getCurrentRequestContext();
  const attendance = await getOwnLearnerCourseAttendanceHistory(context, deliveryId);
  if (!attendance) notFound();

  const available = attendance.months;
  const filtered = selectedMonth
    ? available.filter((row) => row.month === selectedMonth) : available;

  return (
    <div className="min-w-0 space-y-6">
      <Link href={"/learn/courses/" + encodeURIComponent(deliveryId) + "/attendanceDetail"}
        className="inline-flex min-h-9 sm:min-h-9 items-center text-sm font-semibold text-primary-text hover:underline">
        ← Course attendance
      </Link>
      <PageHeader title="Course attendance history" />
      <section aria-label="All-time course attendance" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Marked attendance", value: attendance.overall?.markedSessions ?? 0 },
          { label: "Present", value: attendance.overall?.present ?? 0 },
          { label: "Other marked", value: attendance.overall?.absent ?? 0 },
          { label: "Unmarked sessions", value: attendance.overall?.unmarkedSessions ?? 0 },
        ].map((metric) => (
          <article key={metric.label} className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-xs font-semibold text-muted-foreground">{metric.label}</h2>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{metric.value}</p>
          </article>
        ))}
      </section>
      <section className="border-b border-border py-4" aria-label="Threshold context">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-foreground">Attendance threshold</h2>
          <StatusBadge tone={attendance.overall?.percentage === null ? "neutral" :
            attendance.overall && attendance.overall.percentage !== null &&
              attendance.overall.percentage >= attendance.thresholdPercent
              ? "success" : "warning"}>
            {attendance.overall?.percentage == null
              ? "No marked attendance" : attendance.overall.percentage + "% recorded"}
          </StatusBadge>
        </div>
        <p className="mt-2 text-sm text-body">
          College policy threshold: {attendance.thresholdPercent}%. Percentage is based on marked
          sessions only; unmarked or future classes are not treated as absences.
        </p>
      </section>
      <nav aria-label="Attendance month filter" className="flex flex-wrap gap-2">
        <Link href={"/learn/courses/" + encodeURIComponent(deliveryId) + "/attendance-summary"}
          aria-current={selectedMonth === null ? "page" : undefined}
          className="inline-flex min-h-9 sm:min-h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
          All months
        </Link>
        {available.map((entry) => (
          <Link key={entry.month}
            href={"/learn/courses/" + encodeURIComponent(deliveryId) +
              "/attendance-summary?month=" + entry.month}
            aria-current={selectedMonth === entry.month ? "page" : undefined}
            className="inline-flex min-h-9 sm:min-h-9 items-center rounded-full border border-border bg-surface px-3 text-sm font-semibold text-primary-text">
            {entry.month}
          </Link>
        ))}
      </nav>
      {filtered.length === 0 ? (
        <section role="status" className="border-b border-border py-4">
          <h2 className="font-semibold text-foreground">No attendance sessions for this selection</h2>
          <p className="mt-2 text-sm text-body">
            No recorded or scheduled classes were found for this course and month. A missing
            attendance record is not counted as an absence.
          </p>
        </section>
      ) : (
        <section aria-label="Course attendance by month" className="space-y-4">
          {filtered.map((month) => (
            <article key={month.month} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-foreground">{month.month}</h2>
                  <p className="mt-1 text-sm text-body">
                    {month.present} present · {month.otherMarked} other marked ·
                    {" "}{month.notMarked} not marked · {month.scheduled} scheduled
                  </p>
                </div>
                <StatusBadge tone={month.percentage === null ? "neutral" :
                  month.percentage >= attendance.thresholdPercent ? "success" : "warning"}>
                  {month.percentage === null ? "No marked sessions" : month.percentage + "%"}
                </StatusBadge>
              </div>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {month.records.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{row.title}</p>
                      <time dateTime={row.startsAt.toISOString()}
                        className="mt-1 block text-xs text-muted-foreground">{formatWhen(row.startsAt)}</time>
                    </div>
                    <StatusBadge>{row.status.replaceAll("_", " ")}</StatusBadge>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
