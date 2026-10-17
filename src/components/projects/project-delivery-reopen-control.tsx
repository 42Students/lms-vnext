"use client";
import {useEffect,useState} from "react";
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
  const [confirmDiscard,setConfirmDiscard]=useState(false);
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
      footer={<>
        <Button variant="secondary" disabled={pending} onClick={guard.requestClose}>Cancel</Button>
        <Button disabled={pending||!reason.trim()} onClick={()=>void reopen()}>Reopen</Button>
      </>}>
      <label className="grid gap-2 text-sm font-semibold text-body">Review feedback
        <Textarea required value={reason} maxLength={4000} disabled={pending}
          onChange={event=>setReason(event.target.value)}
          placeholder="Feedback for the learner"/>
      </label>
      {error&&<p role="alert" className="mt-2 text-sm text-error">{error}</p>}
    </Dialog>
    <ConfirmDialog open={guard.discardOpen} onOpenChange={guard.setDiscardOpen}
      title="Discard review feedback?"
      description="You have unsaved project changes. Leave this page and discard them?"
      confirmLabel="Discard changes" pending={pending} onConfirm={guard.confirmDiscard}/>
  </>;
}
