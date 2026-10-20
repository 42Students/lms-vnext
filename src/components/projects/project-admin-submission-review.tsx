"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Textarea } from "@/components/ui/textarea";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {adminDeliveryToast,canAdminSettleDelivery,type AdminDeliveryAction} from "@/modules/projects/admin-submission-review-model";

export function ProjectAdminSubmissionReview({projectId,submissionId,status,locked,projectStatus,workspaceTitle,allowLock}:{
 projectId:string;submissionId:string;status:string;locked:boolean;projectStatus:string;workspaceTitle?:string;allowLock:boolean;
}){
 const router=useRouter();
 const [open,setOpen]=useState(false);
 const [confirmLock,setConfirmLock]=useState(false);
 const [pending,setPending]=useState(false);
 const pendingRef=useRef(false);
 const [feedback,setFeedback]=useState("");
 const [message,setMessage]=useState("");
 const [error,setError]=useState("");

 async function decide(action:AdminDeliveryAction){
  if(pendingRef.current||(action==="LOCK"&&!allowLock)||!canAdminSettleDelivery(status,locked,projectStatus,action))return;
  if(action==="CHANGES_REQUESTED"&&!feedback.trim()){
   setError("Add feedback explaining what needs to change before requesting changes.");return;
  }
  pendingRef.current=true;setPending(true);setError("");setMessage("");
  try{
   const base="/api/projects/"+encodeURIComponent(projectId)+"/submissions/"+encodeURIComponent(submissionId);
   await apiFetch(base+(action==="LOCK"?"/lock":"/review"),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(action==="LOCK"?{reason:feedback.trim()||"Locked by College Admin"}:
     {decision:action,feedback:feedback.trim()||undefined}),
   });
   setMessage(adminDeliveryToast(action));
   setOpen(false);setConfirmLock(false);
   router.refresh();
  }catch{
   setError("Could not review this submission. Your feedback has been kept. Try again.");
   setConfirmLock(false);
  }finally{pendingRef.current=false;setPending(false);}
 }
 if(!(["SUBMITTED","APPROVED"].includes(status))||locked||projectStatus==="ARCHIVED"||
   (status==="APPROVED"&&!allowLock))return null;
 return <section aria-label="Review final submission" className="mt-[var(--lms-space-3)] min-w-0">
  <Button type="button" variant="secondary" onClick={()=>setOpen(true)}>
   Review
  </Button>
  {message?<Banner tone="success">{message}</Banner>:null}
  <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} title={"Review — "+(workspaceTitle??"project submission")}
   description="Review the current submission and record feedback for the learner."
   footer={<div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:justify-end">
    <Button className="w-full sm:w-auto" type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}
     >Cancel</Button>
    {canAdminSettleDelivery(status,locked,projectStatus,"CHANGES_REQUESTED")?
     <Button className="w-full sm:w-auto" type="button" variant="secondary" disabled={pending||!feedback.trim()} onClick={()=>{void decide("CHANGES_REQUESTED")}}
      >Request changes</Button>:null}
    {canAdminSettleDelivery(status,locked,projectStatus,"APPROVED")?
     <Button className="w-full sm:w-auto" type="button" variant="primary" loading={pending} disabled={pending} onClick={()=>{void decide("APPROVED")}}>Accept submission</Button>:null}
   </div>}>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Feedback for the learner
    <Textarea maxLength={6000} value={feedback} disabled={pending}
      onChange={event=>setFeedback(event.target.value)} rows={4}
      className="w-full"
      placeholder="Optional for Accept/Lock — required for Request changes"/>
   </label>
   {allowLock&&canAdminSettleDelivery(status,locked,projectStatus,"LOCK")?<details className="mt-[var(--lms-space-4)] min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-2)]">
     <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Lock submission</summary>
     <div className="mt-[var(--lms-space-2)] flex"><Button className="w-full sm:w-auto" type="button" variant="secondary" disabled={pending} onClick={()=>setConfirmLock(true)}>Lock submission</Button></div>
   </details>:null}
   {error?<Banner tone="error">{error}</Banner>:null}
   {!feedback.trim()?<p className="mt-2 text-xs text-muted-foreground">
     Add feedback explaining what needs to change before requesting changes.</p>:null}
  </Dialog>
  <ConfirmDialog open={confirmLock} onOpenChange={setConfirmLock} title="Lock this submission?"
   description="The learner will no longer be able to edit or resubmit it."
   confirmLabel="Lock submission" pending={pending} onConfirm={()=>{void decide("LOCK")}}/>
 </section>;
}
