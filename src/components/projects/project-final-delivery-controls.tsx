"use client";

import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { FriendlyFetchError } from "@/lib/api-fetch";
import { friendlyApiError } from "@/lib/friendly-error";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {ProjectDeliveryFileUploader} from "./project-delivery-file-uploader";
import {savedDeliverySubmissionReadiness} from "@/modules/projects/saved-delivery-submission-readiness";
import {finalDeliveryUserError} from "@/modules/projects/final-delivery-user-error";

type Submission = {
  id: string;
  updatedAt: Date | string;
  version: number;
  status: string;
  summary: string;
  sourceUrl: string | null;
  demoUrl: string | null;
  notes: string | null;
  attachments?: unknown[];
};

type DeliveryAttachment={kind:"FILE"|"LINK";name:string;fileId:string|null;url:string|null};
function safeDraftAttachments(items:unknown[]|undefined):DeliveryAttachment[]{
  return (items??[]).filter((item):item is DeliveryAttachment=>{
    if(!item||typeof item!=="object")return false;
    const row=item as Record<string,unknown>;
    return (row.kind==="FILE"||row.kind==="LINK")&&typeof row.name==="string"&&
      (row.fileId===null||typeof row.fileId==="string")&&
      (row.url===null||typeof row.url==="string");
  });
}

