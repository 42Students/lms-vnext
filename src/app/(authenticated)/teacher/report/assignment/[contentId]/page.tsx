import { MetricBar } from "@/components/ui/metric-bar";
import styles from "@/components/courses/faculty-report-legacy-charts.module.css";
import { Disclosure } from "@/components/ui/disclosure";
import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import {notFound} from "next/navigation";
import {parseFacultyAssessmentReportRoute,facultyAssignmentReportHidden} from "@/modules/courses/faculty-assessment-route-boundary";
import { FacultyReportStudentTable } from "@/components/courses/faculty-report-student-table";
import { facultyReportLearnerName } from "@/modules/courses/faculty-report-students";
import { facultyReportIstTimestamp } from "@/modules/courses/faculty-report-time";
import { FacultyReportDownload } from "@/components/courses/faculty-report-download";
import {facultyReportIsIncomplete} from "@/modules/courses/faculty-report-completeness";
import { FacultyReportCsvDownload } from "@/components/courses/faculty-report-csv-download";
import { FacultyReportBackAction } from "@/components/courses/faculty-report-back-action";
import { facultyReportCsvHref } from "@/modules/courses/faculty-report-csv-request";
import { FacultyAssignmentReview } from "@/components/courses/faculty-assignment-review";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { ErrorState } from "@/components/ui/error-state";
import { getFacultyAssignmentReport } from "@/modules/courses/faculty-assessment-report-service";
import { facultySubmissionListHref } from "@/modules/courses/faculty-assignment-submissions-model";

