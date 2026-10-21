"use client";
import { Button } from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";

import { useRouter } from "next/navigation";
import { useId, useRef, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api-fetch";
import { projectReadinessLegacyCopy as copy } from "@/modules/projects/readiness-override-copy";
import type { ReadinessOverrideState } from "@/modules/projects/readiness-override-model";

export function ProjectReadinessOverrideForm({
  projectId,
  initialState,
  initialNote,
  hasSubmission = false,
  compactLayout = false,
}: {
  projectId: string;
  initialState: ReadinessOverrideState | null;
  initialNote: string | null;
  hasSubmission?: boolean;
  compactLayout?: boolean;
}) {
  const router = useRouter();
  const overrideId=useId();
  const {showToast}=useToast();
  const [state, setState] = useState<ReadinessOverrideState | "">(initialState ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [liveHasSubmission,setLiveHasSubmission]=useState(hasSubmission);
  const [checking,setChecking]=useState(false);
  const gateSnapshot=useRef<boolean|null>(null);

  function chooseOverride(nextState:ReadinessOverrideState) {
    if(nextState!==state&&nextState!=="CLEAR"&&
       (state!==""&&state!=="CLEAR"||(initialState!==null&&nextState!==initialState))) {
      setNote("");
    }
    setState(nextState);
    setFeedback(null);
  }

  async function readSubmissionGate(){
    const response=await fetch("/api/projects/"+encodeURIComponent(projectId)+"/readiness",
      {credentials:"same-origin",cache:"no-store"});
    if(!response.ok)throw new Error("Readiness could not be loaded. Refresh before applying an override.");
    const body=await response.json() as {readiness?:{
      finalSubmission?:{latest?:{id:string}|null}
    }};
    if(!body.readiness)throw new Error("Readiness could not be loaded.");
    return Boolean(body.readiness.finalSubmission?.latest);
  }
  async function requestSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current||checking) return;
    if (!state) { setFeedback("Choose an override state"); return; }
    if (state !== "CLEAR" && !note.trim()) {
      setFeedback(copy.noteRequired);return;
    }
    setFeedback(null);setChecking(true);
    try{
      const current=await readSubmissionGate();
      setLiveHasSubmission(current);
      gateSnapshot.current=current;
      if(current!==hasSubmission){
        setFeedback("Submission status changed. Refresh readiness before applying an override.");
        return;
      }
      setConfirmOpen(true);
    }catch(error){
      setFeedback(error instanceof Error?error.message:"Readiness could not be loaded.");
    }finally{setChecking(false);}
  }

  async function save() {
    if (pendingRef.current || !state) return;
    pendingRef.current = true;
    setPending(true);
    setFeedback(null);
    try {
      // Recheck immediately before mutating, not only when opening the dialog.
      const current=await readSubmissionGate();
      setLiveHasSubmission(current);
      if(gateSnapshot.current===null||current!==gateSnapshot.current){
        setConfirmOpen(false);
        throw new Error("Submission status changed. Refresh readiness before retrying.");
      }
      await apiFetch("/api/projects/" + encodeURIComponent(projectId) + "/readiness/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state === "CLEAR" ? { state } : { state, note: note.trim() }),
      });
      setConfirmOpen(false);
      setFeedback(copy.updated);
      showToast({tone:"success",title:copy.updated});
      router.refresh();
    } catch (error) {
      // Keep the selected direction and the entered note for a safe retry.
      const detail=error instanceof Error&&error.message.trim()?error.message:copy.failed;
      setFeedback(detail);
      showToast({tone:"error",title:copy.failed,description:detail});
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <form onSubmit={requestSave} className={compactLayout?"min-w-0 space-y-[var(--lms-space-4)] pb-[var(--lms-space-4)]":"min-w-0 space-y-[var(--lms-space-4)] border-b border-border pb-[var(--lms-space-5)]"}>
        {compactLayout?null:<h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">{copy.overrideTitle}</h2>}
        {feedback&&!confirmOpen ? <Alert tone={feedback === copy.updated ? "success" : "error"} role={feedback === copy.updated ? "status" : "alert"}>{feedback}</Alert> : null}
        {liveHasSubmission && state !== "CLEAR" ? (
          <Alert tone="warning">
            Force Unlock/Block will have no effect here while a submission already exists.
            Review or reopen the delivery first, then return to readiness before allowing a new submission.
            This manual override is recorded but cannot unlock a workspace with a final submission.
            Ask the mentor or college administrator to resolve that submission before applying again.
          </Alert>
        ) : null}
        <fieldset className="min-w-0 space-y-2" disabled={pending||checking}>
          <legend className="mb-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{copy.stateLabel}</legend>
          <div className="flex min-w-0 flex-wrap gap-2" role="radiogroup" aria-label="Override state">
            {([
              {value:"FORCE_UNLOCK" as const,label:copy.unlock},
              {value:"FORCE_BLOCK" as const,label:copy.block},
              ...(initialState&&initialState!=="CLEAR"?[{value:"CLEAR" as const,label:copy.clear}]:[]),
            ]).map(option=><label key={option.value} htmlFor={overrideId+option.value} className="min-w-0">
              <input id={overrideId+option.value} type="radio" name={overrideId+"-override"}
                value={option.value} checked={state===option.value}
                onChange={()=>chooseOverride(option.value)}
                className="peer sr-only"/>
              <span className={"inline-flex min-h-11 cursor-pointer items-center rounded-lg border px-4 text-sm font-semibold md:min-h-9 "+
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-[var(--lms-primary)] "+
                (state===option.value?"border-primary bg-primary text-white":"border-border bg-surface text-body hover:border-primary hover:bg-primary-subtle")}>
                {option.label}
              </span>
            </label>)}
          </div>
        </fieldset>
        {Boolean(state) && state !== "CLEAR" ? (
          <div className="grid min-w-0 gap-[6px]">
            <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]" htmlFor="project-readiness-note">{copy.note}</label>
            <Textarea
              id="project-readiness-note"
              value={note}
              disabled={pending}
              required
              aria-invalid={feedback === copy.noteRequired && !note.trim()}
              onChange={(event) => { setNote(event.target.value); setFeedback(null); }}
              placeholder={copy.notePlaceholder}
              maxLength={2000}
              rows={3}
              className="w-full"
            />
            <p className="text-right text-xs tabular-nums text-muted-foreground" aria-live="polite">
              {note.length} / 2000 characters
            </p>
          </div>
        ) : null}
        <div className="flex min-w-0 justify-stretch md:justify-end">
        <Button type="submit" variant="primary" loading={pending||checking} disabled={pending||checking||!state} className="min-h-11 w-full md:min-h-9 md:w-auto">
          {checking?"Checking readiness…":copy.submit}
        </Button>
        </div>
      </form>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={next=>{if(!pending)setConfirmOpen(next);}}
        title={state === "CLEAR" ? copy.clearConfirm : copy.applyConfirm}
        description={state === "CLEAR" ? "The manual override will be removed." :
          "This changes the learner's ability to make a final delivery. The chosen override and your note will be visible to mentors and learners."}
        confirmLabel="Apply override"
        confirmVariant="primary"
        pending={pending}
        onConfirm={() => { void save(); }}
      >
        {feedback && feedback !== copy.updated ? <Alert tone="error" role="alert">{feedback}</Alert> : null}
      </ConfirmDialog>
    </>
  );
}