export function LearnerFinalDeliveryControl({
  projectId,
  latest,
  canCreateDraft,
  canSubmitDraft,
  review,
  lastEditedBy,
  readinessDetail,
}: {
  projectId: string;
  readinessDetail?:{tasksRemaining:number;sprintsRemaining:number;releasesRemaining:number};
  review?:{status:string;feedback:string|null}|null;
  lastEditedBy?:string|null;
  latest: Submission | null;
  canCreateDraft: boolean;
  canSubmitDraft: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const draft =
    latest?.status === "DRAFT" ? latest : null;
  const [open, setOpen] = useState(() =>
    searchParams.get("tab") === "delivery" && (Boolean(draft) || canCreateDraft)
  );
  const [summary, setSummary] = useState(
    draft?.summary ?? "",
  );
  const [sourceUrl, setSourceUrl] = useState(
    draft?.sourceUrl ?? "",
  );
  const [demoUrl, setDemoUrl] = useState(
    draft?.demoUrl ?? "",
  );
  const [notes, setNotes] = useState(
    draft?.notes ?? "",
  );
  const [attachments,setAttachments]=useState<DeliveryAttachment[]>(safeDraftAttachments(draft?.attachments));
  const [linkName,setLinkName]=useState("");
  const [linkUrl,setLinkUrl]=useState("");
  const [pending, setPending] =
    useState(false);
  const [submitConfirmation,setSubmitConfirmation]=useState(false);
  // One shared lock for manual save, debounced autosave and final submission.
  const pendingRef = useRef(false);
  const [error, setError] =
    useState<string | null>(null);
  const [autosaveStatus,setAutosaveStatus]=useState<"idle"|"saving"|"saved"|"failed">("idle");
  const failedSnapshot=useRef<string|null>(null);
  const [savedSnapshot,setSavedSnapshot]=useState(()=>JSON.stringify({
    summary:(draft?.summary??"").trim(),
    sourceUrl:draft?.sourceUrl?.trim()||undefined,
    demoUrl:draft?.demoUrl?.trim()||undefined,
    notes:draft?.notes?.trim()||undefined,
    attachments:safeDraftAttachments(draft?.attachments),
  }));
  const lastSavedSnapshot=useRef(savedSnapshot);
  const lastSavedUpdatedAt=useRef(draft?.updatedAt ? new Date(draft.updatedAt).toISOString() : null);
  // Only a server response to THIS client's own save advances the token.
  // A router refresh may introduce another teammate's new draft; adopting its
  // timestamp would incorrectly let stale local inputs overwrite their work.
  // In that case the missing token requires an explicit page reload instead.
  function markSaved(snapshot:string){lastSavedSnapshot.current=snapshot;setSavedSnapshot(snapshot);}
  function acknowledgedDraftRevision(result:unknown):string {
    const submission=result&&typeof result==="object"&&"submission" in result
      ? (result as {submission?:unknown}).submission : null;
    const token=submission&&typeof submission==="object"&&"updatedAt" in submission
      ? (submission as {updatedAt?:unknown}).updatedAt : null;
    if(typeof token!=="string"||!Number.isFinite(Date.parse(token))){
      throw new Error("Could not confirm the draft revision. Refresh before editing again.");
    }
    return new Date(token).toISOString();
  }
  function currentPayload(){
    return {
      summary:summary.trim(),
      sourceUrl:sourceUrl.trim()||undefined,
      demoUrl:demoUrl.trim()||undefined,
      notes:notes.trim()||undefined,
      attachments,
    };
  }

  function resetFromDraft() {
    // Use the last acknowledged server write, which may be newer than props
    // until router.refresh() finishes. Reopening must not discard autosaved work.
    const persisted=JSON.parse(lastSavedSnapshot.current) as {
      summary:string;sourceUrl?:string;demoUrl?:string;notes?:string;
      attachments?:DeliveryAttachment[];
    };
    setSummary(persisted.summary??"");
    setSourceUrl(persisted.sourceUrl??"");
    setDemoUrl(persisted.demoUrl??"");
    setNotes(persisted.notes??"");
    setAttachments(safeDraftAttachments(persisted.attachments));
    setLinkName("");setLinkUrl("");setAutosaveStatus("idle");
    failedSnapshot.current=null;
    markSaved(lastSavedSnapshot.current);
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (pendingRef.current) return;
    pendingRef.current = true;
    setError(null);
    setPending(true);
    try {
      if(draft&&!lastSavedUpdatedAt.current){
        throw new Error("Refresh this final draft to get its latest revision before saving.");
      }
      const result = await projectMutation(
        draft
          ? `/api/projects/${projectId}/submissions/${draft.id}`
          : `/api/projects/${projectId}/submissions`,
        draft ? "PATCH" : "POST",
        {
          summary: summary.trim(),
          sourceUrl:
            sourceUrl.trim() || undefined,
          demoUrl:
            demoUrl.trim() || undefined,
          notes: notes.trim() || undefined,
          attachments,
          ...(draft ? {expectedUpdatedAt:lastSavedUpdatedAt.current} : {}),
        },
      );
      // Never acknowledge a save without its new server-issued revision.
      lastSavedUpdatedAt.current=acknowledgedDraftRevision(result);
      markSaved(JSON.stringify(currentPayload()));
      failedSnapshot.current=null;
      setAutosaveStatus("saved");
      setOpen(false);
      showToast({
        tone: "success",
        title: draft
          ? "Draft saved."
          : "Draft saved.",
      });
      router.refresh();
    } catch (caught) {
      setError(finalDeliveryUserError(caught));
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  useEffect(()=>{
    if(!open||!draft||pending||!summary.trim())return;
    const payload=currentPayload();
    const snapshot=JSON.stringify(payload);
    if(snapshot===lastSavedSnapshot.current||snapshot===failedSnapshot.current)return;
    const timer=window.setTimeout(async()=>{
      if(pendingRef.current)return;
      pendingRef.current=true;
      setAutosaveStatus("saving");setPending(true);
      try{
        if(!lastSavedUpdatedAt.current){
          failedSnapshot.current=snapshot;
          setAutosaveStatus("failed");
          return;
        }
        const result=await projectMutation(
          `/api/projects/${projectId}/submissions/${draft.id}`,
          "PATCH",{...payload,expectedUpdatedAt:lastSavedUpdatedAt.current},
        );
        lastSavedUpdatedAt.current=acknowledgedDraftRevision(result);
        markSaved(snapshot);
        failedSnapshot.current=null;
        setAutosaveStatus("saved");
      }catch{
        failedSnapshot.current=snapshot;
        setAutosaveStatus("failed");
      }finally{
        pendingRef.current=false;
        setPending(false);
      }
    },1800);
    return ()=>window.clearTimeout(timer);
  },[open,draft,projectId,summary,sourceUrl,demoUrl,notes,attachments,pending]);

  const unsaved=JSON.stringify(currentPayload())!==savedSnapshot;

  async function submitDraft(confirmed=false) {
    if (!draft || pendingRef.current) return;
    if(!canSubmitDraft){
      showToast({tone:"error",title:"Complete the project checklist before submitting final work."});
      return;
    }
    if(!lastSavedUpdatedAt.current){
      showToast({tone:"error",title:"Refresh this final draft before submitting."});
      return;
    }
    // Server-acknowledged values can be newer than RSC props after autosave.
    const readiness=savedDeliverySubmissionReadiness(currentPayload(),lastSavedSnapshot.current);
    if(readiness==="UNSAVED"){
      showToast({tone:"error",title:"Save your latest changes before submitting."});
      return;
    }
    if(readiness==="MISSING_EVIDENCE"){
      showToast({tone:"error",title:"Add at least one attachment and a summary before submitting."});
      return;
    }
    if(!confirmed){setSubmitConfirmation(true);return;}
    pendingRef.current=true;
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/submissions/${draft.id}/submit`,
        "POST",
        {expectedUpdatedAt:lastSavedUpdatedAt.current},
      );
      setSubmitConfirmation(false);
      showToast({
        tone: "success",
        title: "Submission sent for review.",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not submit final delivery",
        description:finalDeliveryUserError(caught),
      });
    } finally {
      pendingRef.current=false;
      setPending(false);
    }
  }

  if (!canCreateDraft && !draft) {
    return null;
  }

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
      {(canCreateDraft || draft) ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            resetFromDraft();
            setOpen(true);
          }}
        >
          {draft
            ? "Edit final draft"
            : "Create final draft"}
        </Button>
      ) : null}
      {draft ? (
        <Button
          size="sm"
          loading={pending}
          disabled={
            pending || !canSubmitDraft
          }
          onClick={()=>{void submitDraft();}}
          aria-describedby={!canSubmitDraft ? "delivery-ready-reason-" + projectId : undefined}
        >
          {pending
            ? "Submitting…"
            : "Submit final work"}
        </Button>
      ) : null} 
      {draft && !canSubmitDraft ? (
        <p id={"delivery-ready-reason-" + projectId} role="status"
          className="w-full text-xs leading-5 text-body">
          Complete every release, sprint and task before submitting.
          You can save your final draft in the meantime.
        </p>
      ) : null}

      <div className="w-full space-y-2 text-sm text-body">
        <p>Team submission · The final delivery is shared with your project team.</p>
        {lastEditedBy?<p>Last edited by <strong>{lastEditedBy}</strong></p>:null}
        <p>Mentor review: <strong>{review?.status?.replaceAll("_"," ")??"Waiting for review"}</strong></p>
        {review?.feedback?<p className="whitespace-pre-wrap break-words border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)]">
          Mentor feedback: {review.feedback}
        </p>:null}
        {latest?.status==="APPROVED"?<p role="status">Accepted · Your final delivery is locked after approval.</p>:null}
      </div>
      <Dialog
        open={open}
        onOpenChange={next=>{if(!pending)setOpen(next);}}
        title={
          draft
            ? "Edit final draft"
            : "Create final draft"
        }
        description="Drafts can be prepared early. Final submission unlocks after Project execution is complete."
      >
        <section aria-label="What is left before you can submit" className="mb-[var(--lms-space-4)] min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
          <h3 className="font-semibold text-foreground">What’s left before you can submit</h3>
          {canSubmitDraft?<p className="mt-1">Ready to submit after saving this draft.</p>:<ul className="mt-2 list-disc space-y-1 pl-5">
            <li>{readinessDetail?.tasksRemaining??"Some"} task(s) still need completion</li>
            <li>{readinessDetail?.sprintsRemaining??"Some"} sprint(s) need sign-off</li>
            <li>{readinessDetail?.releasesRemaining??"Some"} release(s) need completion</li>
          </ul>}
        </section>
        {review?.feedback?<p className="mb-3 text-sm text-body">Mentor review: {review.status}. {review.feedback}</p>:null}
        <p className="mb-3 text-xs text-body" role="status" aria-live="polite">
          {!draft?"Save draft":
            autosaveStatus==="saving"?"Saving…":
            autosaveStatus==="failed"?"Couldn't autosave — use Save draft":
            unsaved?"Unsaved changes…":"Draft saved"}
        </p>
        <form
          onSubmit={save}
          className="grid min-w-0 gap-[var(--lms-space-4)]"
        >
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Summary (short)
            </span>
            <Textarea
              required
              maxLength={6000}
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="Short summary of what was submitted"
            />
          </label>
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Primary link
            </span>
            <Input
              type="url"
              value={sourceUrl}
              maxLength={2048}
              placeholder="Paste a link, or upload a file below"
              onChange={(event) =>
                setSourceUrl(
                  event.target.value,
                )
              }
            />
          </label>
          <details className="min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-2)]">
          <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Demo URL · Notes</summary>
          <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-4)]">
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Demo URL
            </span>
            <Input
              type="url"
              value={demoUrl}
              maxLength={2048}
              placeholder="https://…"
              onChange={(event) =>
                setDemoUrl(event.target.value)
              }
            />
          </label>
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Notes
            </span>
            <Textarea
              value={notes}
              maxLength={6000}
              placeholder="Add any final notes"
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />
          </label>
          </div>
          </details>
          <div className="grid min-w-0 gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]">
            <p className="m-0 text-sm font-semibold text-body">Additional files &amp; links</p>
            <ProjectDeliveryFileUploader projectId={projectId}
              disabled={pending||attachments.length>=10}
              onUploaded={item=>setAttachments(rows=>rows.length>=10?rows:[...rows,item])}/>
            {attachments.map((item,index)=><div key={index} className="flex min-w-0 flex-col gap-[var(--lms-space-2)] border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-2)] text-[var(--lms-font-base)] sm:flex-row sm:items-center">
              <span className="min-w-0 flex-1 break-words">{item.name}</span>
              <Button className="w-full sm:w-auto" type="button" size="sm" variant="secondary" disabled={pending}
                onClick={()=>setAttachments(rows=>rows.filter((_,i)=>i!==index))}>Remove</Button>
            </div>)}
            <details className="min-w-0">
             <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Add link</summary>
             <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)]">
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Title
              <Input value={linkName} maxLength={255} onChange={event=>setLinkName(event.target.value)}/>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">URL
              <Input type="url" value={linkUrl} maxLength={2048}
                onChange={event=>setLinkUrl(event.target.value)}/>
            </label>
            <Button type="button" size="sm" variant="secondary" disabled={pending||
                attachments.length>=10||!linkName.trim()||!/^https?:\/\//.test(linkUrl)}
              onClick={()=>{setAttachments(rows=>[...rows,{kind:"LINK",name:linkName.trim(),
                url:linkUrl.trim(),fileId:null}]);setLinkName("");setLinkUrl("");}}>
              Add link
            </Button>
             </div>
            </details>
          </div>
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={pending}
              disabled={
                pending || !summary.trim()
              }
            >
              {pending ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog open={submitConfirmation}
        onOpenChange={next=>{if(!next&&!pending)setSubmitConfirmation(false);}}
        title="Submit on behalf of your team?"
        description="The final delivery is shared with your project team and cannot be edited while it awaits review."
        confirmLabel="Submit final work" pending={pending}
        onConfirm={()=>{void submitDraft(true);}} />
    </div>
  );
}

export function FinalReviewControl({
  projectId,
  submissionId,
  mode,
  expectedUpdatedAt,
}: {
  projectId: string;
  submissionId: string;
  mode: "MENTOR" | "ADMIN" | "LEARNER";
  expectedUpdatedAt: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const openedFromDeliveryLink = useRef(false);
  const [confirmReview,setConfirmReview]=useState(false);
  const [staleReview,setStaleReview]=useState(false);
  const [decision, setDecision] = useState<
    "APPROVED" | "CHANGES_REQUESTED"
  >("APPROVED");
  const [feedback, setFeedback] =
    useState("");
  const [pending, setPending] =
    useState(false);
  const reviewInFlight=useRef(false);
  // The legacy mentor ?tab=delivery link opens one review on entry.
  // A dismissal must not immediately reopen it while the URL is unchanged.
  useEffect(() => {
    if (mode !== "MENTOR" || searchParams.get("tab") !== "delivery" ||
        openedFromDeliveryLink.current) return;
    openedFromDeliveryLink.current = true;
    setDecision("APPROVED");
    setOpen(true);
  }, [mode, searchParams]);
  function discardDraft(){
    setOpen(false);setFeedback("");setDecision("APPROVED");setStaleReview(false);
  }
  const guard=useProjectEditorDiscardGuard(open||confirmReview,
    Boolean(feedback.trim())||(mode!=="MENTOR"&&decision!=="APPROVED"),
    pending,discardDraft);

  async function review() {
    // A failed optimistic version check must be refreshed before either action.
    if (pending || reviewInFlight.current || staleReview) return;
    if (
      decision === "CHANGES_REQUESTED" &&
      !feedback.trim()
    ) {
      return;
    }

    reviewInFlight.current=true;
    setPending(true);
    try {
      await projectMutation(
        mode==="MENTOR"?`/api/projects/${projectId}/submissions/${submissionId}/mentor-decision`:`/api/projects/${projectId}/submissions/${submissionId}/review`,
        "POST",
        {
          decision,
          ...(mode==="MENTOR"?{expectedUpdatedAt,confirmed:true}:{}),
          feedback:
            feedback.trim() || undefined,
        },
      );
      setOpen(false);
      setConfirmReview(false);
      setStaleReview(false);
      setFeedback("");
      showToast({
        tone: "success",
        title:
          decision === "APPROVED"
            ? "Submission accepted."
            : "Changes requested."
      });
      router.refresh();
    } catch (caught) {
      if(caught instanceof FriendlyFetchError && caught.status===409){
        setStaleReview(true);
      }
      setConfirmReview(false);
      setOpen(true);
      showToast({
        tone: "error",
        title: "Submission review could not be saved",
        description: caught instanceof FriendlyFetchError?caught.message:friendlyApiError({}),
      });
    } finally {
      reviewInFlight.current=false;
      setPending(false);
    }
  }

  return (
    <>
      {mode==="MENTOR" ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => {
            setDecision("APPROVED"); setStaleReview(false); setOpen(true);
          }}>Accept submission</Button>
          <Button size="sm" variant="secondary" onClick={() => {
            setDecision("CHANGES_REQUESTED"); setStaleReview(false); setOpen(true);
          }}>Request changes</Button>
        </div>
      ) : (
        <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
          Review final delivery
        </Button>
      )}
      <Dialog
        open={open}
        onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
        title={mode==="MENTOR" ? (decision==="APPROVED"
          ? "Accept this submission?" : "Request changes on this submission?") : "Review submission"}
        description={mode==="MENTOR"
          ? (decision==="APPROVED"
            ? "The learner will be notified their submission was accepted."
            : "The learner will see your feedback and be able to edit and resubmit it.")
          : "Confirm your decision and feedback. The review will be saved in this project's history."}
        footer={
          <div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto" variant="secondary" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
            <Button className="w-full sm:w-auto" loading={pending} disabled={pending||staleReview||(decision==="CHANGES_REQUESTED"&&!feedback.trim())}
              onClick={()=>{setOpen(false);setConfirmReview(true);}}>{decision==="APPROVED"?"Accept submission":"Request changes"}</Button>
          </div>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)]">
          {mode!=="MENTOR" ? <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Decision
            <Select value={decision} onChange={event=>setDecision(event.target.value as "APPROVED"|"CHANGES_REQUESTED")}>
              <option value="APPROVED">Accept</option>
              <option value="CHANGES_REQUESTED">Request changes</option>
            </Select>
          </label> : null}
          {staleReview?<div role="alert" className="space-y-[var(--lms-space-2)] border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
            <p>This submission may have changed since you opened this review. Refresh before accepting, requesting changes, or locking.</p>
            <Button type="button" variant="secondary" disabled={pending}
              onClick={()=>{setConfirmReview(false);setOpen(false);setStaleReview(false);router.refresh();}}>
              Refresh latest submission
            </Button>
          </div>:null}
          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Feedback
            </span>
            <Textarea
              value={feedback}
              maxLength={6000}
              onChange={(event) =>
                setFeedback(event.target.value)
              }
              placeholder={
                decision === "CHANGES_REQUESTED"
                  ? "Explain the required revision…"
                  : "Optional approval note…"
              }
            />
          </label>
        </div>
      </Dialog>
      <ConfirmDialog open={confirmReview} onOpenChange={next=>{if(!pending){setConfirmReview(next);if(!next)setOpen(true);}}}
        title={decision==="APPROVED"?"Accept this submission?":"Request changes on this submission?"}
        description={decision==="APPROVED"
          ?"The submission will be accepted and the student will see the decision."
          :"The student will receive your feedback and can submit a revision."}
        confirmLabel={decision==="APPROVED"?"Accept submission":"Request changes"}
        confirmDisabled={decision==="CHANGES_REQUESTED"&&!feedback.trim()}
        pending={pending} onConfirm={()=>void review()}/>
      <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
        title="Discard final review feedback?"
        description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
    </>
  );
}

type EvaluationRow = {
  criterion: string;
  score: string;
  maxScore: string;
  feedback: string;
};

function emptyEvaluationRow(): EvaluationRow {
  return {
    criterion: "",
    score: "",
    maxScore: "",
    feedback: "",
  };
}

export function ProjectEvaluationControl({
  projectId,
  submissionId,
}: {
  projectId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [rows, setRows] = useState<
    EvaluationRow[]
  >([emptyEvaluationRow()]);
  const [pending, setPending] =
    useState(false);
  const evaluationInFlight=useRef(false);
  const [error, setError] =
    useState<string | null>(null);
  const dirty=Boolean(summary.trim())||rows.length!==1||
    rows.some(row=>Boolean(row.criterion||row.score||row.maxScore||row.feedback));
  function discardDraft(){setOpen(false);setSummary("");setRows([emptyEvaluationRow()]);setError(null);}
  const guard=useProjectEditorDiscardGuard(open,dirty,pending,discardDraft);

  const valid = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((row) => {
        const score = Number(row.score);
        const maxScore = Number(
          row.maxScore,
        );
        return (
          row.criterion.trim().length > 0 &&
          Number.isInteger(score) &&
          Number.isInteger(maxScore) &&
          score >= 0 &&
          maxScore > 0 &&
          score <= maxScore
        );
      }),
    [rows],
  );

  function updateRow(
    index: number,
    patch: Partial<EvaluationRow>,
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, ...patch }
          : row,
      ),
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!valid || evaluationInFlight.current) return;

    evaluationInFlight.current=true;
    setPending(true);
    setError(null);
    try {
      await projectMutation(
        `/api/projects/${projectId}/submissions/${submissionId}/evaluation`,
        "POST",
        {
          summary: summary.trim() || undefined,
          items: rows.map((row) => ({
            criterion: row.criterion.trim(),
            score: Number(row.score),
            maxScore: Number(row.maxScore),
            feedback:
              row.feedback.trim() || undefined,
          })),
        },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: "Project evaluation recorded",
      });
      router.refresh();
    } catch (caught) {
      setError(finalDeliveryUserError(caught));
    } finally {
      evaluationInFlight.current=false;
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        Evaluate project
      </Button>
      <Dialog
        open={open}
        onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
        title="Evaluate approved project"
        description="Score explicit criteria. The total is derived from these rubric rows."
      >
        <form
          onSubmit={submit}
          className="grid min-w-0 gap-[var(--lms-space-4)]"
        >
          {rows.map((row, index) => (
            <div
              key={index}
              className="min-w-0 border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-3)]"
            >
              <div className="grid min-w-0 gap-[var(--lms-space-3)] sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
                <label>
                  <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Criterion
                  </span>
                  <Input
                    value={row.criterion}
                    maxLength={240}
                    onChange={(event) =>
                      updateRow(index, {
                        criterion:
                          event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Score
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={row.score}
                    onChange={(event) =>
                      updateRow(index, {
                        score:
                          event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                    Max
                  </span>
                  <Input
                    type="number"
                    min={1}
                    value={row.maxScore}
                    onChange={(event) =>
                      updateRow(index, {
                        maxScore:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label className="mt-3 block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
                  Feedback
                </span>
                <Textarea
                  value={row.feedback}
                  maxLength={4000}
                  onChange={(event) =>
                    updateRow(index, {
                      feedback:
                        event.target.value,
                    })
                  }
                />
              </label>
              {rows.length > 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() =>
                    setRows((current) =>
                      current.filter(
                        (_, rowIndex) =>
                          rowIndex !== index,
                      ),
                    )
                  }
                >
                  Remove criterion
                </Button>
              ) : null}
            </div>
          ))}

          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={rows.length >= 20}
            onClick={() =>
              setRows((current) => [
                ...current,
                emptyEvaluationRow(),
              ])
            }
          >
            Add criterion
          </Button>

          <label>
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Overall summary
            </span>
            <Textarea
              value={summary}
              maxLength={6000}
              onChange={(event) =>
                setSummary(event.target.value)
              }
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}

          <div className="flex min-w-0 flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={pending}
              onClick={guard.requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              loading={pending}
              disabled={pending || !valid}
            >
              {pending
                ? "Saving…"
                : "Record evaluation"}
            </Button>
          </div>
        </form>
      </Dialog>
      <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
        title="Discard project evaluation?"
        description="You have unsaved project changes. Leave this page and discard them?"
        confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
    </>
  );
}
