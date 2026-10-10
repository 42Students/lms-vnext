import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFacultyQuizReport } from "@/modules/courses/faculty-assessment-report-service";

export default async function FacultyQuizReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ deliveryId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { quizId } = await params;
  const { deliveryId } = await searchParams;
  const report = await getFacultyQuizReport(context, quizId, deliveryId ?? null);
  const { quiz, attempts, notAttemptedLearners, metrics } = report;

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium", timeStyle: "short",
    }).format(value);

  return (
    <div className="space-y-6">
      <Link href="/teacher/allQuizzes" className="text-sm font-semibold text-primary-text">
        ← All Quizzes
      </Link>
      <PageHeader
        eyebrow="Faculty · Quiz Report"
        title={quiz.title}
        description={`${quiz.courseName} · ${quiz.sectionName} · ${quiz.lessonName}`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Attempts", metrics.attempted],
          ["Eligible learners", metrics.eligibleLearners],
          ["Not attempted", metrics.notAttempted],
          ["Average score", metrics.averagePercent === null ? "Not yet graded" : `${metrics.averagePercent}%`],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={quiz.status === "PUBLISHED" ? "success" : "neutral"}>
          {quiz.status}
        </StatusBadge>
        <StatusBadge tone={quiz.resultsPublished ? "success" : "warning"}>
          {quiz.resultsPublished ? "Results published" : "Results private"}
        </StatusBadge>
        <span className="text-sm text-body">
          {quiz.totalPoints} points · {quiz.maxAttempts} attempts allowed
        </span>
      </div>

      <section className="overflow-x-auto rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Submitted attempts</h2>
        {attempts.length === 0 ? (
          <p className="mt-3 text-sm text-body">No learners have attempted this Quiz.</p>
        ) : (
          <table className="mt-3 w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="py-2 pr-3">Learner</th>
                <th className="py-2 pr-3">Attempt</th>
                <th className="py-2 pr-3">Score</th>
                <th className="py-2 pr-3">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="py-3 pr-3 text-foreground">
                    {attempt.learnerDisplayName || attempt.learnerEmail || "Learner"}
                  </td>
                  <td className="py-3 pr-3">{attempt.attemptNumber}</td>
                  <td className="py-3 pr-3">{attempt.score}/{attempt.maxScore}</td>
                  <td className="py-3 pr-3">{formatDate(attempt.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">
          Not attempted
        </h2>
        {notAttemptedLearners.length === 0 ? (
          <p className="mt-3 text-sm text-body">
            Every currently eligible learner has at least one attempt.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {notAttemptedLearners.map((learner) => (
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
        This report is Section-scoped. Question-level response distribution,
        export parity and browser verification remain open.
      </p>
    </div>
  );
}
