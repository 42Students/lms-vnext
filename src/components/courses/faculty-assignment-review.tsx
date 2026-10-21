"use client";

import { Select } from "@/components/ui/select";
import Link from "next/link";
import { facultySubmissionContentView } from "@/modules/courses/faculty-submission-content-model";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useState,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { FacultySubmissionFileReview } from "./faculty-submission-file-review";
import {AssignmentSubmissionLinks} from "./assignment-submission-links";
import { facultyGradeEditorState } from "@/modules/courses/faculty-grade-editor-model";
import {facultyManualGradeReceipt,beginFacultyManualGradeOperation,facultyManualGradeUncertainMessage,facultyManualGradePublishPrompt,facultyManualGradeNeedsRefresh,facultyManualGradeSuccessMessage} from "@/modules/courses/faculty-manual-grade-receipt";
import { facultySubmissionReviewApiHref, type FacultySubmissionFilter } from "@/modules/courses/faculty-assignment-submissions-model";
import { facultySubmissionReviewResponseSchema, facultySubmissionReviewMatchesScope, facultySubmissionReviewEmptyLabel, facultyReviewRequestCurrent, facultySubmissionReviewFailure, type FacultySubmissionReviewResponse, type FacultySubmissionReviewRow } from "@/modules/courses/faculty-submission-review-model";
import { courseApiError } from "./learner-course-api";
import {
  assignmentSubmissionActions,
} from "./faculty-assessment-operation-model";

type Submission = FacultySubmissionReviewRow;
const SUBMISSION_FILTERS = ["ALL","UNGRADED","GRADED","LATE"] as const;
/** Old rows may have a numeric score without a populated gradingStatus. */
function isSubmissionGraded(row:Submission){
 return row.gradingStatus==="GRADED"||
  (typeof row.pointsAwarded==="number"&&Number.isFinite(row.pointsAwarded)&&row.pointsAwarded>=0);
}

