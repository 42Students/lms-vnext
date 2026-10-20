import { StatTile } from "@/components/ui/stat-tile";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge, attendanceStatusTone } from "@/components/ui/status-badge";
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
        className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline md:min-h-9 hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        ← Course attendance
      </Link>
      <PageHeader title="Course attendance history" />
      <details className="border-b border-border pb-3">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">All-time course attendance</summary>
        <section aria-label="All-time course attendance" className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Marked attendance", value: attendance.overall?.markedSessions ?? 0 },
          { label: "Present", value: attendance.overall?.present ?? 0 },
          { label: "Other marked", value: attendance.overall?.absent ?? 0 },
          { label: "Unmarked sessions", value: attendance.overall?.unmarkedSessions ?? 0 },
        ].map((metric) => (
          <StatTile key={metric.label} label={metric.label} value={metric.value} />
        ))}
        </section>
      </details>
      <section className="border-b border-border py-4" aria-label="Threshold context">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">Attendance threshold</h2>
          <StatusBadge tone={attendance.overall?.percentage == null ? "neutral" :
            attendance.overall && attendance.overall.percentage !== null &&
              attendance.overall.percentage >= attendance.thresholdPercent
              ? "success" : "warning"}>
            {attendance.overall?.percentage == null
              ? "No marked attendance" : attendance.overall.percentage + "% recorded"}
          </StatusBadge>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
          College policy threshold: {attendance.thresholdPercent}%. Percentage is based on marked
          sessions only; unmarked or future classes are not treated as absences.
        </p>
      </section>
      <Tabs ariaLabel="Attendance month filter" value={selectedMonth ?? "all"}
        renderPanel={false}
        items={[
          { value: "all", label: "All months",
            href: "/learn/courses/" + encodeURIComponent(deliveryId) + "/attendance-summary" },
          ...available.map(entry => ({
            value: entry.month,
            label: entry.month,
            href: "/learn/courses/" + encodeURIComponent(deliveryId) +
              "/attendance-summary?month=" + encodeURIComponent(entry.month),
          })),
        ]}
      />
      {filtered.length === 0 ? (
        <EmptyState title="No attendance sessions for this selection"
          description="No recorded or scheduled classes were found for this course and month. A missing attendance record is not counted as an absence." />
      ) : (
        <section aria-label="Course attendance by month" className="space-y-4">
          {filtered.map((month) => (
            <article key={month.month} className="border-b border-border py-4 md:py-5">
              <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:gap-3">
                <div>
                  <h2 className="font-semibold text-[18px] leading-[1.4] text-[var(--lms-heading)]">{month.month}</h2>
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
              <ul className="mt-3 divide-y divide-border">
                {month.records.map((row) => (
                  <li key={row.id} className="flex min-w-0 flex-col items-start justify-between gap-2 py-3 sm:flex-row sm:gap-3">
                    <div className="min-w-0 flex-1 break-words">
                      <p className="text-sm font-semibold text-foreground">{row.title}</p>
                      <time dateTime={row.startsAt.toISOString()}
                        className="mt-1 block text-xs text-muted-foreground">{formatWhen(row.startsAt)}</time>
                    </div>
                    <StatusBadge tone={attendanceStatusTone(row.status)}>{row.status.replaceAll("_", " ")}</StatusBadge>
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
