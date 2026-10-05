import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import type { getLearnerAttendanceWorkspace } from "@/modules/attendance/learner-service";

type AttendanceWorkspace = Awaited<ReturnType<typeof getLearnerAttendanceWorkspace>>;

function dateLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function timeLabel(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function tone(status: string) {
  if (status === "PRESENT") return "success" as const;
  if (status === "NOT_MARKED") return "warning" as const;
  if (status === "LATE") return "warning" as const;
  return "error" as const;
}

function label(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (value) => value.toUpperCase());
}

function Metric({
  label: metricLabel,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {metricLabel}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs leading-5 text-body">{detail}</p>
    </section>
  );
}

export function LearnerCourseAttendance({
  deliveryId,
  workspace,
}: {
  deliveryId: string;
  workspace: AttendanceWorkspace;
}) {
  const summary = workspace.summaries.find(
    (item) => item.deliveryId === deliveryId,
  );
  const records = workspace.records
    .filter((item) => item.deliveryId === deliveryId)
    .sort((left, right) => right.startsAt.getTime() - left.startsAt.getTime());

  if (!summary) {
    return (
      <EmptyState
        title="No attendance data"
        description="Attendance will appear here after this course has held class sessions."
      />
    );
  }

  const threshold = workspace.policy.eligibilityThresholdPercent;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="sr-only">Attendance</h2>
        <p className="m-0 text-sm text-body">
          Your course attendance summary and session-by-session record.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Classes held"
          value={summary.heldSessions}
          detail="Course sessions that have already started."
        />
        <Metric
          label="Present"
          value={summary.present}
          detail="Sessions marked present."
        />
        <Metric
          label="Absent"
          value={summary.absent}
          detail="Marked sessions not counted as present."
        />
        <Metric
          label="Attendance"
          value={summary.percentage === null ? "—" : `${summary.percentage}%`}
          detail={
            summary.unmarkedSessions > 0
              ? `${summary.unmarkedSessions} session(s) are still unmarked.`
              : "Only marked sessions affect the percentage."
          }
        />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="m-0 text-sm font-semibold text-foreground">
              Attendance threshold
            </h3>
            <p className="mt-1 text-xs leading-5 text-body">
              College threshold: <strong>{threshold}%</strong>. Unmarked sessions are not counted until faculty submits attendance.
            </p>
          </div>
          <StatusBadge
            tone={
              summary.percentage === null
                ? "neutral"
                : summary.percentage >= threshold
                  ? "success"
                  : "error"
            }
          >
            {summary.percentage === null
              ? "No marked attendance"
              : summary.percentage >= threshold
                ? "At or above threshold"
                : "Below threshold"}
          </StatusBadge>
        </div>
      </section>

      {records.length === 0 ? (
        <EmptyState
          title="No attendance records"
          description="No class sessions have been recorded for this course yet."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-surface md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-surface-subtle text-xs uppercase tracking-[0.06em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Faculty / location</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <p className="m-0 font-semibold text-foreground">
                        {dateLabel(row.startsAt)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {timeLabel(row.startsAt)}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="m-0 font-semibold text-foreground">
                        {row.title}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {summary.courseCode} · {summary.sectionName}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-body">
                      {[row.facultyName, row.location].filter(Boolean).join(" · ") || "Not specified"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={tone(row.status)}>
                        {label(row.status)}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {records.map((row) => (
              <article key={row.id} className="rounded-xl border border-border bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="m-0 text-sm font-semibold text-foreground">
                      {row.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {dateLabel(row.startsAt)} · {timeLabel(row.startsAt)}
                    </p>
                  </div>
                  <StatusBadge tone={tone(row.status)}>
                    {label(row.status)}
                  </StatusBadge>
                </div>
                <p className="mt-3 text-xs text-body">
                  {[row.facultyName, row.location].filter(Boolean).join(" · ") || "Faculty / location not specified"}
                </p>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
