import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFacultyAssignmentReport } from "@/modules/courses/faculty-assessment-report-service";

export default async function FacultyAssignmentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ contentId: string }>;
  searchParams: Promise<{ deliveryId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { contentId } = await params;
  const { deliveryId } = await searchParams;
  const report = await getFacultyAssignmentReport(context, contentId, deliveryId ?? null);
  const {
    assignment,
    submissions,
    missingLearners,
    distribution,
    metrics,
  } = report;
  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium", timeStyle: "short",
    }).format(value);

  return (
    <div className="space-y-6">
      <Link href="/teacher/allAssignments" className="text-sm font-semibold text-primary-text">
        ← All Assignments
      </Link>
      <PageHeader
        eyebrow="Faculty · Assignment Report"
        title={assignment.title}
        description={`${assignment.courseName} · ${assignment.sectionName} · ${assignment.lessonName}`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Submitted", `${metrics.submitted}/${metrics.eligibleLearners}`],
          ["Average score", metrics.averagePercent === null ? "—" : `${metrics.averagePercent}%`],
          ["Graded", `${metrics.graded}/${metrics.submitted}`],
          ["Due date", assignment.dueAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(assignment.dueAt) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Score distribution
        </h2>
        <div
          className="mt-4 space-y-3"
          role="img"
          aria-label={`Score distribution across ${metrics.graded} graded submissions`}
        >
          {distribution.map((bucket) => {
            const total = Math.max(metrics.graded, 1);
            const width = Math.round((bucket.count / total) * 100);
            return (
              <div
                key={bucket.label}
                className="grid grid-cols-[6rem_1fr_2rem] items-center gap-3 text-sm"
              >
                <span className="text-body">{bucket.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </span>
                <strong className="text-right text-foreground">
                  {bucket.count}
                </strong>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Submission timing
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["On time", metrics.onTime],
            ["Late", metrics.late],
            ["Not submitted", metrics.missing],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-lg bg-surface-subtle p-4"
            >
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Learner submissions</h2>
        {submissions.length === 0 ? (
          <p className="mt-3 text-sm text-body">No submissions yet.</p>
        ) : (
          <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Learner</th>
                <th className="py-2 pr-3">Submitted</th>
                <th className="py-2 pr-3">Timing</th>
                <th className="py-2 pr-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.map((submission) => (
                <tr key={submission.id}>
                  <td className="py-3 pr-3 text-foreground">
                    {submission.learnerDisplayName || submission.learnerEmail || "Learner"}
                  </td>
                  <td className="py-3 pr-3">{formatDate(submission.submittedAt)}</td>
                  <td className="py-3 pr-3">
                    {assignment.dueAt && submission.submittedAt > assignment.dueAt
                      ? "Late"
                      : "On time"}
                  </td>
                  <td className="py-3 pr-3">
                    <StatusBadge tone={submission.gradePublished ? "success" : "warning"}>
                      {submission.gradePublished
                        ? `${submission.pointsAwarded ?? 0}/${assignment.maxPoints}`
                        : submission.gradingStatus === "GRADED" ? "Unpublished" : "Not graded"}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Not submitted
        </h2>
        {missingLearners.length === 0 ? (
          <p className="mt-3 text-sm text-body">
            Every currently eligible learner has submitted.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {missingLearners.map((learner) => (
              <li
                key={learner.membershipId}
                className="rounded-lg bg-surface-subtle p-3"
              >
                <p className="m-0 text-sm font-semibold text-foreground">
                  {learner.displayName || learner.email}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {learner.email}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-sm text-muted-foreground">
        PDF/export and interactive grading drill-down remain open parity items.
      </p>
    </div>
  );
}