function learnerLabel(
  submission: Submission,
) {
  return (
    submission.learnerDisplayName?.trim() ||
    submission.learnerEmail?.trim() ||
    `Learner ${submission.membershipId.slice(0, 8)}`
  );
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SubmissionGradeCard({
  submission,
  maxPoints,
  onUpdated,
  onRefresh,
  onBusyChange,
  filesEnabled,
}: {
  submission: Submission;
  maxPoints: number;
  filesEnabled: boolean;
  onUpdated: (submission: Submission) => void;
  onRefresh: () => void;
  onBusyChange: (busy:boolean) => void;
}) {
  const content = facultySubmissionContentView({
    id:submission.id,submissionType:submission.submissionType,
    textContent:submission.textContent,submissionUrl:submission.submissionUrl,
  },filesEnabled);
  const actions =
    assignmentSubmissionActions({
      gradingStatus:isSubmissionGraded(submission)?"GRADED":"NOT_GRADED",gradePublished:submission.gradePublished,
    });
  const [points, setPoints] = useState(
    submission.pointsAwarded?.toString() ??
      "",
  );
  const [feedback, setFeedback] = useState(
    submission.feedback ?? "",
  );
  const draftState = facultyGradeEditorState(submission, points, feedback, maxPoints);
  const unchanged = !draftState.hasChanges;
  const [saving, setSaving] =
    useState(false);
  const [publishing, setPublishing] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [needsRefresh,setNeedsRefresh]=useState(false);
  const [confirmAction,setConfirmAction]=useState<"REGRADING"|"SAVE_PUBLISH"|"PUBLISH"|"HIDE"|null>(null);
  const operationInFlight = useRef(false);

  async function saveGrade(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setSuccess(null);setNeedsRefresh(false);

    if(!submission.id){setError("Could not resolve this submission");return;}
    if(!points.trim()){setError("Enter a score before submitting");return;}
    const parsed = draftState.points;
    if (parsed === null) {
      setError(`Enter whole-number points between 0 and ${maxPoints}.`);
      return;
    }

    if(submission.gradePublished&&feedback.trim().length<8){
      setError("Explain the regrade to the learner in at least 8 characters.");
      return;
    }
    if (submission.gradePublished) {
      setConfirmAction("REGRADING");
      return;
    }
    void saveGradeConfirmed(parsed);
  }

  async function saveGradeConfirmed(parsed: number) {
    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setSaving(true);onBusyChange(true);
    try {
      const response = await fetch(
        `/api/courses/assignment-submissions/${submission.id}/grade`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            pointsAwarded: parsed,
            feedback:
              feedback.trim() || null,
            expectedVersion:
              submission.version,
          }),
        },
      );

      if (!response.ok) {
        setNeedsRefresh(facultyManualGradeNeedsRefresh(response.status));
        setError(
          await courseApiError(response),
        );
        return;
      }

      const saved = facultyManualGradeReceipt(await response.json(),submission,"GRADE",maxPoints,{
        points:parsed,feedback:feedback.trim()||null,
      });
      setSuccess("Grade saved privately. Learner cannot see the score until published.");
      onUpdated({
        ...submission,
        ...saved,
        learnerDisplayName:
          submission.learnerDisplayName,
        learnerEmail:
          submission.learnerEmail,
      });
    } catch {
      setError("Failed to submit grade. "+facultyManualGradeUncertainMessage("GRADE"));
    } finally {
      operationInFlight.current=false;onBusyChange(false);
      setSaving(false);
      setConfirmAction(null);
    }
  }

  /** College parity: one explicit action saves the private grade, then releases it. */
  async function saveAndPublish(){
    setError(null);setSuccess(null);setNeedsRefresh(false);
    const parsed=draftState.points;
    if(!submission.id){setError("Could not resolve this submission");return;}
    if(!points.trim()){setError("Enter a score before submitting");return;}
    if(parsed===null){
      setError("Enter whole-number points between 0 and "+maxPoints+".");
      return;
    }
    if(submission.gradePublished&&feedback.trim().length<8){
      setError("Explain the regrade to the learner in at least 8 characters.");
      return;
    }
    setConfirmAction("SAVE_PUBLISH");
  }

  async function saveAndPublishConfirmed(parsed: number) {
    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setSaving(true);onBusyChange(true);
    try{
      const changed=await fetch(
        "/api/courses/assignment-submissions/"+encodeURIComponent(submission.id)+"/grade",{
          method:"PATCH",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            pointsAwarded:parsed,feedback:feedback.trim()||null,
            expectedVersion:submission.version,
          }),
        });
      if(!changed.ok){
        setNeedsRefresh(facultyManualGradeNeedsRefresh(changed.status));
        setError(await courseApiError(changed));return;
      }
      const saved=facultyManualGradeReceipt(await changed.json(),submission,"GRADE",maxPoints,{
        points:parsed,feedback:feedback.trim()||null,
      });
      const current={...submission,...saved};
      const released=await fetch(
        "/api/courses/assignment-submissions/"+encodeURIComponent(submission.id)+"/publish",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({expectedVersion:saved.version}),
        });
      if(!released.ok){
        setNeedsRefresh(facultyManualGradeNeedsRefresh(released.status));
        setError("Grade saved privately but publication failed: "+await courseApiError(released));
        onUpdated(current);return;
      }
      const published=facultyManualGradeReceipt(await released.json(),current,"PUBLISH",maxPoints,{
        points:parsed,feedback:feedback.trim()||null,
      });
      setSuccess("Grade submitted. The learner can now see the score.");
      onUpdated({...current,...published});
    }catch{
      setNeedsRefresh(true);
      setError("The grade or publication outcome is uncertain. Reload before retrying.");
    }finally{
      operationInFlight.current=false;onBusyChange(false);setSaving(false);setConfirmAction(null);
    }
  }

  async function publishGrade() {
    setError(null);
    setSuccess(null);setNeedsRefresh(false);
    if (!draftState.canPublish) {
      setError("Save the score and feedback before publishing the grade.");
      return;
    }
    setConfirmAction("PUBLISH");
  }

  async function publishGradeConfirmed() {
    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setPublishing(true);onBusyChange(true);

    try {
      const response = await fetch(
        `/api/courses/assignment-submissions/${submission.id}/publish`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            expectedVersion:
              submission.version,
          }),
        },
      );

      if (!response.ok) {
        setNeedsRefresh(facultyManualGradeNeedsRefresh(response.status));
        setError(
          await courseApiError(response),
        );
        return;
      }

      const saved = facultyManualGradeReceipt(await response.json(),submission,"PUBLISH",maxPoints,{
        points:submission.pointsAwarded ?? -1,feedback:submission.feedback,
      });
      setSuccess(facultyManualGradeSuccessMessage("PUBLISH",saved.version));
      onUpdated({
        ...submission,
        ...saved,
        learnerDisplayName:
          submission.learnerDisplayName,
        learnerEmail:
          submission.learnerEmail,
      });
    } catch {
      setError("Failed to submit grade. "+facultyManualGradeUncertainMessage("PUBLISH"));
    } finally {
      operationInFlight.current=false;onBusyChange(false);
      setPublishing(false);
      setConfirmAction(null);
    }
  }

  /** Restore legacy grade privacy without silently changing the saved score. */
  async function hidePublishedGrade(){
    if(!submission.gradePublished||submission.pointsAwarded===null)return;
    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setSaving(true);onBusyChange(true);setError(null);setSuccess(null);setNeedsRefresh(false);
    try{
      const response=await fetch(
        "/api/courses/assignment-submissions/"+encodeURIComponent(submission.id)+"/grade",{
          method:"PATCH",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({
            pointsAwarded:submission.pointsAwarded,
            feedback:submission.feedback,
            expectedVersion:submission.version,
            hidePublished:true,
          }),
        });
      if(!response.ok){
        setNeedsRefresh(facultyManualGradeNeedsRefresh(response.status));
        setError(await courseApiError(response));return;
      }
      const saved=facultyManualGradeReceipt(
        await response.json(),submission,"GRADE",maxPoints,{
          points:submission.pointsAwarded,feedback:submission.feedback,
        });
      setSuccess("Grade saved and hidden from the learner.");
      onUpdated({...submission,...saved,gradePublished:false});
    }catch{
      setNeedsRefresh(true);
      setError("The grade visibility outcome is uncertain. Reload before retrying.");
    }finally{
      operationInFlight.current=false;onBusyChange(false);
      setSaving(false);setConfirmAction(null);
    }
  }

  return (
    <section className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
      <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div className="min-w-0">
          <h4 className="m-0 text-sm font-semibold text-foreground">
            {learnerLabel(submission)}
          </h4>
          {submission.learnerEmail ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {submission.learnerEmail}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            Submitted{" "}
            {formatDateTime(
              submission.submittedAt,
            )}
          </p>
        </div>
        <StatusBadge
          tone={
            submission.gradePublished
              ? "success"
              : isSubmissionGraded(submission)
                ? "warning"
                : "neutral"
          }
        >
          {submission.gradePublished
            ? "Graded: "+(submission.pointsAwarded??0)+" pts"
            : isSubmissionGraded(submission)
              ? "Graded: "+(submission.pointsAwarded??0)+" pts · not published"
              : "Grade pending"}
        </StatusBadge>
      </div>

      <div className="mt-3 min-w-0 border-t border-[var(--lms-canvas-border)] pt-3">
        {submission.submissionType === "FILE" && filesEnabled ? (
          <div className="space-y-3">
            {submission.textContent?<div>
              <p className="mb-1 text-xs font-semibold">Written Response</p>
              <p className="whitespace-pre-wrap break-words text-sm text-body">{submission.textContent}</p>
            </div>:null}
            <FacultySubmissionFileReview submissionId={submission.id}/>
            <AssignmentSubmissionLinks submissionId={submission.id}/>
          </div>
        ) : content.kind === "TEXT" ? (
          <div><p className="mb-2 text-xs font-semibold text-body">Written Response</p><p className="m-0 whitespace-pre-wrap break-words text-sm leading-6 text-body">{content.text}</p></div>
        ) : content.kind === "FILE" || content.kind === "LINK" ? (
          <Link href={content.href} target="_blank" rel="noopener noreferrer" prefetch={false}
            className="inline-flex min-h-11 items-center break-words text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)] md:min-h-9">
            {content.label}
          </Link>
        ) : <p role="status" className="text-sm text-muted-foreground">{content.message}</p>}
      </div>

      <form
        onSubmit={saveGrade}
        className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-[10rem_minmax(0,1fr)]"
      >
        <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Points
          </span>
          <Input
            aria-label={"Points for "+learnerLabel(submission)}
            placeholder="Grade points"
            type="number"
            min={0}
            max={maxPoints}
            step={1}
            value={points}
            disabled={saving || publishing}
            onChange={(event) =>
              setPoints(event.target.value)
            }
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">Max is {maxPoints}</span>
        </label>
        <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Feedback
          </span>
          <Textarea
            aria-required={submission.gradePublished}
            className="min-h-24"
            value={feedback}
            disabled={saving || publishing}
            onChange={(event) =>
              setFeedback(
                event.target.value,
              )
            }
            maxLength={10000}
            placeholder={submission.gradePublished
              ? "Required: explain why the published grade is changing"
              : "Optional feedback for the learner"}
          />
        </label>

        <div className="grid min-w-0 grid-cols-1 items-center gap-[var(--lms-space-2)] sm:flex sm:flex-wrap md:col-span-2">
          {actions.canGrade&&draftState.hasChanges?(
            <Button size="md" type="button" className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
              disabled={saving||publishing||draftState.points===null}
              onClick={()=>void saveAndPublish()}>
              {saving?"Submitting…":isSubmissionGraded(submission)?"Edit grade":"Submit grade"}
            </Button>
          ):null}
          {actions.canGrade ? (
            <Button size="md" type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
              disabled={saving||publishing||unchanged}>
              {saving?"Saving privately…":"Save privately"}
            </Button>
          ):null}
          {actions.canPublish ? (
            <Button
              size="md"
              type="button"
              className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
              variant="secondary"
              disabled={
                saving || publishing || !draftState.canPublish
              }
              onClick={publishGrade}
            >
              {publishing
                ? "Publishing…"
                : "Publish grade"}
            </Button>
          ) : null}

          {actions.canPublish && draftState.hasChanges ? (
            <p role="status" className="text-xs text-muted-foreground">
              Save your score and feedback changes before publishing.
            </p>
          ) : null}
          {submission.gradePublished && actions.canGrade ? (
            <Button size="md" type="button" variant="secondary"
              className="min-h-11 w-full sm:w-auto md:min-h-[var(--lms-control-height)]"
              disabled={saving||publishing||draftState.hasChanges}
              title={draftState.hasChanges?"Save or discard score edits before hiding the published grade":undefined}
              onClick={()=>setConfirmAction("HIDE")}>Save &amp; hide from learner</Button>
          ) : null}
          {submission.gradePublished ? (
            <span className="text-xs font-semibold text-success">
              Learner can see{" "}
              {submission.pointsAwarded ?? 0}/
              {maxPoints}
            </span>
          ) : null}
        </div>
      </form>

      {error ? (
        <div className="space-y-2"><Alert tone="error" className="mt-[var(--lms-space-3)]">{error}</Alert><Button type="button" variant="secondary" onClick={onRefresh} className="min-h-11 md:min-h-9">Refresh</Button></div>
      ) : null}
      {needsRefresh?<Button variant="secondary" type="button" onClick={()=>onUpdated(submission)}
       className="mt-[var(--lms-space-2)] min-h-11 md:min-h-[var(--lms-control-height)]">
        Reload current submission revision
       </Button>:null}
      {success?<Alert tone="success" className="mt-[var(--lms-space-2)]">{success}</Alert>:null}
      <ConfirmDialog
        open={confirmAction !== null}
        onOpenChange={nextOpen => { if (!nextOpen && !saving && !publishing) setConfirmAction(null); }}
        title={confirmAction === "HIDE" ? "Hide published grade?" : confirmAction === "REGRADING" ? "Regrade learner submission" : confirmAction === "SAVE_PUBLISH" ? "Save and publish grade" : "Publish grade"}
        description={confirmAction === "HIDE" ? "The learner will no longer see the published grade. The saved score and feedback will remain available to graders." : confirmAction === "REGRADING"
          ? "Regrading will hide the currently published grade until you publish the new grade. Continue?"
          : confirmAction === "SAVE_PUBLISH"
            ? "Save and publish this grade to the learner?"
            : facultyManualGradePublishPrompt(submission.pointsAwarded,maxPoints,submission.feedback)}
        confirmLabel={confirmAction === "HIDE" ? "Save & hide from learner" : confirmAction === "REGRADING" ? "Continue regrading" : confirmAction === "SAVE_PUBLISH" ? "Save and publish" : "Publish grade"}
        confirmVariant={confirmAction === "HIDE" || confirmAction === "REGRADING" ? "danger" : "primary"}
        pending={saving || publishing}
        confirmDisabled={confirmAction === "HIDE" ? !submission.gradePublished||draftState.hasChanges : confirmAction === "REGRADING" || confirmAction === "SAVE_PUBLISH" ? draftState.points === null : !draftState.canPublish}
        onConfirm={() => {
          if (confirmAction === "HIDE") void hidePublishedGrade();
          else if (confirmAction === "REGRADING" && draftState.points !== null) void saveGradeConfirmed(draftState.points);
          else if (confirmAction === "SAVE_PUBLISH" && draftState.points !== null) void saveAndPublishConfirmed(draftState.points);
          else if (confirmAction === "PUBLISH" && draftState.canPublish) void publishGradeConfirmed();
        }}
      />
    </section>
  );
}

