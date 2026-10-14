import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AssignmentSubmissionControl } from "@/components/courses/assignment-submission-control";
import { PageHeader } from "@/components/ui/page-header";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import { findOwnLearnerAssignment } from "@/modules/courses/learner-assignment-detail-model";

type Props = {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ deliveryId?: string | string[] }>;
};
function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium", timeStyle: "short",
  }).format(date) : "No deadline";
}
export default async function LearnerAssignmentDetail({ params, searchParams }: Props) {
  const [path, query] = await Promise.all([params, searchParams]);
  const overview = await getLearnerAssessmentOverview(await getCurrentRequestContext());
  const item = findOwnLearnerAssignment(overview.assignments, {
    assignmentId: path.assignmentId, deliveryId: query.deliveryId,
  });
  if (!item) notFound();
  return <div className="space-y-6">
    <Link href="/learn/allAssignments" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← All Assignments</Link>
    <PageHeader eyebrow="Learner · Assignment" title={item.title}
      description={item.courseName + " · " + item.lessonName} />
    <div className="grid gap-4 sm:grid-cols-2">
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold text-muted-foreground">Due</h2>
        <p className="mt-2 text-foreground">{formatDate(item.dueAt)}</p>
      </section>
      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="text-xs font-semibold text-muted-foreground">Points</h2>
        <p className="mt-2 text-foreground">{item.maxPoints}</p>
      </section>
    </div>
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="font-semibold text-foreground">Instructions</h2>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body">
        {item.description || "No additional instructions were published."}
      </p>
    </section>
    <section className="rounded-xl border border-border bg-surface p-4 sm:p-6">
      <h2 className="font-semibold text-foreground">Your submission</h2>
      {item.submissionId ? <div className="mt-3 space-y-3 text-sm text-body">
        <p role="status">Submitted {formatDate(item.submittedAt)}</p>
        {item.submissionType === "TEXT" ? (
          <p className="whitespace-pre-wrap break-words rounded-lg bg-surface-subtle p-4">{item.submissionText}</p>
        ) : item.submissionType === "LINK" && item.submissionUrl ? (
          <a href={item.submissionUrl} target="_blank" rel="noopener noreferrer"
            className="block break-all text-primary-text underline">{item.submissionUrl}</a>
        ) : <p>File submitted. Its attachment is only available from the authorized Course workspace.</p>}
        {item.gradePublished ? <div className="rounded-lg bg-surface-subtle p-4">
          <p className="font-semibold text-foreground">Published grade: {item.pointsAwarded ?? 0} / {item.maxPoints}</p>
          <p className="mt-2 whitespace-pre-wrap break-words">{item.feedback || "No written feedback was provided."}</p>
        </div> : <p>Grade and feedback are not published yet.</p>}
      </div> : <div className="mt-3">
        {item.dueAt && item.dueAt.getTime() < overview.snapshotNowMs ? (
          <p role="status" className="rounded-lg border border-warning p-3 text-sm text-body">
            The deadline has passed; this published assignment accepts late submissions.
          </p>
        ) : null}
        <AssignmentSubmissionControl fileUploadsEnabled={assignmentFilesRuntimeEnabled()} assignmentId={item.id} deliveryId={item.deliveryId} />
      </div>}
    </section>
  </div>;
}