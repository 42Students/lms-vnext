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
  const { assignment, submissions, metrics } = report;
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
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Submitted", metrics.submitted],
          ["Submitted late", metrics.late],
          ["Graded", metrics.graded],
          ["Published", metrics.gradePublished],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
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
      <p className="text-sm text-muted-foreground">
        Missing-student roster, score distribution, CSV/PDF export and
        interactive grading drill-down remain open parity items.
      </p>
    </div>
  );
}
