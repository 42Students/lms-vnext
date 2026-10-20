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

export function ProjectDeliveryReopenControl({projectId,submissionId,expectedUpdatedAt}:{
  projectId:string;submissionId:string;expectedUpdatedAt:string;
}){
  const router=useRouter();
  const {showToast}=useToast();
  const [open,setOpen]=useState(false);
  const [reason,setReason]=useState("");
  const [pending,setPending]=useState(false);
  const [error,setError]=useState<string|null>(null);
  function discardDraft(){setOpen(false);setReason("");setError(null);}
  const guard=useProjectEditorDiscardGuard(open,Boolean(reason.trim()),pending,discardDraft);
  async function reopen(){
    if(!reason.trim())return;
    setPending(true);setError(null);
    try{
      await projectMutation("/api/projects/"+encodeURIComponent(projectId)+
        "/submissions/"+encodeURIComponent(submissionId)+"/reopen","POST",{
          expectedUpdatedAt,reason:reason.trim(),
        });
      setOpen(false);setReason("");
      showToast({tone:"success",title:"Submission reopened for revision."});
      router.refresh();
    }catch{
      setError("Could not reopen this submission. Refresh its latest status and try again.");
    }finally{setPending(false);}
  }
  return <>
    <Button size="sm" variant="secondary" onClick={()=>setOpen(true)}>Reopen for revision</Button>
    <Dialog open={open} onOpenChange={next=>{if(next)setOpen(true);else guard.requestClose();}}
      title="Reopen this submission for revision?"
      description="The learner will be able to edit and resubmit it."
      footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
        <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
        <Button className="w-full sm:w-auto" loading={pending} disabled={pending||!reason.trim()} onClick={()=>void reopen()}>Reopen</Button>
      </div>}>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Review feedback
        <Textarea required value={reason} maxLength={4000} rows={4} disabled={pending}
          onChange={event=>setReason(event.target.value)}
          placeholder="Feedback for the learner"/>
      </label>
      {error&&<p role="alert" className="mt-[var(--lms-space-2)] max-w-prose break-words text-[13px] leading-5 text-[var(--lms-error-text)]">{error}</p>}
    </Dialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard review feedback?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
