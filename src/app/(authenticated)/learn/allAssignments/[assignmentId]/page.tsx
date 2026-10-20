import { Button } from "@/components/ui/button";
import { assignmentFilesRuntimeEnabled } from "@/modules/courses/assignment-file-readiness";
import Link from "next/link";
import { learnerAssignmentPublishedGradeLabel } from "@/modules/courses/learner-assignment-grade-label-model";
import { learnerAssessmentSubmittedLinkHref } from "@/modules/courses/learner-assessment-submitted-link-model";
import { notFound } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { AssignmentFileOpenControl } from "@/components/courses/assignment-file-open-control";
import { AssignmentSubmissionControl } from "@/components/courses/assignment-submission-control";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import {listOwnLearnerAssignmentMaterialLinks} from "@/modules/courses/learner-assignment-materials-service";
import { resolveLearnerOfferingDelivery } from "@/modules/courses/learner-offering-delivery-model";
import { findOwnLearnerAssignment } from "@/modules/courses/learner-assignment-detail-model";

type Props = {
  params: Promise<{ assignmentId: string }>;
  searchParams: Promise<{ deliveryId?: string | string[] }>;
};
function formatDate(date: Date | null) {
  return date ? new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short",
  }).format(date) : "No deadline";
}
export default async function LearnerAssignmentDetail({ params, searchParams }: Props) {
  const [path, query] = await Promise.all([params, searchParams]);
  const overview = await getLearnerAssessmentOverview(await getCurrentRequestContext());
  const resolution = resolveLearnerOfferingDelivery(overview.assignments, path.assignmentId, query.deliveryId);
  if (resolution.kind === "none") notFound();
  if (resolution.kind === "choose") return <div className="min-w-0 space-y-6">
    <PageHeader title="Choose a course" description="This assignment is in more than one of your courses." actions={<Link href="/learn/allAssignments" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text">← All Assignments</Link>} />
    <ul className="divide-y divide-border border-y border-border">
      {resolution.options.map(option => <li key={option.deliveryId} className="p-4">
        <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9"
          href={"/learn/allAssignments/" + encodeURIComponent(path.assignmentId) + "?deliveryId=" + encodeURIComponent(option.deliveryId)}>
          {option.courseName}
        </Link>
      </li>)}
    </ul>
  </div>;
  const item = findOwnLearnerAssignment(overview.assignments, {
    assignmentId: path.assignmentId, deliveryId: resolution.deliveryId,
  });
  if (!item) notFound();
  const materials=await listOwnLearnerAssignmentMaterialLinks(await getCurrentRequestContext(),item.id,item.deliveryId);
  return <div className="space-y-6">
    <PageHeader title={item.title} actions={<Link href="/learn/allAssignments" className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-primary-text">← All Assignments</Link>} />
    <div className="grid gap-4 md:grid-cols-2">
      <section className="border-b border-border py-4">
        <h2 className="text-xs font-semibold text-muted-foreground">Due</h2>
        <p className="mt-2 text-foreground">{formatDate(item.dueAt)}</p>
      </section>
      <section className="border-b border-border py-4">
        <h2 className="text-xs font-semibold text-muted-foreground">Points</h2>
        <p className="mt-2 text-foreground">{item.maxPoints}</p>
      </section>
    </div>
    <section className="border-b border-border py-4 md:py-6">
      <h2 className="font-semibold text-foreground">Instructions & resources</h2>
      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-body">
        {item.description || "Your faculty hasn't added any resources to this assignment yet."}
      </p>
      {!materials.available ? <Alert tone="warning" className="mt-3" role="status">Assignment resources are temporarily unavailable. Your assignment and submission are unchanged.</Alert> : null}
      {materials.links.length>0 ? <ul className="mt-3 space-y-2" aria-label="Instructor resources">
        {materials.links.map(link=><li key={link.id} className="text-sm">
          <a href={link.href} rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">
            Open link: {link.title}
          </a>
        </li>)}
      </ul> : null}
    </section>
    <section className="border-b border-border py-4 md:py-6">
      <h2 className="font-semibold text-foreground">Your submission</h2>
      {item.submissionId ? <div className="mt-3 space-y-3 text-sm text-body">
        <p role="status" className="flex flex-wrap items-center gap-2"><StatusBadge tone="success">Submitted</StatusBadge>{formatDate(item.submittedAt)}</p>
        {item.submissionType === "TEXT" ? (
          <p className="whitespace-pre-wrap break-words rounded-[var(--lms-control-radius)] bg-surface-subtle p-4">{item.submissionText}</p>
        ) : item.submissionType === "LINK" && item.submissionUrl ? (
          learnerAssessmentSubmittedLinkHref(item.submissionUrl) ? (
            <a href={learnerAssessmentSubmittedLinkHref(item.submissionUrl)!} 
              className="inline-flex min-h-11 max-w-full items-center break-all text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:min-h-9">{item.submissionUrl}</a>
          ) : (
            <p role="status" className="break-all text-body">Saved link unavailable. Open the original submission from a trusted HTTPS source.</p>
          )
        ) : <AssignmentFileOpenControl key={item.submissionId}
          submissionId={item.submissionId} enabled={assignmentFilesRuntimeEnabled()} />}
        {item.gradePublished ? <div className="border-t border-[var(--lms-canvas-border)] bg-surface py-[var(--lms-space-4)]">
          <p className="font-semibold text-foreground">Published grade: {learnerAssignmentPublishedGradeLabel(item.pointsAwarded,item.maxPoints)}</p>
          <p className="mt-2 whitespace-pre-wrap break-words">{item.feedback || "No written feedback was provided."}</p>
        </div> : <p className="flex flex-wrap items-center gap-2"><StatusBadge tone="neutral">Not published</StatusBadge>Grade and feedback are not published yet.</p>}
      </div> : <div className="mt-3">
        {!item.dueAt || item.dueAt.getTime() <= overview.snapshotNowMs ? (
          <Alert tone="warning">
            {item.dueAt ? "Submissions are closed" : "Submission unavailable · deadline missing"}
          </Alert>
        ) : null}
        {item.dueAt && item.dueAt.getTime() > overview.snapshotNowMs ? (
          <AssignmentSubmissionControl fileUploadsEnabled={assignmentFilesRuntimeEnabled()} assignmentId={item.id} deliveryId={item.deliveryId} />
        ) : <div className="mt-2 space-y-2">
          <p className="text-sm text-body">{item.dueAt ? "Submission deadline has passed" : "Assignment deadline is not configured"}</p>
          <Button type="button" variant="secondary" disabled aria-disabled="true"
            className="min-h-11 md:min-h-9">
            {item.dueAt?"Submission closed":"Unavailable"}
          </Button>
        </div>}
      </div>}
    </section>
  </div>;
}