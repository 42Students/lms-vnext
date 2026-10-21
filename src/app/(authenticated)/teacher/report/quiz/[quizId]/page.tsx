import { MetricBar } from "@/components/ui/metric-bar";
import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
import { Disclosure } from "@/components/ui/disclosure";
import {FacultyReportBackButton} from "@/components/courses/faculty-report-back-button";
import Link from "next/link";
import {notFound} from "next/navigation";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
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
  if(!parsed) return <section className="min-w-0 space-y-4">
    <PageHeader title="Quiz report" />
    <ErrorState title="Report not found." description="This quiz report link is no longer valid."
      action={<Link href="/teacher/allQuizzes" className="font-semibold text-primary-text underline">Back to quizzes</Link>} />
  </section>;
  let report:Awaited<ReturnType<typeof getFacultyQuizReport>>;
  try {
    report=await getFacultyQuizReport(context,parsed.assessmentId,parsed.deliveryId);
  } catch(error) {
    if(facultyQuizReportHidden(error)) notFound();
    return <section className="min-w-0 space-y-4">
      <PageHeader title="Quiz report" />
      <ErrorState title="Couldn't load this quiz's report. Please try again."
        description="Your report is temporarily unavailable. No results have been changed."
        action={<a href={"/teacher/report/quiz/"+encodeURIComponent(quizId)+(parsed.deliveryId?"?deliveryId="+encodeURIComponent(parsed.deliveryId):"")}
          className="font-semibold text-primary-text underline">Retry report</a>} />
    </section>;
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
      {report.rosterUnavailable ? <Banner tone="warning" role="status">
        Couldn't load the student roster. Scores from authorized attempts remain visible, but the not-attempted list is unavailable.
        <a href={"/teacher/report/quiz/"+encodeURIComponent(quizId)+(parsed.deliveryId?"?deliveryId="+encodeURIComponent(parsed.deliveryId):"")}
          className="ml-2 font-semibold text-primary-text underline">Retry roster</a>
      </Banner> : null}
      <PageHeader title={quiz.title}
        description={[quiz.courseName, quiz.lessonName].join(" · ")}
        actions={<div className="flex min-w-0 flex-wrap items-center gap-2">
          <FacultyReportBackButton fallbackHref="/teacher/allQuizzes"/>
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
          <Link href={facultyQuizAttemptsHref(quiz.id,quiz.deliveryId)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 text-sm font-semibold text-[var(--lms-on-primary)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">
            Individual attempts &amp; question accuracy →
          </Link>
        </div>} />
      <dl aria-label="Quiz report summary" className="grid min-w-0 grid-cols-2 gap-x-4 border-y border-[var(--lms-canvas-border)] sm:grid-cols-4">
        {[
          ["Submitted", `${metrics.submittedLearners}/${metrics.eligibleLearners}`],
          ["Average score", metrics.averagePercent === null ? "—" : `${metrics.averagePercent}%`],
          ["Questions", metrics.questionCount],
          ["Due date", quiz.dueAt ? new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",month:"short",day:"numeric",year:"numeric"}).format(quiz.dueAt) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 py-4">
            <dt className="text-xs font-semibold leading-5 text-muted-foreground">{label}</dt>
            <dd className={"mt-1 break-words text-xl font-semibold leading-7 tabular-nums "+(label==="Average score"&&metrics.averagePercent!==null&&metrics.averagePercent<60?"text-warning":"text-[var(--lms-heading)]")}>{value}</dd>
          </div>
        ))}
      </dl>
            <Disclosure title="Export options" className="min-w-0 border-b border-[var(--lms-canvas-border)]" contentClassName="min-w-0 space-y-4 px-2 py-3">
      <nav aria-label="Quiz CSV response filters" className="flex flex-wrap gap-3 text-sm">
        <Link href={facultyReportCsvHref({kind:"quiz",assessmentId:quiz.id,
          deliveryId:quiz.deliveryId,filter:"ATTEMPTED"})}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Export attempted only
        </Link>
        <Link href={facultyReportCsvHref({kind:"quiz",assessmentId:quiz.id,
          deliveryId:quiz.deliveryId,filter:"NOT_ATTEMPTED"})}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Export not attempted only
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-3">
        <Link href={"/api/courses/faculty/reports/quiz/"+encodeURIComponent(quiz.id)+
          "/question-csv?deliveryId="+encodeURIComponent(quiz.deliveryId)}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-link hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Download question accuracy CSV
        </Link>
        <p className="text-xs text-muted-foreground leading-5">Question export includes aggregate accuracy only, capped at 500 questions.</p>
      </div>
      <FacultyReportCsvDownload
        notice="CSV contains at most 500 learner result rows; larger exports include an explicit omitted-row notice."
        href={facultyReportCsvHref({
          kind:"quiz",assessmentId:quiz.id,deliveryId:quiz.deliveryId,
        })}
      />

      </Disclosure>
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

      <section aria-labelledby="section-score-distribution" className="border-b border-border py-4">
        <h2 id="section-score-distribution" className="text-lg font-semibold text-foreground">
          Score distribution
        </h2>
        {metrics.submittedLearners===0?<p role="status" className="mt-3 text-sm text-muted-foreground leading-[22px]">
          No graded scores to chart yet.
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
                 className="border-b border-[var(--lms-canvas-border)] p-2 text-sm [&>summary]:min-h-11 md:[&>summary]:min-h-[var(--lms-control-height)] [&>summary]:px-0">
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {latestAttempts.filter(attempt=>{
                    if(attempt.maxScore<=0)return false;
                    const percent=Math.round(100*attempt.score/attempt.maxScore);
                    return percent>=bucket.min&&percent<=bucket.max;
                  }).map(attempt=><li key={attempt.id} className="flex justify-between gap-3 text-body">
                    <span className="min-w-0 break-words">{facultyReportLearnerName(attempt.learnerDisplayName)}</span>
                    <span className="shrink-0 tabular-nums">{attempt.score}/{attempt.maxScore}</span>
                  </li>)}
                </ul>
              </Disclosure>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="section-question-accuracy" className="border-b border-border py-4">
        <h2 id="section-question-accuracy" className="text-lg font-semibold text-foreground">
          Question accuracy
        </h2>
        <p className="mt-1 text-sm text-muted-foreground leading-[22px]">
          Worst-answered first.
        </p>
        {questions.length === 0 ? (
          <p className="mt-4 text-sm text-body leading-[22px]">
            This quiz has no questions yet.
          </p>
        ) : (
          <ol aria-label="quiz entries" className="mt-4 space-y-3">
            {questions.map((question, index) => (
              <li
                key={question.id}
                className={styles.accuracyRow+" !rounded-none !bg-transparent !px-0 !py-3 "+(question.accuracyPercent===null?"":question.accuracyPercent<50?styles.accuracyRowPoor:question.accuracyPercent<75?styles.accuracyRowFair:"")}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="m-0 text-xs font-semibold uppercase text-muted-foreground leading-5">
                      Question {index + 1}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground leading-[22px]">
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
                <p className="mt-2 text-xs text-muted-foreground leading-5">
                  {question.answeredCount > 0
                    ? `${question.correctCount}/${question.answeredCount} correct`
                    : "Not answered yet"}
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

      <section aria-labelledby="section-not-attempted" className="border-b border-border py-4">
        <h2 id="section-not-attempted" className="text-lg font-semibold text-foreground">
          Not attempted
        </h2>
        {notAttemptedLearners.length === 0 ? (
          <p className="mt-3 text-sm text-body leading-[22px]">
            Every currently eligible learner has at least one attempt.
          </p>
        ) : (
          <ul className="mt-3 grid min-w-0 gap-x-6 sm:grid-cols-2">
            {notAttemptedLearners.map((learner) => (
              <li
                key={learner.membershipId}
                className="border-b border-[var(--lms-canvas-border)] py-3"
              >
                <p className="m-0 text-sm font-semibold text-foreground leading-[22px]">
                  {facultyReportLearnerName(learner.displayName)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="section-review-individual-attempts" className="border-b border-border py-4">
        <h2 id="section-review-individual-attempts" className="text-lg font-semibold text-foreground">Review individual attempts</h2>
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
