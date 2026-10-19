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
import { Drawer } from "@/components/ui/drawer";
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
  filesEnabled,
}: {
  submission: Submission;
  maxPoints: number;
  filesEnabled: boolean;
  onUpdated: (submission: Submission) => void;
}) {
  const content = facultySubmissionContentView({
    id:submission.id,submissionType:submission.submissionType,
    textContent:submission.textContent,submissionUrl:submission.submissionUrl,
  },filesEnabled);
  const actions =
    assignmentSubmissionActions({
      gradingStatus:submission.gradingStatus,gradePublished:submission.gradePublished,
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
  const operationInFlight = useRef(false);

  async function saveGrade(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setSuccess(null);setNeedsRefresh(false);

    const parsed = draftState.points;
    if (parsed === null) {
      setError(
        `Enter whole-number points between 0 and ${maxPoints}.`,
      );
      return;
    }

    if(submission.gradePublished&&feedback.trim().length<8){
      setError("Explain the regrade to the learner in at least 8 characters.");
      return;
    }
    if (
      submission.gradePublished &&
      !window.confirm(
        "Regrading will hide the currently published grade until you publish the new grade. Continue?",
      )
    ) {
      return;
    }

    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setSaving(true);
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
      setSuccess(facultyManualGradeSuccessMessage("GRADE",saved.version));
      onUpdated({
        ...submission,
        ...saved,
        learnerDisplayName:
          submission.learnerDisplayName,
        learnerEmail:
          submission.learnerEmail,
      });
    } catch {
      setError(facultyManualGradeUncertainMessage("GRADE"));
    } finally {
      operationInFlight.current=false;
      setSaving(false);
    }
  }

  /** College parity: one explicit action saves the private grade, then releases it. */
  async function saveAndPublish(){
    setError(null);setSuccess(null);setNeedsRefresh(false);
    const parsed=draftState.points;
    if(parsed===null){
      setError("Enter whole-number points between 0 and "+maxPoints+".");
      return;
    }
    if(submission.gradePublished&&feedback.trim().length<8){
      setError("Explain the regrade to the learner in at least 8 characters.");
      return;
    }
    if(!window.confirm("Save and publish this grade to the learner?"))return;
    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setSaving(true);
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
      setSuccess("Grade saved and published to the learner.");
      onUpdated({...current,...published});
    }catch{
      setNeedsRefresh(true);
      setError("The grade or publication outcome is uncertain. Reload before retrying.");
    }finally{
      operationInFlight.current=false;setSaving(false);
    }
  }

  async function publishGrade() {
    setError(null);
    setSuccess(null);setNeedsRefresh(false);
    if (!draftState.canPublish) {
      setError("Save the score and feedback before publishing the grade.");
      return;
    }
    if (!window.confirm(
      facultyManualGradePublishPrompt(submission.pointsAwarded,maxPoints,submission.feedback),
    )) {
      return;
    }
    if(!beginFacultyManualGradeOperation(operationInFlight))return;
    setPublishing(true);

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
      setError(facultyManualGradeUncertainMessage("PUBLISH"));
    } finally {
      operationInFlight.current=false;
      setPublishing(false);
    }
  }

  return (
    <section className="rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
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
              : submission.gradingStatus ===
                  "GRADED"
                ? "warning"
                : "neutral"
          }
        >
          {submission.gradePublished
            ? "Graded: "+(submission.pointsAwarded??0)+" pts"
            : submission.gradingStatus==="GRADED"
              ? "Graded: "+(submission.pointsAwarded??0)+" pts · not published"
              : "Grade pending"}
        </StatusBadge>
      </div>

      <div className="mt-3 rounded-[var(--lms-control-radius)] bg-[var(--lms-neutral-50)] p-3">
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
            className="inline-flex min-h-10 items-center break-words text-sm font-semibold text-primary-text hover:text-primary-hover">
            {content.label}
          </Link>
        ) : <p role="status" className="text-sm text-muted-foreground">{content.message}</p>}
      </div>

      <form
        onSubmit={saveGrade}
        className="mt-4 grid gap-3 lg:grid-cols-[10rem_1fr]"
      >
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Points
          </span>
          <Input
            placeholder="Grade points"
            type="number"
            min={0}
            max={maxPoints}
            step={1}
            value={points}
            onChange={(event) =>
              setPoints(event.target.value)
            }
            required
          />
        </label>
        <label>
          <span className="mb-1.5 block text-xs font-semibold text-body">
            Feedback
          </span>
          <Textarea
            aria-required={submission.gradePublished}
            className="min-h-24"
            value={feedback}
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

        <div className="lg:col-span-2 flex flex-wrap items-center gap-2">
          {actions.canGrade&&draftState.hasChanges?(
            <Button size="sm" type="button"
              disabled={saving||publishing||draftState.points===null}
              onClick={()=>void saveAndPublish()}>
              {saving?"Submitting…":submission.gradingStatus==="GRADED"?"Edit grade":"Submit grade"}
            </Button>
          ):null}
          {actions.canGrade ? (
            <Button size="sm" type="submit" variant="secondary"
              disabled={saving||publishing||unchanged}>
              {saving?"Saving privately…":"Save privately"}
            </Button>
          ):null}
          {actions.canPublish ? (
            <Button
              size="sm"
              type="button"
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
        <p
          role="alert"
          className="mt-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}
      {needsRefresh?<Button type="button" onClick={()=>onUpdated(submission)}
       className="mt-2 inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text sm:min-h-9">
        Reload current submission revision
       </Button>:null}
      {success?<p role="status" className="mt-2 text-sm text-body">{success}</p>:null}
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

  if(status==="ARCHIVED")return null;
  if(status==="DRAFT")return <div className="mt-3">
    <Button type="button" size="sm" variant="secondary"
      onClick={()=>setOpen(true)}>View submissions</Button>
    <Drawer open={open} onOpenChange={setOpen} title="Assignment submissions"
      description="Draft assignments are hidden from learners.">
      <p role="status" className="text-sm text-muted-foreground">
        No submissions yet. Publish this assignment to allow students to submit work.
      </p>
    </Drawer>
  </div>;

  async function load(next: {filter:FacultySubmissionFilter;page:number} = {filter,page}) {
    const sequence = ++loadSequence.current;
    setOpen(true);setError(null);setLoading(true);setSubmissions(null);setPagination(null);
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
      if (facultyReviewRequestCurrent(sequence,loadSequence.current)) setError(caught instanceof Error ? caught.message :
        "Could not load Assignment submissions. Check your connection and try again.");
    } finally {
      if (facultyReviewRequestCurrent(sequence,loadSequence.current)) setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-3">
        <Button type="button" size="sm" variant="secondary"
          onClick={() => void load()}>
          View submissions
        </Button>
      </div>
      <Drawer
        open={open}
        onOpenChange={(nextOpen)=>{
          if(!nextOpen){loadSequence.current+=1;setLoading(false);}
          setOpen(nextOpen);
        }}
        title="Assignment submissions"
        description="Review authorized Section work. Grades stay private until explicitly published."
      >
      <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 text-sm font-semibold text-foreground">
            Assignment submissions
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Grades are private until explicitly
            published.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            disabled={loading}
            onClick={()=>void load()}
          >
            Refresh
          </Button>
          <span className="text-xs text-muted-foreground">
            Use the drawer close control or Escape to return to the assessment list.
          </span>
        </div>
      </div>

      <nav aria-label="Submission grading filters" className="flex flex-wrap gap-2">
        {SUBMISSION_FILTERS.map(value=><Button key={value} type="button" size="sm"
          variant={filter===value?"secondary":"ghost"} disabled={loading}
          aria-pressed={filter===value} onClick={()=>void load({filter:value,page:1})}>
          {value==="ALL"?"All":value==="UNGRADED"?"Pending":value==="GRADED"?"Graded":"Late"}
        </Button>)}
      </nav>
      {pagination ? <p role="status" className="text-xs text-muted-foreground">
        {pagination.total} matching submissions · Page {pagination.page} of {pagination.totalPages}
      </p> : null}

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Loading submissions…
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-3 text-sm font-semibold text-error"
        >
          {error}
        </p>
      ) : null}

      {!loading &&
      submissions &&
      submissions.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {facultySubmissionReviewEmptyLabel(filter)}
        </p>
      ) : null}

      {!loading && submissions && submissions.length>0 ? (
        <nav aria-label="Submission student navigation" className="grid min-w-0 grid-cols-2 items-end gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface p-3 sm:flex sm:flex-wrap">
          <label className="col-span-2 grid min-w-0 flex-1 gap-1 text-sm font-semibold sm:min-w-48">
            Students ({submissions.filter(item=>item.gradingStatus==="GRADED").length}/{submissions.length} graded on this page)
            <Select className="min-h-11 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-base sm:min-h-9 sm:text-sm"
              value={selectedSubmissionId??submissions[0].id}
              onChange={event=>setSelectedSubmissionId(event.target.value)}>
              {submissions.map(item=><option key={item.id} value={item.id}>
                {learnerLabel(item)} · {item.gradingStatus==="GRADED"?"Graded":"Pending"}
              </option>)}
            </Select>
          </label>
          <Button type="button" size="sm" variant="secondary"
            disabled={submissions.findIndex(item=>item.id===selectedSubmissionId)<=0}
            onClick={()=>setSelectedSubmissionId(current=>submissions[Math.max(0,submissions.findIndex(item=>item.id===current)-1)].id)}>
            Previous student
          </Button>
          <span className="text-xs text-muted-foreground">
            {Math.max(1,submissions.findIndex(item=>item.id===selectedSubmissionId)+1)} / {submissions.length}
          </span>
          <Button type="button" size="sm" variant="secondary"
            disabled={submissions.findIndex(item=>item.id===selectedSubmissionId)>=submissions.length-1}
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
        <Button type="button" size="sm" variant="secondary" disabled={loading||pagination.page<=1}
          onClick={()=>void load({filter,page:pagination.page-1})}>Previous</Button>
        <Button type="button" size="sm" variant="secondary" disabled={loading||pagination.page>=pagination.totalPages}
          onClick={()=>void load({filter,page:pagination.page+1})}>Next</Button>
      </nav> : null}
      </div>
      </Drawer>
    </>
  );
}
