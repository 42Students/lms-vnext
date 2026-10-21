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
import { StatusBadge } from "@/components/ui/status-badge";
import { Alert } from "@/components/ui/alert";
import { getLearnerAssessmentOverview } from "@/modules/courses/learner-assessment-service";
import {
 listOwnLearnerAssignmentMaterialLinks,listOwnLearnerAssignmentResources,
} from "@/modules/courses/learner-assignment-materials-service";
import {LearnerAssignmentResourceOpenControl} from "@/components/courses/learner-assignment-resource-open-control";
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
  if (resolution.kind === "choose") return <div className="min-w-0 space-y-4">
    <Link href="/learn/allAssignments" className="inline-flex min-h-11 max-w-full items-center font-semibold text-primary-text hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← All Assignments</Link>
    <PageHeader title="Choose a course" description="This assignment is in more than one of your courses." />
    <ul className="min-w-0 divide-y divide-border border-y border-border">
      {resolution.options.map(option => <li key={option.deliveryId} className="min-w-0 py-2">
        <Link className="inline-flex min-h-11 max-w-full items-center break-words font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
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
  const context=await getCurrentRequestContext();
  const [materials,resources]=await Promise.all([
    listOwnLearnerAssignmentMaterialLinks(context,item.id,item.deliveryId),
    listOwnLearnerAssignmentResources(context,item.id,item.deliveryId),
  ]);
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <Link href="/learn/allAssignments" className="inline-flex min-h-11 max-w-full items-center font-semibold text-primary-text hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← All Assignments</Link>
    <PageHeader title={item.title} />
    <div className="grid min-w-0 grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-4 gap-y-2 border-b border-border pb-4 md:gap-x-6 md:pb-6">
      <section aria-labelledby="assignment-due-title" className="min-w-0">
        <h2 id="assignment-due-title" className="text-xs font-semibold text-muted-foreground">Due</h2>
        <p className="mt-1 break-words text-foreground">{formatDate(item.dueAt)}</p>
      </section>
      <section className="min-w-0">
        <h2 className="text-xs font-semibold text-muted-foreground">Points</h2>
        <p className="mt-1 text-foreground">{item.maxPoints}</p>
      </section>
    </div>
    <section className="min-w-0 space-y-3 border-b border-border pb-4 md:pb-6">
      <h2 className="font-semibold text-[var(--lms-heading)]">Instructions & resources</h2>
      <p className="max-w-prose whitespace-pre-wrap break-words text-sm text-body">
        {item.description || "Your faculty hasn't added any resources to this assignment yet."}
      </p>
      {!materials.available&&!resources.available ?
        <Alert tone="warning" role="status">Assignment resources are temporarily unavailable. Your assignment and submission are unchanged.</Alert> : null}
      {resources.items.length>0?<ul className="min-w-0 divide-y divide-border" aria-label="Assignment instructions and files">
        {resources.items.map(resource=><li key={resource.id} className="min-w-0 py-3 text-sm">
          <strong className="block break-words text-foreground">{resource.title}</strong>
          <span className="text-xs text-muted-foreground">
            {resource.kind==="INSTRUCTIONS"?"Instructions":
             resource.kind==="LINK"?"Link":
             resource.kind==="PDF"?"PDF":"File"}
          </span>
          {resource.kind==="INSTRUCTIONS"&&resource.body?
            <p className="mt-2 max-w-prose whitespace-pre-wrap break-words text-body">{resource.body}</p>:null}
          {resource.kind==="LINK"&&resource.href?
            <a href={resource.href} rel="noopener noreferrer"
             className="mt-2 inline-flex min-h-11 max-w-full items-center break-all font-semibold text-primary-text underline md:min-h-9">
              Open link
            </a>:null}
          {(resource.kind==="PDF"||resource.kind==="FILE")?
            <div className="mt-2">
              <LearnerAssignmentResourceOpenControl
                deliveryId={item.deliveryId} assignmentId={item.id}
                resourceId={resource.id} kind={resource.kind}/>
            </div>:null}
        </li>)}
      </ul>:null}
      {materials.links.length>0 ? <ul className="min-w-0 divide-y divide-border" aria-label="Instructor resources">
        {materials.links.map(link=><li key={link.id} className="min-w-0 py-1 text-sm">
          <a href={link.href} rel="noopener noreferrer"
            className="inline-flex min-h-11 max-w-full items-center break-words font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            Open link: {link.title}
          </a>
        </li>)}
      </ul> : null}
    </section>
    <section className="min-w-0 space-y-3">
      <h2 className="font-semibold text-[var(--lms-heading)]">Your submission</h2>
      {item.submissionId ? <div className="min-w-0 space-y-3 text-sm text-body">
        <p role="status" className="flex flex-wrap items-center gap-2"><StatusBadge tone="success">Submitted</StatusBadge>{formatDate(item.submittedAt)}</p>
        {item.submissionType === "TEXT" ? (
          <p className="max-w-prose whitespace-pre-wrap break-words border-l-2 border-border bg-surface-subtle py-3 pl-4 pr-2">{item.submissionText}</p>
        ) : item.submissionType === "LINK" && item.submissionUrl ? (
          learnerAssessmentSubmittedLinkHref(item.submissionUrl) ? (
            <a href={learnerAssessmentSubmittedLinkHref(item.submissionUrl)!} 
              className="inline-flex min-h-11 max-w-full items-center break-all text-primary-text underline hover:text-[var(--lms-primary-text)] md:min-h-9 active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{item.submissionUrl}</a>
          ) : (
            <Alert tone="warning" className="break-all">Saved link unavailable. Open the original submission from a trusted HTTPS source.</Alert>
          )
        ) : <AssignmentFileOpenControl key={item.submissionId}
          submissionId={item.submissionId} enabled={assignmentFilesRuntimeEnabled()} />}
        {item.gradePublished ? <div className="min-w-0 space-y-2 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
          <p className="font-semibold text-foreground">Published grade: {learnerAssignmentPublishedGradeLabel(item.pointsAwarded,item.maxPoints)}</p>
          <p className="max-w-prose whitespace-pre-wrap break-words">{item.feedback || "No written feedback was provided."}</p>
        </div> : <p className="flex flex-wrap items-center gap-2"><StatusBadge tone="neutral">Not published</StatusBadge>Grade and feedback are not published yet.</p>}
      </div> : <div className="min-w-0 space-y-3">
        {!item.dueAt || item.dueAt.getTime() <= overview.snapshotNowMs ? (
          <Alert tone="warning">
            {item.dueAt ? "Submissions are closed" : "Submission unavailable · deadline missing"}
          </Alert>
        ) : null}
        {item.dueAt && item.dueAt.getTime() > overview.snapshotNowMs ? (
          <AssignmentSubmissionControl fileUploadsEnabled={assignmentFilesRuntimeEnabled()} assignmentId={item.id} deliveryId={item.deliveryId} />
        ) : <div className="space-y-2">
          <p className="text-sm text-body">{item.dueAt ? "Submission deadline has passed" : "Assignment deadline is not configured"}</p>
          <Button type="button" variant="secondary" disabled aria-disabled="true"
            className="min-h-11 w-full md:min-h-9 md:w-auto">
            {item.dueAt?"Submission closed":"Unavailable"}
          </Button>
        </div>}
      </div>}
    </section>
  </div>;
}