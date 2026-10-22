"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useProjectEditorDiscardGuard} from "./project-editor-discard-guard";
import {Textarea} from "@/components/ui/textarea";
import {useToast} from "@/components/ui/toast";
import {projectMutation} from "./project-api";
import {FriendlyFetchError} from "@/lib/api-fetch";

export function ProjectDeliveryReopenControl({projectId,submissionId,expectedUpdatedAt}:{
  projectId:string;submissionId:string;expectedUpdatedAt:string;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [stale,setStale]=useState(false);
  function discardDraft(){setOpen(false);setReason("");setError(null);setStale(false);}
  const guard=useProjectEditorDiscardGuard(open,Boolean(reason.trim()),pending,discardDraft);
  async function reopen(){
    if(!reason.trim())return;
    if(pending)return;
    setPending(true);setError(null);setStale(false);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
        "/submissions/"+encodeURIComponent(submissionId)+"/reopen","POST",{
          expectedUpdatedAt,reason:reason.trim(),
        });
      setOpen(false);setReason("");setStale(false);
      showToast({tone:"success",title:"Submission reopened for revision."});
      router.refresh();
    }catch(caught){
      // A conflict keeps the entire feedback draft in place; a server refresh
      // updates expectedUpdatedAt without dismissing this dialog.
      const conflict=caught instanceof FriendlyFetchError && (caught.status===409 ||
        caught.code==="PROJECT_SUBMISSION_STALE" || caught.code==="PROJECT_SUBMISSION_CONFLICT");
      setStale(conflict);
      setError(conflict
        ?"This submission changed since you opened it. Refresh the latest status before retrying; your feedback is preserved."
        :"Could not reopen this submission. Your feedback is saved here so you can retry.");
    }finally{setPending(false);}
  }
  return <>
    <Button size="sm" variant="secondary" onClick={()=>{setStale(false);setOpen(true);}}>Reopen for revision</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
      title="Reopen this submission for revision?"
      description="The learner will be able to edit and resubmit it."
      footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
        <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
        <Button className="w-full sm:w-auto" loading={pending} disabled={pending||!reason.trim()} onClick={()=>void reopen()}>Reopen for revision</Button>
      </div>}>
      <label htmlFor="reopen-review-feedback" className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Review feedback</label>
      <Textarea id="reopen-review-feedback" required value={reason} maxLength={4000} rows={4}
        aria-describedby="reopen-feedback-help" disabled={pending}
        onChange={event=>{setReason(event.target.value);setError(null);}}
        placeholder="Feedback for the learner"/>
      <p id="reopen-feedback-help" className="mt-1 text-[13px] text-muted-foreground">
        Tell the learner what needs to change before resubmitting. Feedback is visible in the final submission review history.
      </p>
      {error&&<div className="mt-[var(--lms-space-2)] space-y-2">
        <p role="alert" className="max-w-prose break-words text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>
        {stale?<Button variant="secondary" disabled={pending}
          onClick={()=>{setStale(false);router.refresh();}}>Refresh submission status</Button>:null}
      </div>}
    </Dialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard review feedback?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
