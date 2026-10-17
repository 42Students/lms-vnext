import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";
import type { getFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-service";

type Signals = Awaited<
  ReturnType<typeof getFacultyCourseHomeSignals>
>;

function SignalCard({
  label,
  value,
  detail,
  href,
}: {
  label: string;
  value: string | number;
  detail: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-surface p-4 outline-none transition hover:border-primary hover:shadow-sm focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
    >
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p>
    </Link>
  );
}

export function FacultyCourseHomeSignals({
  signals,
  deliveryId,
}: {
  signals: Signals;
  deliveryId: string;
}) {
  const firstPending =
    signals.pendingSubmissions[0] ?? null;
  const attendanceReady = signals.completeness.attendance;
  const assignmentsReady = signals.completeness.assignments;
  const riskReady = attendanceReady && assignmentsReady;
  const missing = [
    !attendanceReady ? "attendance" : null,
    !assignmentsReady ? "assignment submissions" : null,
  ].filter((name): name is string => name !== null);
  const reviewHref = firstPending
    ? `/teacher/report/assignment/${firstPending.assignmentId}?deliveryId=${encodeURIComponent(deliveryId)}`
    : `/teacher/courses/${deliveryId}/blueprint#learning-path`;

  return (
    <div className="space-y-5">
      {missing.length ? (
        <section role="status" aria-label="Incomplete faculty course signals"
          className="rounded-xl border border-warning-border bg-warning-subtle p-4 text-sm text-body">
          <p className="font-semibold">Some faculty course signals are incomplete ({missing.join(", ")}).</p>
          <p className="mt-1">Unknown metrics are shown as unavailable, not zero.</p>
          <Link href={facultyCourseTabHref(deliveryId,"home")+"?refreshSignals=1"}
            className="mt-2 inline-flex min-h-10 items-center font-semibold text-primary-text underline">
            Retry signals
          </Link>
        </section>
      ) : null}
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                tone={
                  !assignmentsReady || signals.pendingSubmissions.length
                    ? "warning"
                    : "success"
                }
              >
                {!assignmentsReady
                  ? "Incomplete"
                  : signals.pendingSubmissions.length
                    ? "Needs review"
                    : "All clear"}
              </StatusBadge>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Teaching overview
              </span>
            </div>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              {firstPending
                ? firstPending.assignmentTitle
                : assignmentsReady ? "Nothing waiting on you" : "Some signals unavailable"}
            </h2>
            <p className="mt-1 text-sm text-body">
              {firstPending
                ? `${signals.pendingSubmissions.length} submission(s) waiting.`
                : assignmentsReady
                  ? "No submitted assignments currently need grading. Continue with course content or review class health."
                  : "Assignment submission status could not be confirmed. Retry signals before assuming work is clear."}
            </p>
          </div>
          <Link
            href={reviewHref}
            className="inline-flex min-h-11 items-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover"
          >
            {firstPending
              ? "Review work"
              : "Open course content"}
          </Link>
        </div>
      </section>

      <section aria-label="Pending work">
        <div className="mb-3">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Pending work
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Items that need faculty attention.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SignalCard
            label="Reviews"
            value={assignmentsReady ? signals.pendingSubmissions.length : "—"}
            detail="Submitted assignments waiting for grading."
            href={firstPending ? reviewHref : `/teacher/allAssignments`}
          />
          <SignalCard
            label="Attendance"
            value={
              !attendanceReady || signals.attendance.averagePercent === null
                ? "—"
                : `${signals.attendance.averagePercent}%`
            }
            detail={attendanceReady
              ? `${signals.attendance.markedSessions} marked class session${signals.attendance.markedSessions === 1 ? "" : "s"}.`
              : "Attendance data unavailable."}
            href={`/teacher/courses/${deliveryId}/attendanceDetail`}
          />
          <SignalCard
            label="At-risk Students"
            value={riskReady ? signals.atRiskTotal : "—"}
            detail={riskReady
              ? "Low attendance or repeated overdue missing submissions."
              : "Risk could not be calculated from incomplete signals."}
            href={`/teacher/courses/${deliveryId}/students`}
          />
          <SignalCard
            label="Performance"
            value={
              !assignmentsReady || signals.performance.averagePercent === null
                ? "—"
                : `${signals.performance.averagePercent}%`
            }
            detail="Average across valid graded assignment scores."
            href={`/teacher/allAssignments`}
          />
        </div>
      </section>

      {riskReady && signals.atRiskTotal > 0 ? (
        <section
          className="rounded-xl border border-border bg-surface p-5"
          aria-label="Needs attention"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-semibold text-foreground">
                Needs attention
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {signals.atRiskCounts.critical} critical ·{" "}
                {signals.atRiskCounts.moderate} moderate
                {signals.atRiskTotal>signals.atRisk.length?" · View all for remaining students":""}
              </p>
            </div>
            <Link
              href={`/teacher/courses/${deliveryId}/students`}
              className="text-sm font-semibold text-primary-text hover:underline"
            >
              View all {signals.atRiskTotal} students
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {signals.atRisk.slice(0, 5).map((learner) => (
              <li
                key={learner.membershipId}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <span className="text-sm font-semibold text-foreground">
                  {learner.name}
                </span>
                <details className="min-w-40 rounded-md border border-border bg-surface-subtle p-2 text-xs">
                  <summary className="cursor-pointer font-semibold text-body">
                    {learner.severity>=3?"Critical":"Moderate"} · View snapshot
                  </summary>
                  <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                    <p>Attendance: {learner.attendancePercent===null?"Not enough marked sessions":learner.attendancePercent+"%"}</p>
                    {learner.attendancePercent!==null?<div role="img" aria-label={"Attendance "+learner.attendancePercent+" percent"} className="h-2 overflow-hidden rounded-full bg-muted">
                      <span className="block h-full bg-primary" style={{width:learner.attendancePercent+"%"}}/>
                    </div>:null}
                    <p>Submissions missing: {learner.missingSubmissionCount}</p>
                    <p>Average grade: {learner.averageGradePercent===null?"No graded work":learner.averageGradePercent+"%"}</p>
                  </div>
                  <Link href={`/teacher/courses/${encodeURIComponent(deliveryId)}/students`}
                    className="mt-2 inline-block text-primary-text underline">View students</Link>
                </details>
              </li>
            ))}
          </ul>
        </section>
      ) : <p role="status" className="rounded-xl border border-border bg-surface p-4 text-sm text-body">
        {riskReady ? "No major learner risk signals" : "Learner risk signals are unavailable until attendance and submission data can be refreshed."}
      </p>}

      {assignmentsReady ? <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">
          Performance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current learner averages across graded assignments.
        </p>
        <Link href="/teacher/allAssignments"
          className="mt-2 inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">
          View all assessments
        </Link>
        {signals.performance.studentAverages.length<3?
          <p className="mt-2 text-xs text-muted-foreground">
            Grade a few submissions to see the class&apos;s score spread here.
          </p>:<p className="mt-2 text-xs text-muted-foreground">
            {signals.performance.studentAverages.length} students have a graded average.
            Select a score range below to review the corresponding students.
          </p>}
        {signals.performance.weakestContent?<p className="mt-2 text-xs text-body">
          {signals.performance.weakestContent.title} is the weakest spot right now, averaging
          {" "}{signals.performance.weakestContent.averagePercent}% across
          {" "}{signals.performance.weakestContent.graded} graded submissions.
        </p>:null}
        {signals.performance.strongestContent&&
          signals.performance.strongestContent.id!==signals.performance.weakestContent?.id?
          <p className="mt-1 text-xs text-body">
            Strongest: {signals.performance.strongestContent.title}, averaging
            {" "}{signals.performance.strongestContent.averagePercent}% across
            {" "}{signals.performance.strongestContent.graded} graded submissions.
          </p>:null}
        <div className="mt-4 space-y-3">
          {signals.performance.distribution.map((bucket) => {
            const total = Math.max(
              signals.performance.studentAverages.length,
              1,
            );
            const width = Math.round(
              (bucket.count / total) * 100,
            );
            return (
              <details key={bucket.label} className="rounded-md border border-border p-2 text-sm">
                <summary className="grid cursor-pointer grid-cols-[6rem_1fr_2rem] items-center gap-3">

                <span className="text-body">
                  {bucket.label}
                </span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </span>
                <strong className="text-right text-foreground">{bucket.count}</strong>
                </summary>
                {bucket.count>0?<ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {signals.performance.studentAverages.filter(student=>
                    student.averagePercent>=bucket.min&&student.averagePercent<=bucket.max
                  ).map(student=><li key={student.membershipId}
                    className="flex justify-between gap-3 text-body">
                    <span>{student.name}</span><span>{student.averagePercent}%</span>
                  </li>)}
                </ul>:<p className="mt-2 text-xs text-muted-foreground">No graded learners in this range.</p>}
              </details>
            );
          })}
        </div>
      </section> : <section aria-label="Performance" className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Performance</h2>
        <p className="mt-2 text-sm text-body">Performance metrics are unavailable until assignment signals can be refreshed.</p>
      </section>}
    </div>
  );
}
