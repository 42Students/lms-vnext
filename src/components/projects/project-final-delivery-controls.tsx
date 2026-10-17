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
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {ProjectDeliveryFileUploader} from "./project-delivery-file-uploader";

type Submission = {
  id: string;
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
  function markSaved(snapshot:string){lastSavedSnapshot.current=snapshot;setSavedSnapshot(snapshot);}
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
    setSummary(draft?.summary ?? "");
    setSourceUrl(draft?.sourceUrl ?? "");
    setDemoUrl(draft?.demoUrl ?? "");
    setNotes(draft?.notes ?? "");
    setAttachments(safeDraftAttachments(draft?.attachments));
    setLinkName("");setLinkUrl("");setAutosaveStatus("idle");
    failedSnapshot.current=null;
    markSaved(JSON.stringify({
      summary:(draft?.summary??"").trim(),
      sourceUrl:draft?.sourceUrl?.trim()||undefined,
      demoUrl:draft?.demoUrl?.trim()||undefined,
      notes:draft?.notes?.trim()||undefined,
      attachments:safeDraftAttachments(draft?.attachments),
    }));
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await projectMutation(
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
        },
      );
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
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the final draft.",
      );
    } finally {
      setPending(false);
    }
  }

  useEffect(()=>{
    if(!open||!draft||pending||!summary.trim())return;
    const payload=currentPayload();
    const snapshot=JSON.stringify(payload);
    if(snapshot===lastSavedSnapshot.current||snapshot===failedSnapshot.current)return;
    const timer=window.setTimeout(async()=>{
      setAutosaveStatus("saving");setPending(true);
      try{
        await projectMutation(
          `/api/projects/${projectId}/submissions/${draft.id}`,
          "PATCH",payload,
        );
        markSaved(snapshot);
        failedSnapshot.current=null;
        setAutosaveStatus("saved");
      }catch{
        failedSnapshot.current=snapshot;
        setAutosaveStatus("failed");
      }finally{
        setPending(false);
      }
    },1800);
    return ()=>window.clearTimeout(timer);
  },[open,draft,projectId,summary,sourceUrl,demoUrl,notes,attachments,pending]);

  const unsaved=JSON.stringify(currentPayload())!==savedSnapshot;

  async function submitDraft() {
    if (!draft) return;
    const hasEvidence=Boolean(draft.sourceUrl||draft.demoUrl||
      draft.attachments?.some(item=>Boolean(item)&&typeof item==="object"&&
        (item as {kind?:unknown}).kind==="FILE"));
    if(!draft.summary.trim()||!hasEvidence){
      showToast({tone:"error",title:"Add at least one attachment and a summary before submitting."});
      return;
    }
    if(!window.confirm("Submit on behalf of your team?"))return;
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/submissions/${draft.id}/submit`,
        "POST",
      );
      showToast({
        tone: "success",
        title: "Submission sent for review.",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not submit final delivery",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  if (!canCreateDraft && !draft) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
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
          disabled={
            pending || !canSubmitDraft
          }
          onClick={submitDraft}
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
        {review?.feedback?<p className="whitespace-pre-wrap rounded-lg border border-border p-3">
          Mentor feedback: {review.feedback}
        </p>:null}
        {latest?.status==="APPROVED"?<p role="status">Accepted · Your final delivery is locked after approval.</p>:null}
      </div>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={
          draft
            ? "Edit final draft"
            : "Create final draft"
        }
        description="Drafts can be prepared early. Final submission unlocks after Project execution is complete."
      >
        <section aria-label="What is left before you can submit" className="mb-3 rounded-lg border border-border p-3 text-sm text-body">
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
          className="grid gap-4"
        >
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
          <div className="grid gap-2">
            <p className="m-0 text-sm font-semibold text-body">Additional files &amp; links</p>
            <ProjectDeliveryFileUploader projectId={projectId}
              disabled={pending||attachments.length>=10}
              onUploaded={item=>setAttachments(rows=>rows.length>=10?rows:[...rows,item])}/>
            {attachments.map((item,index)=><div key={index} className="flex items-center gap-2 text-sm">
              <span className="min-w-0 flex-1 break-words">{item.name}</span>
              <Button type="button" size="sm" variant="secondary" disabled={pending}
                onClick={()=>setAttachments(rows=>rows.filter((_,i)=>i!==index))}>Remove</Button>
            </div>)}
            <label className="grid gap-1 text-xs font-semibold text-body">Title
              <Input value={linkName} maxLength={255} onChange={event=>setLinkName(event.target.value)}/>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-body">URL
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
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                pending || !summary.trim()
              }
            >
              {pending ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </form>
      </Dialog>
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
  const [confirmReview,setConfirmReview]=useState(false);
  const [staleReview,setStaleReview]=useState(false);
  const [decision, setDecision] = useState<
    "APPROVED" | "CHANGES_REQUESTED"
  >("APPROVED");
  const [feedback, setFeedback] =
    useState("");
  const [pending, setPending] =
    useState(false);
  const [staleReview, setStaleReview] = useState(false);
  function discardDraft(){
    setOpen(false);setFeedback("");setDecision("APPROVED");setStaleReview(false);
  }
  const guard=useProjectEditorDiscardGuard(open,
    Boolean(feedback.trim())||(mode!=="MENTOR"&&decision!=="APPROVED"),
    pending,discardDraft);

  async function review() {
    if (
      decision === "CHANGES_REQUESTED" &&
      !feedback.trim()
    ) {
      return;
    }

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
      if(caught instanceof Error && "status" in caught && caught.status===409){
        setStaleReview(true);
      }
      setConfirmReview(false);
      showToast({
        tone: "error",
        title: "Submission review could not be saved",
        description: caught instanceof Error?caught.message:"Refresh the review and try again.",
      });
    } finally {
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
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={guard.requestClose}
            >
              Cancel
            </Button>
            <Button variant="secondary" disabled={pending||!feedback.trim()}
              onClick={()=>{setDecision("CHANGES_REQUESTED");setConfirmReview(true);}}>
              Request changes
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {staleReview?<p role="alert" className="rounded-md border border-border p-3 text-sm text-body">
            This submission may have changed since you opened this review.
            Refresh the page to load the latest version before accepting, requesting changes, or locking.
          </p>:null}
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
    if (!valid) return;

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
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the evaluation.",
      );
    } finally {
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
          className="grid gap-4"
        >
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-muted p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem]">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-body">
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
                  <span className="mb-1 block text-xs font-semibold text-body">
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
                  <span className="mb-1 block text-xs font-semibold text-body">
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
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold text-body">
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
            <span className="mb-1 block text-xs font-semibold text-body">
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

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={guard.requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
