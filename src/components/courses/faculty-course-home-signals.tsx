import { Alert } from "@/components/ui/alert";
import { MetricBar } from "@/components/ui/metric-bar";
import styles from "./faculty-course-home-signals.module.css";
import { StatTile } from "@/components/ui/stat-tile";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
import { facultyCourseTabHref } from "@/modules/courses/faculty-course-navigation";
import type { getFacultyCourseHomeSignals } from "@/modules/courses/faculty-course-home-service";

type Signals = Awaited<
  ReturnType<typeof getFacultyCourseHomeSignals>
>;

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
  const blueprintFocusHref = firstPending
    ? facultyCourseTabHref(deliveryId,"blueprint")+"?"+
      new URLSearchParams({lesson:firstPending.lessonId,content:firstPending.assignmentId}).toString()+
      "#course-item-"+encodeURIComponent(firstPending.assignmentId)
    : null;

  return (
    <div className="min-w-0 space-y-6">
      {missing.length ? (
        <Alert tone="warning" aria-label="Incomplete faculty course signals">
          <p className="font-semibold">Some faculty course signals are incomplete ({missing.join(", ")}).</p>
          <p className="mt-1">Unknown metrics are shown as unavailable, not zero.</p>
          <Link href={facultyCourseTabHref(deliveryId,"home")+"?refreshSignals=1"}
            className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
            Retry signals
          </Link>
        </Alert>
      ) : null}
      <section className="border-b border-border pb-4">
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
            <h2 className="mt-2 text-xl font-semibold text-[var(--lms-heading)]">
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
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-[650] text-[var(--lms-on-primary)] transition-colors hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]"
          >
            {firstPending
              ? "Review work"
              : "Open course content"}
          </Link>
        </div>
      </section>

      {blueprintFocusHref?<Link href={blueprintFocusHref}
        className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline">
        View pending assignment in Blueprint
      </Link>:null}
      <section aria-label="Pending work">
        <div className="mb-3">
          <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
            Pending work
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Items that need faculty attention.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <StatTile
            label="Reviews"
            value={assignmentsReady ? signals.pendingSubmissions.length : "—"}
            detail="Submitted assignments waiting for grading."
            href={firstPending ? reviewHref : `/teacher/allAssignments`}
          />
          <StatTile
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
          <StatTile
            label="At-risk Students"
            value={riskReady ? signals.atRiskTotal : "—"}
            detail={riskReady
              ? "Low attendance or repeated overdue missing submissions."
              : "Risk could not be calculated from incomplete signals."}
            href={`/teacher/courses/${deliveryId}/students`}
          />
          <StatTile
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
          className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6"
          aria-label="Needs attention"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
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
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]"
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
                <Disclosure title={`${learner.severity>=3?"Critical":"Moderate"} · View snapshot`} className="min-w-40 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-2 text-xs">
                  <div className="mt-2 space-y-2 text-xs text-muted-foreground">
                    <p>Attendance: {learner.attendancePercent===null?"Not enough marked sessions":learner.attendancePercent+"%"}</p>
                    {learner.attendancePercent!==null?<MetricBar role="img" className={styles.track}
                      label={"Attendance "+learner.attendancePercent+" percent"}
                      value={learner.attendancePercent} maximum={100} unit="percent" />:null}
                    <p>Submissions missing: {learner.missingSubmissionCount}</p>
                    <p>Average grade: {learner.averageGradePercent===null?"No graded work":learner.averageGradePercent+"%"}</p>
                  </div>
                  <Link href={`/teacher/courses/${encodeURIComponent(deliveryId)}/students`}
                    className="mt-2 inline-flex min-h-11 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">View students</Link>
                </Disclosure>
              </li>
            ))}
          </ul>
        </section>
      ) : <Alert tone="info">
        {riskReady ? "No major learner risk signals" : "Learner risk signals are unavailable until attendance and submission data can be refreshed."}
      </Alert>}

      {assignmentsReady ? <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-6">
        <h2 className="m-0 text-base font-semibold text-[var(--lms-heading)]">
          Performance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Current learner averages across graded assignments.
        </p>
        <Link href="/teacher/allAssignments"
          className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-[var(--lms-control-height)]">
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
              <Disclosure
                key={bucket.label}
                className="rounded-[var(--lms-control-radius)] border border-border p-2 text-sm [&>summary]:px-0"
                title={<span className={styles.distribution+" w-full"}>
                  <span className={styles.distributionLabel}>{bucket.label}</span>
                  <MetricBar className={styles.gradeTrack} label={bucket.label+" grade distribution"}
                    value={width} maximum={100} unit="percent" />
                  <strong className={styles.distributionCount}>{bucket.count}</strong>
                </span>}
              >
                {bucket.count>0?<ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {signals.performance.studentAverages.filter(student=>
                    student.averagePercent>=bucket.min&&student.averagePercent<=bucket.max
                  ).map(student=><li key={student.membershipId}
                    className="flex justify-between gap-3 text-body">
                    <span>{student.name}</span><span>{student.averagePercent}%</span>
                  </li>)}
                </ul>:<p className="mt-2 text-xs text-muted-foreground">No graded learners in this range.</p>}
              </Disclosure>
            );
          })}
        </div>
      </section> : <section aria-label="Performance" className="border-b border-border pb-4">
        <h2 className="text-base font-semibold text-[var(--lms-heading)]">Performance</h2>
        <p className="mt-2 text-sm text-body">Performance metrics are unavailable until assignment signals can be refreshed.</p>
      </section>}
    </div>
  );
}
