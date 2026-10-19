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
import { facultyReportCsvHref } from "@/modules/courses/faculty-report-csv-request";
import { FacultyAssignmentReview } from "@/components/courses/faculty-assignment-review";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
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
  if(!parsed) notFound();
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
      <Link href="/teacher/allAssignments" className="inline-flex min-h-9 items-center text-sm font-semibold text-primary-text hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        ← My Assignments
      </Link>
      <PageHeader title={assignment.title} />
      <div className="flex flex-wrap items-center gap-3">
        <FacultyReportCsvDownload
          href={facultyReportCsvHref({
            kind:"assignment",assessmentId:assignment.id,deliveryId:assignment.deliveryId,
          })}
        />
        <Link
          href={facultySubmissionListHref({
            assignmentId:assignment.id,deliveryId:assignment.deliveryId,
            filter:"ALL",page:1,
          })}
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:underline">
          Filter submissions and export
        </Link>
      </div>
      <FacultyReportDownload
        kind="assignment"
        incomplete={facultyReportIsIncomplete({kind:"assignment",eligibleLearners:metrics.eligibleLearners,
          submitted:metrics.submitted,graded:metrics.graded})}
        title={assignment.title}
        subtitle={[assignment.courseName, assignment.sectionName, assignment.lessonName].join(" · ")}
        summary={[
          "Submitted: " + metrics.submitted + "/" + metrics.eligibleLearners,
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
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Submitted", `${metrics.submitted}/${metrics.eligibleLearners}`],
          ["Average score", metrics.averagePercent === null ? "—" : `${metrics.averagePercent}%`],
          ["Graded", `${metrics.graded}/${metrics.submitted}`],
          ["Due date", assignment.dueAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(assignment.dueAt) : "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
          </div>
        ))}
      </div>
      <section className="border-b border-border py-4">
        <h2 className="text-lg font-semibold text-foreground">
          Score distribution
        </h2>
        {metrics.graded===0?<p role="status" className="mt-3 text-sm text-muted-foreground">
          No grades yet. Grade a submission to populate this score distribution.
        </p>:null}
        <div
          className="mt-4 space-y-3"
          role="group"
          aria-label={`Score distribution across ${metrics.graded} graded submissions`}
        >
          {distribution.map((bucket) => {
            const total = Math.max(metrics.graded, 1);
            const width = Math.round((bucket.count / total) * 100);
            return (
              <details key={bucket.label} className="rounded-md border border-border p-2 text-sm">
                <summary className="grid min-h-9 cursor-pointer grid-cols-[6rem_1fr_2rem] items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                <span className="text-body">{bucket.label}</span>
                <span className="h-2 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </span>
                <strong className="text-right text-foreground">{bucket.count}</strong>
                </summary>
                <ul className="mt-2 space-y-1 border-t border-border pt-2">
                  {submissions.filter(row=>{
                    if(row.gradingStatus!=="GRADED"||row.pointsAwarded===null||assignment.maxPoints<=0)return false;
                    const percent=Math.round(100*row.pointsAwarded/assignment.maxPoints);
                    return percent>=bucket.min&&percent<=bucket.max;
                  }).map(row=><li key={row.id} className="flex justify-between gap-3 text-body">
                    <span>{facultyReportLearnerName(row.learnerDisplayName)}</span>
                    <span>{row.pointsAwarded}/{assignment.maxPoints}</span>
                  </li>)}
                </ul>
              </details>
            );
          })}
        </div>
      </section>

      <section className="border-b border-border py-4">
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

      <section className="border-b border-border py-4">
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
                  {facultyReportLearnerName(learner.displayName)}
                </p>
                              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="submissions" className="scroll-mt-16 border-b border-border py-4">
        <h2 className="text-lg font-semibold text-foreground">View submissions</h2>
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