export function FacultyAssignmentReview({
  assignmentId,
  deliveryId,
  maxPoints,
  status,
  filesEnabled,
  reviewScope="FACULTY",
}: {
  filesEnabled: boolean;
  reviewScope?:"FACULTY"|"COLLEGE";
  assignmentId: string;
  deliveryId: string;
  maxPoints: number;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submissions, setSubmissions] =
    useState<Submission[] | null>(null);
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const [filter,setFilter] = useState<FacultySubmissionFilter>("ALL");
  const [page,setPage] = useState(1);
  const [pagination,setPagination] = useState<FacultySubmissionReviewResponse|null>(null);
  const loadSequence = useRef(0);
  const [selectedSubmissionId,setSelectedSubmissionId]=useState<string|null>(null);
  const [mutationBusy,setMutationBusy]=useState(false);
  const mutationInFlight=useRef(false);
  const onBusyChange=(busy:boolean)=>{mutationInFlight.current=busy;setMutationBusy(busy);};
  const [bulkBusy,setBulkBusy]=useState(false);
  const [bulkConfirm,setBulkConfirm]=useState(false);
  const [bulkOnlyFailed,setBulkOnlyFailed]=useState(false);
  const [bulkFailedIds,setBulkFailedIds]=useState<string[]>([]);
  const [bulkReceipt,setBulkReceipt]=useState("");
  const [bulkWarning,setBulkWarning]=useState(false);
  async function publishGradedBatch(){
   if(bulkBusy||mutationInFlight.current)return;
   setBulkBusy(true);setBulkReceipt("");setBulkWarning(false);
   try{
    const result=await fetch("/api/courses/assignments/"+encodeURIComponent(assignmentId)+"/publish-grades",{
     method:"POST",headers:{"Content-Type":"application/json"},
     body:JSON.stringify({requestId:crypto.randomUUID(),deliveryId,
      ...(bulkOnlyFailed&&bulkFailedIds.length?{submissionIds:bulkFailedIds}:{}),
     }),
    });
    if(!result.ok)throw Error(await courseApiError(result));
    const body:unknown=await result.json();
    if(!body||typeof body!=="object"||
       !("published" in body)||typeof body.published!=="number"||
       !("remaining" in body)||typeof body.remaining!=="number"||
       !("failed" in body)||typeof body.failed!=="number"||
       !("failedIds" in body)||!Array.isArray(body.failedIds))
     throw Error("Publication result could not be verified. Refresh before retrying.");
    const failed=body.failedIds.filter((id):id is string=>typeof id==="string");
    setBulkFailedIds(failed);
    setBulkReceipt(body.published+" grade(s) published; "+body.failed+" failed. "+
     (body.remaining?"Remaining graded submissions: "+body.remaining+".":"All graded submissions in this Section are published.")+
     " Ungraded and already published work is skipped.");
    setBulkWarning(body.remaining>0||body.failed>0);
    void load();router.refresh();
   }catch(reason){
    setBulkWarning(true);
    setBulkReceipt("Failed to publish grades. "+(reason instanceof Error?reason.message:"Refresh and retry."));
   }finally{setBulkBusy(false);setBulkConfirm(false);}
  }


  const ReviewOverlay=reviewScope==="COLLEGE"?Dialog:Drawer;
  if(status==="ARCHIVED")return null;
  if(status==="DRAFT")return <div className="mt-3">
    <Button type="button" size="md" variant="secondary" className="min-h-11 md:min-h-[var(--lms-control-height)]"
      onClick={()=>setOpen(true)}>View submissions</Button>
    <ReviewOverlay open={open} onOpenChange={setOpen} title="Assignment submissions"
      className={reviewScope==="COLLEGE"?"max-w-[760px]":undefined}
      description="Draft assignments are hidden from learners.">
      <EmptyState title="No submissions yet" description="Publish this assignment to allow students to submit work." />
    </ReviewOverlay>
  </div>;

  async function load(next: {filter:FacultySubmissionFilter;page:number} = {filter,page}) {
    const sequence = ++loadSequence.current;
    setOpen(true);setError(null);setLoading(true);
    // Preserve the last successful page when an in-place refresh fails.
    if(next.filter!==filter||next.page!==page){setSubmissions(null);setPagination(null);}
    setFilter(next.filter);
    try {
      const facultyUrl=facultySubmissionReviewApiHref({
        assignmentId,deliveryId,filter:next.filter,page:next.page,
      });
      const reviewUrl=reviewScope==="COLLEGE"?
        facultyUrl.replace("/api/courses/faculty/assignments/",
          "/api/courses/college/assignments/"):facultyUrl;
      const response=await fetch(reviewUrl,{cache:"no-store"});
      if (!response.ok) throw new Error(facultySubmissionReviewFailure(response.status) ?? await courseApiError(response));
      const parsed = facultySubmissionReviewResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("The submission list could not be read. Refresh and try again.");
      const payload = parsed.data;
      if (!facultySubmissionReviewMatchesScope(payload,assignmentId,deliveryId))
        throw new Error("The submission list belongs to a different Section. Reload this assignment.");
      if (!facultyReviewRequestCurrent(sequence,loadSequence.current)) return;
      setSubmissions(payload.items);setPagination(payload);setPage(payload.page);
      setSelectedSubmissionId(current=>payload.items.some(item=>item.id===current)?current:payload.items[0]?.id??null);
    } catch (caught) {
      if (facultyReviewRequestCurrent(sequence,loadSequence.current)) setError(
       "Failed to load submissions. "+(caught instanceof Error?caught.message:"Check your connection and try again.")+
       (submissions?.length?" Showing the last loaded submissions.":""));
    } finally {
      if (facultyReviewRequestCurrent(sequence,loadSequence.current)) setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-3">
        <Button type="button" size="md" variant="secondary" className="min-h-11 md:min-h-[var(--lms-control-height)]"
          onClick={() => void load()}>
          View submissions
        </Button>
      </div>
      <ReviewOverlay
        className={reviewScope==="COLLEGE"?"max-w-[760px]":undefined}
        open={open}
        onOpenChange={(nextOpen)=>{
          if(!nextOpen&&mutationInFlight.current)return;
          if(!nextOpen){loadSequence.current+=1;setLoading(false);}
          setOpen(nextOpen);
        }}
        title="Assignment submissions"
        description="Review authorized Section work. Grades stay private until explicitly published."
      >
      <div className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-wrap items-start justify-end gap-2">
          <Button
            size="md"
            className="min-h-11 md:min-h-[var(--lms-control-height)]"
            variant="ghost"
            disabled={loading||mutationBusy||bulkBusy}
            onClick={()=>void load()}
          >
            Refresh
          </Button>
        </div>

      {reviewScope==="COLLEGE"&&status==="PUBLISHED"?<div className="space-y-2">
       <Button type="button" variant="secondary" disabled={bulkBusy||mutationBusy}
        onClick={()=>{setBulkOnlyFailed(false);setBulkConfirm(true);}}>
        {bulkBusy?"Publishing…":"Publish graded submissions"}
       </Button>
       {bulkReceipt?<Alert tone={bulkWarning?"warning":"success"} role="status">{bulkReceipt}</Alert>:null}
       {bulkFailedIds.length&&!bulkBusy?<Button type="button" variant="secondary"
        onClick={()=>{setBulkOnlyFailed(true);setBulkConfirm(true);}}>Retry failed publications</Button>:null}
      </div>:null}
      <Tabs
        ariaLabel="Submission grading filters"
        value={filter}
        renderPanel={false}
        controlledOnly
        onValueChange={value => {if(!mutationInFlight.current&&!bulkBusy)void load({filter:value as FacultySubmissionFilter,page:1});}}
        items={SUBMISSION_FILTERS.map(value => ({
          value,
          label: value==="ALL"?"All":value==="UNGRADED"?"Pending":value==="GRADED"?"Graded":"Late",
          disabled: loading||mutationBusy||bulkBusy,
        }))}
      />
      {pagination ? <p role="status" className="text-xs text-muted-foreground">
        {pagination.total} matching submissions · Page {pagination.page} of {pagination.totalPages}
      </p> : null}

      {loading ? <LoadingState label="Loading submissions…" /> : null}

      {error ? (
        <div className="space-y-2"><Alert tone="error" className="mt-[var(--lms-space-3)]">{error}</Alert>
         <Button type="button" variant="secondary" disabled={mutationBusy||bulkBusy} onClick={()=>void load()}>Retry</Button></div>
      ) : null}

      {!loading && submissions && submissions.length === 0 ? (
        <EmptyState title={facultySubmissionReviewEmptyLabel(filter)} action={<Button type="button" variant="secondary" onClick={()=>void load()}>Refresh</Button>} />
      ) : null}

      {!loading && submissions && submissions.length>0 ? (
        <nav aria-label="Submission student navigation" className="grid min-w-0 grid-cols-2 items-end gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] md:flex md:flex-wrap">
          <label className="col-span-2 grid min-w-0 flex-1 gap-[var(--lms-space-1)] text-[13px] font-semibold leading-4 md:min-w-48 text-[var(--lms-neutral-400)]">
            Students ({submissions.filter(isSubmissionGraded).length}/{submissions.length} graded on this page)
            <Select className="min-h-11 text-[var(--lms-font-base)] md:min-h-[var(--lms-control-height)] md:text-sm"
              value={selectedSubmissionId??submissions[0].id}
              disabled={mutationBusy||bulkBusy}
              onChange={event=>{if(!mutationInFlight.current)setSelectedSubmissionId(event.target.value);}}>
              {submissions.map(item=><option key={item.id} value={item.id}>
                {learnerLabel(item)} · {isSubmissionGraded(item)?"Graded":"Pending"}
              </option>)}
            </Select>
          </label>
          <Button type="button" size="md" variant="secondary" className="min-h-11 w-full md:w-auto md:min-h-[var(--lms-control-height)]"
            disabled={mutationBusy||bulkBusy||submissions.findIndex(item=>item.id===selectedSubmissionId)<=0}
            onClick={()=>setSelectedSubmissionId(current=>submissions[Math.max(0,submissions.findIndex(item=>item.id===current)-1)].id)}>
            Previous student
          </Button>
          <span className="col-span-2 text-center text-xs text-muted-foreground md:col-span-1">
            {Math.max(1,submissions.findIndex(item=>item.id===selectedSubmissionId)+1)} / {submissions.length}
          </span>
          <Button type="button" size="md" variant="secondary" className="min-h-11 w-full md:w-auto md:min-h-[var(--lms-control-height)]"
            disabled={mutationBusy||bulkBusy||submissions.findIndex(item=>item.id===selectedSubmissionId)>=submissions.length-1}
            onClick={()=>setSelectedSubmissionId(current=>submissions[Math.min(submissions.length-1,submissions.findIndex(item=>item.id===current)+1)].id)}>
            Next student
          </Button>
        </nav>
      ):null}
      {!loading && submissions &&
      submissions.length > 0 ? (
        <div className="mt-4 space-y-3">
          {submissions.filter(submission=>submission.id===(selectedSubmissionId??submissions[0]?.id)).map(
            (submission) => (
              <SubmissionGradeCard
                key={`${submission.id}:${submission.version}`}
                submission={submission}
                maxPoints={maxPoints}
                filesEnabled={filesEnabled}
                onRefresh={() => { if(!mutationInFlight.current)void load(); }}
                onBusyChange={onBusyChange}
                onUpdated={() => {
                  // Re-query filters/counts so a newly graded row leaves Needs grading.
                  void load();router.refresh();
                }}
              />
            ),
          )}
        </div>
      ) : null}
      {pagination ? <nav aria-label="Submission pages" className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" size="md" variant="secondary" className="min-h-11 md:min-h-[var(--lms-control-height)]" disabled={loading||mutationBusy||bulkBusy||pagination.page<=1}
          onClick={()=>void load({filter,page:pagination.page-1})}>Previous</Button>
        <Button type="button" size="md" variant="secondary" className="min-h-11 md:min-h-[var(--lms-control-height)]" disabled={loading||mutationBusy||bulkBusy||pagination.page>=pagination.totalPages}
          onClick={()=>void load({filter,page:pagination.page+1})}>Next</Button>
      </nav> : null}
      </div>
      </ReviewOverlay>
      <ConfirmDialog open={bulkConfirm} onOpenChange={open=>{if(!bulkBusy)setBulkConfirm(open);}}
       title="Publish graded submissions?" pending={bulkBusy}
       description="Only graded unpublished submissions in this Section will be released to learners. Confirm to continue; failed rows can be retried."
       confirmLabel={bulkOnlyFailed?"Retry failed grades":"Publish grades"}
       onConfirm={()=>void publishGradedBatch()}/>
    </>
  );
}
