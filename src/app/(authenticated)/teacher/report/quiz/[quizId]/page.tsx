import { MetricBar } from "@/components/ui/metric-bar";
import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import {notFound} from "next/navigation";
import {parseFacultyAssessmentReportRoute,facultyQuizReportHidden} from "@/modules/courses/faculty-assessment-route-boundary";
import { FacultyReportStudentTable } from "@/components/courses/faculty-report-student-table";
import { facultyReportLearnerName } from "@/modules/courses/faculty-report-students";
import { facultyReportIstTimestamp } from "@/modules/courses/faculty-report-time";
import { FacultyReportDownload } from "@/components/courses/faculty-report-download";
import {facultyReportIsIncomplete} from "@/modules/courses/faculty-report-completeness";
import { FacultyReportCsvDownload } from "@/components/courses/faculty-report-csv-download";
import { facultyReportCsvHref } from "@/modules/courses/faculty-report-csv-request";
import { FacultyQuizReview } from "@/components/courses/faculty-quiz-review";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getFacultyQuizReport } from "@/modules/courses/faculty-assessment-report-service";
import { facultyQuizAttemptsHref } from "@/modules/courses/faculty-quiz-attempts-model";

export default async function FacultyQuizReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ quizId: string }>;
  searchParams: Promise<{ deliveryId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { quizId } = await params;
  const parsed=parseFacultyAssessmentReportRoute(quizId,await searchParams);
  if(!parsed) notFound();
  let report:Awaited<ReturnType<typeof getFacultyQuizReport>>;
  try {
    report=await getFacultyQuizReport(context,parsed.assessmentId,parsed.deliveryId);
  } catch(error) {
    if(facultyQuizReportHidden(error)) notFound();
    throw error;
  }
  const {
    quiz,
    latestAttempts,
    distribution,
    questions,
    notAttemptedLearners,
    metrics,
  } = report;

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <Link href="/teacher/allQuizzes" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Back
      </Link>
      <PageHeader title={quiz.title} />
      <div className="flex flex-wrap justify-end gap-3">
        <Link href={facultyQuizAttemptsHref(quiz.id,quiz.deliveryId)}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-link">
          Individual attempts &amp; question accuracy →
        </Link>
      </div>
      <nav aria-label="Quiz CSV response filters" className="flex flex-wrap gap-3 text-sm">
        <Link href={facultyReportCsvHref({kind:"quiz",assessmentId:quiz.id,
          deliveryId:quiz.deliveryId,filter:"ATTEMPTED"})}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 font-semibold text-link md:min-h-9">
          Export attempted only
        </Link>
        <Link href={facultyReportCsvHref({kind:"quiz",assessmentId:quiz.id,
          deliveryId:quiz.deliveryId,filter:"NOT_ATTEMPTED"})}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 py-2 font-semibold text-link md:min-h-9">
          Export not attempted only
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={"/api/courses/faculty/reports/quiz/"+encodeURIComponent(quiz.id)+
          "/question-csv?deliveryId="+encodeURIComponent(quiz.deliveryId)}
          className="inline-flex min-h-11 md:min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-link">
          Download question accuracy CSV
        </Link>
        <p className="text-xs text-muted-foreground">Question export includes aggregate accuracy only, capped at 500 questions.</p>
      </div>
      <FacultyReportCsvDownload
        notice="CSV contains at most 500 learner result rows; larger exports include an explicit omitted-row notice."
        href={facultyReportCsvHref({
          kind:"quiz",assessmentId:quiz.id,deliveryId:quiz.deliveryId,
        })}
      />
      <FacultyReportDownload
        kind="quiz"
        incomplete={facultyReportIsIncomplete({kind:"quiz",eligibleLearners:metrics.eligibleLearners,
          submittedLearners:metrics.submittedLearners,questionCount:metrics.questionCount})}
        title={quiz.title}
        subtitle={[quiz.courseName, quiz.sectionName, quiz.lessonName].join(" · ")}
        summary={[
          "Submitted: " + metrics.submittedLearners + "/" + metrics.eligibleLearners,
          "Average score: " + (metrics.averagePercent === null ? "Unknown" : metrics.averagePercent + "%"),
          "Total attempts: " + metrics.totalAttempts,
          "Question count: " + metrics.questionCount + "; Total points: " + quiz.totalPoints,
          "Results: " + (quiz.resultsPublished ? "Published" : "Private"),
          "Due: " + (quiz.dueAt ? facultyReportIstTimestamp(quiz.dueAt) : "No due date"),
        ]}
        sections={[
          { title: "Score distribution", rows: distribution.map((bucket) => bucket.label + ": " + bucket.count) },
          { title: "Question accuracy", rows: questions.map((question) =>
            question.prompt + " | " + question.correctCount + "/" + question.answeredCount +
            " correct | " + (question.accuracyPercent === null ? "Not answered" : question.accuracyPercent + "%")
          ) },
          { title: "Student scores", rows: latestAttempts.map((attempt) =>
            (facultyReportLearnerName(attempt.learnerDisplayName)) +
            " | Attempt " + attempt.attemptNumber + " | " + attempt.score + "/" +
            attempt.maxScore + " | " + facultyReportIstTimestamp(attempt.submittedAt)
          ) },
          { title: "Not attempted", rows: notAttemptedLearners.map((learner) => facultyReportLearnerName(learner.displayName)) },
        ]}
      />
      <div className={styles.stats}>
        {[
          ["Submitted", `${metrics.submittedLearners}/${metrics.eligibleLearners}`],
          ["Average score", metrics.averagePercent === null ? "—" : `${metrics.averagePercent}%`],
          ["Questions", metrics.questionCount],
          ["Due date", quiz.dueAt ? facultyReportIstTimestamp(quiz.dueAt) : "—"],
        ].map(([label, value]) => (
          <div key={label} className={styles.stat}>
            <p className={styles.statLabel}>{label}</p>
            <p className={styles.statValue}>{value}</p>
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

      <section className="border-b border-border py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Score distribution
        </h2>
        {metrics.submittedLearners===0?<p role="status" className="mt-3 text-sm text-muted-foreground">
          No quiz attempts yet. Scores will appear after students submit.
        </p>:null}
        <div
          className="mt-4 space-y-3"
          role="group"
          aria-label={`Score distribution across ${metrics.submittedLearners} learners`}
        >
          {distribution.map((bucket) => {
            const total = Math.max(metrics.submittedLearners, 1);
            const width = Math.round((bucket.count / total) * 100);
            return (
              <Disclosure key={bucket.label} title={<span className={styles.distribution+" min-w-0 flex-1"}>
                <span className={styles.distributionLabel}>{bucket.label}</span>
                <MetricBar className={styles.distributionTrack+" "+(bucket.min>=90?styles.distributionExcellent:bucket.min>=80?styles.distributionGood:bucket.min>=70?styles.distributionFair:bucket.min>=60?styles.distributionWeak:styles.distributionPoor)} label={bucket.label+" grade distribution"}
                  value={width} maximum={100} unit="percent" />
                <strong className={styles.distributionCount}>{bucket.count}</strong>
                </span>}
                 className="rounded-[var(--lms-canvas-radius)] border border-border p-2 text-sm [&>summary]:min-h-11 md:[&>summary]:min-h-[var(--lms-control-height)] [&>summary]:px-0">
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {latestAttempts.filter(attempt=>{
                    if(attempt.maxScore<=0)return false;
                    const percent=Math.round(100*attempt.score/attempt.maxScore);
                    return percent>=bucket.min&&percent<=bucket.max;
                  }).map(attempt=><li key={attempt.id} className="flex justify-between gap-3 text-body">
                    <span>{facultyReportLearnerName(attempt.learnerDisplayName)}</span>
                    <span>{attempt.score}/{attempt.maxScore}</span>
                  </li>)}
                </ul>
              </Disclosure>
            );
          })}
        </div>
      </section>

      <section className="border-b border-border py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Question accuracy
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Worst-answered first. Accuracy uses each learner&apos;s latest attempt only.
        </p>
        {questions.length === 0 ? (
          <p className="mt-4 text-sm text-body">
            This quiz has no questions yet.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <li
                key={question.id}
                className={styles.accuracyRow+" "+(question.accuracyPercent===null?"":question.accuracyPercent<50?styles.accuracyRowPoor:question.accuracyPercent<75?styles.accuracyRowFair:"")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-semibold uppercase text-muted-foreground">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {question.prompt}
                    </p>
                  </div>
                  <strong className="text-sm text-foreground">
                    {question.accuracyPercent === null
                      ? "Not answered"
                      : `${question.accuracyPercent}%`}
                  </strong>
                </div>
                <MetricBar className={styles.accuracyTrack+" mt-3 "+(question.accuracyPercent===null?styles.accuracyUnanswered:question.accuracyPercent<50?styles.accuracyPoor:question.accuracyPercent<75?styles.accuracyFair:styles.accuracyGood)} label="Question answer accuracy"
                  value={question.accuracyPercent ?? 0} maximum={100} unit="percent" />
                <p className="mt-2 text-xs text-muted-foreground">
                  {question.answeredCount > 0
                    ? `${question.correctCount}/${question.answeredCount} correct`
                    : "No answers submitted"}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <FacultyReportStudentTable title="Student scores" emptyMessage="No one has submitted this quiz yet." rows={latestAttempts.map((attempt) => ({
        id: attempt.id,
        name: facultyReportLearnerName(attempt.learnerDisplayName),
        score: attempt.score + "/" + attempt.maxScore,
        percent: attempt.maxScore > 0 ? Math.round(attempt.score / attempt.maxScore * 100) : null,
        submittedAt: attempt.submittedAt.toISOString(),
        note: "Attempt " + attempt.attemptNumber,
      }))} />

      <section className="border-b border-border py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Not attempted
        </h2>
        {notAttemptedLearners.length === 0 ? (
          <p className="mt-3 text-sm text-body">
            Every currently eligible learner has at least one attempt.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 md:grid-cols-2">
            {notAttemptedLearners.map((learner) => (
              <li
                key={learner.membershipId}
                className="border-b border-[var(--lms-canvas-border)] py-3"
              >
                <p className="m-0 text-sm font-semibold text-foreground">
                  {facultyReportLearnerName(learner.displayName)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-b border-border py-4">
        <h2 className="text-lg font-semibold text-foreground">Review individual attempts</h2>
        <p className="mt-1 text-sm text-body">Inspect submitted answers and manage results visibility for this Section.</p>
        <FacultyQuizReview
          quizId={quiz.id}
          deliveryId={quiz.deliveryId}
          status={quiz.status}
          resultsPublished={quiz.resultsPublished}
          deliveryOwned={quiz.facultyOwned}
          updatedAt={quiz.updatedAt.toISOString()}
        />
      </section>
    </div>
  );
}