export default async function FacultyAssignmentReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ contentId: string }>;
  searchParams: Promise<{ deliveryId?: string }>;
}) {
  const context = await getCurrentRequestContext();
  const { contentId } = await params;
  const parsed=parseFacultyAssessmentReportRoute(contentId,await searchParams);
  if(!parsed)return <section className="min-w-0 space-y-4">
    <PageHeader title="Assignment report" />
    <ErrorState title="Report not found." description="This assignment report link is not valid."
      action={<Link href="/teacher/allAssignments" className="font-semibold text-primary-text underline">Back to assignments</Link>}/>
  </section>;
  let report:Awaited<ReturnType<typeof getFacultyAssignmentReport>>;
  try {
    report=await getFacultyAssignmentReport(context,parsed.assessmentId,parsed.deliveryId);
  } catch(error) {
    if(facultyAssignmentReportHidden(error)) notFound();
    throw error;
  }
  const {
    assignment,
    submissions,
    missingLearners,
    distribution,
    metrics,
  } = report;
  return (
    <div className="min-w-0 max-w-full space-y-6">
      {report.rosterUnavailable?<Banner tone="warning" role="status">
        Report is partially loaded. The current student roster could not be verified, so student rows and submission counts are hidden until retry.
        <a className="ml-2 font-semibold text-primary-text underline"
          href={"/teacher/report/assignment/"+encodeURIComponent(contentId)+(parsed.deliveryId?"?deliveryId="+encodeURIComponent(parsed.deliveryId):"")}>Retry roster</a>
      </Banner>:null}
      <nav aria-label="Assignment report navigation and download" className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <FacultyReportBackAction fallback="/teacher/allAssignments"/>
      <FacultyReportDownload
        kind="assignment"
        rosterUnavailable={report.rosterUnavailable}
        incomplete={facultyReportIsIncomplete({kind:"assignment",eligibleLearners:metrics.eligibleLearners,
          submitted:metrics.submitted,graded:metrics.graded})}
        title={assignment.title?.trim()||"Untitled assignment"}
        subtitle={assignment.courseName}
        summary={[
          "Submitted: " + (report.rosterUnavailable ? "Roster unavailable" : metrics.submitted + "/" + metrics.eligibleLearners),
          "Average score: " + (metrics.averagePercent === null ? "Unknown" : metrics.averagePercent + "%"),
          "Graded: " + metrics.graded + "/" + metrics.submitted,
          "On time: " + metrics.onTime + "; Late: " + metrics.late + "; Not submitted: " + metrics.missing,
          "Total possible points: " + assignment.maxPoints,
          "Due: " + (assignment.dueAt ? facultyReportIstTimestamp(assignment.dueAt) : "No due date"),
        ]}
        sections={[
          { title: "Score distribution", rows: distribution.map((bucket) => bucket.label + ": " + bucket.count) },
          { title: "Student scores and submission timing", rows: submissions.map((submission) =>
            (facultyReportLearnerName(submission.learnerDisplayName)) +
            " | " + (submission.gradingStatus === "GRADED" ? submission.pointsAwarded + "/" + assignment.maxPoints : "Not graded") +
            (submission.gradePublished ? " (published)" : " (private)") +
            " | " + facultyReportIstTimestamp(submission.submittedAt) +
            (assignment.dueAt && submission.submittedAt > assignment.dueAt ? " (late)" : " (on time)")
          ) },
          { title: "Not submitted", rows: missingLearners.map((learner) => facultyReportLearnerName(learner.displayName)) },
        ]}
      />
      </nav>
      <PageHeader title={assignment.title?.trim()||"Untitled assignment"}
        description={assignment.courseName}/>
      <div className="flex min-w-0 flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span>Class: {assignment.sectionName||"—"}</span>
        <span>Lesson: {assignment.lessonName||"—"}</span>
      </div>
      <dl aria-label="Assignment report summary" className="grid min-w-0 grid-cols-2 gap-x-4 border-y border-[var(--lms-canvas-border)] sm:grid-cols-4">
        {[
          ["Submitted", report.rosterUnavailable ? "—" : `${metrics.submitted}/${metrics.eligibleLearners}`],
          ["Average score", metrics.averagePercent === null ? "—" : `${metrics.averagePercent}%`],
          ["Graded", `${metrics.graded}/${metrics.submitted}`],
          ["Due date", assignment.dueAt ? new Intl.DateTimeFormat("en-US", { month:"short", day:"numeric", year:"numeric", timeZone:"Asia/Kolkata" }).format(assignment.dueAt) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 py-4">
            <dt className="text-xs font-semibold leading-5 text-muted-foreground">{label}</dt>
            <dd className={"mt-1 break-words text-xl font-semibold leading-7 tabular-nums "+(label==="Average score"&&metrics.averagePercent!==null&&metrics.averagePercent<60?"text-warning":"text-[var(--lms-heading)]")}>{value}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="section-score-distribution" className="border-b border-[var(--lms-canvas-border)] py-4">
        <h2 id="section-score-distribution" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">
          Score distribution
        </h2>
        {metrics.graded===0?<p role="status" className="mt-3 text-sm text-muted-foreground leading-[22px]">
          No graded scores to chart yet.
        </p>:null}
        {metrics.graded>0?<div
          className="mt-4 space-y-3"
          role="img"
          aria-label={`Score distribution across ${metrics.graded} graded submissions: ${distribution.map(bucket=>bucket.label+" "+bucket.count).join(", ")}`}
        >
          {distribution.filter(bucket=>bucket.count>0).map((bucket) => {
            const total = Math.max(metrics.graded, 1);
            const width = Math.max(6,Math.round((bucket.count / total) * 100));
            return (
              <Disclosure key={bucket.label} title={<span className={styles.distribution+" min-w-0 flex-1"}>
                <span className={styles.distributionLabel}>{bucket.label}</span>
                <MetricBar className={styles.distributionTrack+" "+(bucket.min>=90?styles.distributionExcellent:bucket.min>=80?styles.distributionGood:bucket.min>=70?styles.distributionFair:bucket.min>=60?styles.distributionWeak:styles.distributionPoor)} label={bucket.label+" grade distribution"}
                  value={width} maximum={100} unit="percent" />
                <strong className={styles.distributionCount}>{bucket.count}</strong>
                </span>}
                 className="border-b border-border p-2 text-sm [&>summary]:min-h-11 md:[&>summary]:min-h-[var(--lms-control-height)] [&>summary]:px-0">
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {submissions.filter(row=>{
                    if(row.gradingStatus!=="GRADED"||row.pointsAwarded===null||assignment.maxPoints<=0)return false;
                    const percent=Math.round(100*row.pointsAwarded/assignment.maxPoints);
                    return percent>=bucket.min&&percent<=bucket.max;
                  }).map(row=><li key={row.id} className="flex justify-between gap-3 text-body">
                    <span className="min-w-0 break-words">{facultyReportLearnerName(row.learnerDisplayName)}</span>
                    <span className="shrink-0 tabular-nums">{row.pointsAwarded}/{assignment.maxPoints}</span>
                  </li>)}
                </ul>
              </Disclosure>
            );
          })}
        </div>:null}
      </section>

      <section aria-labelledby="section-submission-timing" className="border-b border-[var(--lms-canvas-border)] py-4">
        <h2 id="section-submission-timing" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">
          Submission timing
        </h2>
        {metrics.submitted===0?<p className="mt-3 text-sm text-muted-foreground">No submitted assignments to chart yet.</p>:
         <div role="img" aria-label={metrics.onTime+" on time, "+metrics.late+" late"}
          className="mt-4 flex h-4 min-w-0 overflow-hidden rounded-[3px] bg-[var(--lms-neutral-100)]">
           {metrics.onTime>0?<span title={metrics.onTime+" on time"} aria-hidden="true" className="bg-[var(--lms-primary)]"
            style={{width:(100*metrics.onTime/Math.max(metrics.submitted,1))+"%"}}/>:null}
           {metrics.late>0?<span title={metrics.late+" late"} aria-hidden="true" className="bg-warning"
            style={{width:(100*metrics.late/Math.max(metrics.submitted,1))+"%"}}/>:null}
         </div>}
        <dl className="mt-3 grid min-w-0 grid-cols-3 gap-x-4 border-y border-[var(--lms-canvas-border)]">
          {([["On time",metrics.onTime],["Late",metrics.late],["Not submitted",metrics.missing]] as const)
           .map(([label,value])=><div key={label} className="min-w-0 py-3">
             <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
             <dd className="mt-1 text-xl font-semibold tabular-nums text-[var(--lms-heading)]">{value}</dd>
           </div>)}
        </dl>
<div aria-labelledby="section-not-submitted" className="mt-4 border-t border-[var(--lms-canvas-border)] pt-3">
        <h2 id="section-not-submitted" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">
          Not submitted
        </h2>
        {report.rosterUnavailable ? <p className="mt-3 text-sm text-muted-foreground">Not-submitted status is unavailable until the roster is verified.</p> : missingLearners.length === 0 ? (
          <p className="mt-3 text-sm text-body leading-[22px]">
            Every currently eligible learner has submitted.
          </p>
        ) : (
          <ul className="mt-3 grid min-w-0 gap-x-6 sm:grid-cols-2">
            {missingLearners.map((learner) => (
              <li
                key={learner.membershipId}
                className="min-w-0 border-b border-[var(--lms-canvas-border)] py-3"
              >
                <p className="m-0 text-sm font-semibold text-foreground leading-[22px]">
                  {facultyReportLearnerName(learner.displayName)}
                </p>
                              </li>
            ))}
          </ul>
        )}
</div>

      </section>

      <FacultyReportStudentTable title="Student scores" emptyMessage="No one has submitted this assignment yet." rows={submissions.map((submission) => {
        const scored = submission.gradingStatus === "GRADED" &&
          submission.pointsAwarded !== null &&
          assignment.maxPoints > 0;
        return {
          id: submission.id,
          name: facultyReportLearnerName(submission.learnerDisplayName),
          score: scored ? submission.pointsAwarded + "/" + assignment.maxPoints : "Not graded",
          percent: scored ? Math.round((submission.pointsAwarded! / assignment.maxPoints) * 100) : null,
          submittedAt: submission.submittedAt.toISOString(),
          note: (assignment.dueAt && submission.submittedAt > assignment.dueAt ? "Late" : "On time") +
            (submission.gradePublished ? " · Published" : " · Private"),
        };
      })} />

      <section aria-label="Additional assignment report tools" className="flex min-w-0 flex-wrap items-center gap-3 border-t border-[var(--lms-canvas-border)] pt-3">
        <FacultyReportCsvDownload href={facultyReportCsvHref({
          kind:"assignment",assessmentId:assignment.id,deliveryId:assignment.deliveryId,
        })}/>
        <Link href={facultySubmissionListHref({assignmentId:assignment.id,
          deliveryId:assignment.deliveryId,filter:"ALL",page:1})}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-4 text-sm font-semibold text-primary-text md:min-h-9">
          Filter submissions and export
        </Link>
      </section>
      <section aria-labelledby="section-view-submissions" id="submissions" className="scroll-mt-16 border-b border-[var(--lms-canvas-border)] py-4">
        <h2 id="section-view-submissions" className="text-lg font-semibold leading-7 text-[var(--lms-heading)]">View submissions</h2>
        <p className="mt-1 text-sm text-body">See who submitted and grade their work.</p>
        <FacultyAssignmentReview
        filesEnabled={assignmentFilesRuntimeEnabled()}
          assignmentId={assignment.id}
          deliveryId={assignment.deliveryId}
          maxPoints={assignment.maxPoints}
          status={assignment.status}
        />
      </section>
    </div>
  );
}
