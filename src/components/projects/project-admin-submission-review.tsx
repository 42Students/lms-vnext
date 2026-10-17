"use client";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch} from "@/lib/api-fetch";
import {adminDeliveryToast,canAdminSettleDelivery,type AdminDeliveryAction} from "@/modules/projects/admin-submission-review-model";

export function ProjectAdminSubmissionReview({projectId,submissionId,status,locked,projectStatus,workspaceTitle}:{
 projectId:string;submissionId:string;status:string;locked:boolean;projectStatus:string;workspaceTitle?:string;
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
  if(pendingRef.current||!canAdminSettleDelivery(status,locked,projectStatus,action))return;
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
 if(!(["SUBMITTED","APPROVED"].includes(status))||locked||projectStatus==="ARCHIVED")return null;
 return <section aria-label="Review final submission" className="mt-3">
  <button type="button" onClick={()=>setOpen(true)}
   className="min-h-10 rounded-md border border-border px-3 py-2 text-sm font-semibold text-primary-text">
   Review
  </button>
  {message?<p role="status" className="mt-2 text-sm">{message}</p>:null}
  <Dialog open={open} onOpenChange={setOpen} title={"Review — "+(workspaceTitle??"project submission")}
   description="Review the current submission and record feedback for the learner."
   footer={<>
    <button type="button" disabled={pending} onClick={()=>setOpen(false)}
     className="min-h-10 rounded-md border border-border px-3 py-2 text-sm">Cancel</button>
    {canAdminSettleDelivery(status,locked,projectStatus,"CHANGES_REQUESTED")?
     <button type="button" disabled={pending||!feedback.trim()} onClick={()=>{void decide("CHANGES_REQUESTED")}}
      className="min-h-10 rounded-md border border-border px-3 py-2 text-sm font-semibold">Request changes</button>:null}
    {canAdminSettleDelivery(status,locked,projectStatus,"APPROVED")?
     <button type="button" disabled={pending} onClick={()=>{void decide("APPROVED")}}
      className="min-h-10 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">Accept submission</button>:null}
    {canAdminSettleDelivery(status,locked,projectStatus,"LOCK")?
     <button type="button" disabled={pending} onClick={()=>setConfirmLock(true)}
      className="min-h-10 rounded-md border border-border px-3 py-2 text-sm font-semibold">Lock submission</button>:null}
   </>}>
   <label className="block text-sm font-medium">Feedback for the learner
    <textarea maxLength={6000} value={feedback} disabled={pending}
      onChange={event=>setFeedback(event.target.value)} rows={4}
      className="mt-2 w-full rounded-md border border-border bg-surface p-3"
      placeholder="Optional for Accept/Lock — required for Request changes"/>
   </label>
   {error?<p role="alert" className="mt-2 text-sm text-error">{error}</p>:null}
   {!feedback.trim()?<p className="mt-2 text-xs text-muted-foreground">
     Add feedback explaining what needs to change before requesting changes.</p>:null}
  </Dialog>
  <ConfirmDialog open={confirmLock} onOpenChange={setConfirmLock} title="Lock this submission?"
   description="The learner will no longer be able to edit or resubmit it."
   confirmLabel="Lock submission" pending={pending} onConfirm={()=>{void decide("LOCK")}}/>
 </section>;
}
