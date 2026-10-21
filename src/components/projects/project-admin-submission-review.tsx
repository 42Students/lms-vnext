"use client";
import { Button } from "@/components/ui/button";
import { Banner } from "@/components/ui/banner";
import { Textarea } from "@/components/ui/textarea";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
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
 const [loadingCurrent,setLoadingCurrent]=useState(false);
 const [currentStatus,setCurrentStatus]=useState(status);
 const [currentLocked,setCurrentLocked]=useState(locked);
 const [isLatest,setIsLatest]=useState(true);
 const [reviewSnapshot,setReviewSnapshot]=useState<{
   decision:string;feedback:string|null;reviewedAt:string
 }|null>(null);
 const [missing,setMissing]=useState(false);
 const currentActionAvailable=isLatest&&!missing&&
   ["SUBMITTED","APPROVED"].includes(currentStatus)&&!currentLocked&&
   projectStatus==="ACTIVE";

 async function refreshTarget(){
  setLoadingCurrent(true);
  try{
   const data=await apiFetch<{
     submissions:{id:string;status:string;version:number;lockedAt:string|null}[];
     reviews:{submissionId:string;decision:string;feedback:string|null;reviewedAt:string}[];
   }>("/api/projects/"+encodeURIComponent(projectId)+"/submissions",{
     method:"GET",cache:"no-store",
   });
   const target=data.submissions.find(row=>row.id===submissionId);
   const latest=data.submissions.reduce<{id:string;version:number}|null>(
     (acc,row)=>!acc||row.version>acc.version?row:acc,null);
   setMissing(!target);
   setIsLatest(Boolean(target&&latest?.id===target.id));
   if(target){
     setCurrentStatus(target.status);
     setCurrentLocked(Boolean(target.lockedAt));
     setReviewSnapshot(data.reviews.find(row=>row.submissionId===submissionId)??null);
   }
   return Boolean(target&&latest?.id===target.id);
  }catch(e){
   setError(e instanceof Error?e.message:"Failed to load the current submission.");
   return false;
  }finally{setLoadingCurrent(false);}
 }
 async function openReview(){
  setOpen(true);setError("");
  await refreshTarget();
 }
 async function decide(action:AdminDeliveryAction){
  if(pendingRef.current||loadingCurrent||!isLatest||missing||
    (action==="LOCK"&&!allowLock)||
    !canAdminSettleDelivery(currentStatus,currentLocked,projectStatus,action))return;
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
  }catch(caught){
   const message=caught instanceof Error?caught.message:"Failed to update this submission.";
   setError(message+" Your feedback has been kept.");
   setConfirmLock(false);
   // A stale review may have become a newer version or been locked.
   // Reload read-only status, but never overwrite the administrator's feedback.
   if(caught instanceof FriendlyFetchError&&caught.status>=400&&caught.status<500){
     await refreshTarget();
     router.refresh();
   }
  }finally{pendingRef.current=false;setPending(false);}
 }
 return <section aria-label="Review final submission" className="mt-[var(--lms-space-3)] min-w-0">
  <Button type="button" variant="secondary" onClick={()=>{void openReview();}}>
   Review
  </Button>
  {message?<Banner tone="success">{message}</Banner>:null}
  <Dialog open={open} onOpenChange={next=>{if(!pending)setOpen(next);}} title={"Review — "+(workspaceTitle??"project submission")}
   description="Review the selected final-delivery version and record feedback when available."
   footer={<div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:flex-wrap sm:justify-end">
    <Button className="w-full sm:w-auto" type="button" variant="secondary" disabled={pending} onClick={()=>setOpen(false)}
     >Cancel</Button>
    {currentActionAvailable&&canAdminSettleDelivery(currentStatus,currentLocked,projectStatus,"CHANGES_REQUESTED")?
     <Button className="w-full sm:w-auto" type="button" variant="secondary" disabled={pending||!feedback.trim()} onClick={()=>{void decide("CHANGES_REQUESTED")}}
      >Request changes</Button>:null}
    {currentActionAvailable&&canAdminSettleDelivery(currentStatus,currentLocked,projectStatus,"APPROVED")?
     <Button className="w-full sm:w-auto" type="button" variant="primary" loading={pending} disabled={pending} onClick={()=>{void decide("APPROVED")}}>Accept submission</Button>:null}
   </div>}>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Feedback for the learner
    <Textarea maxLength={6000} value={feedback} disabled={pending}
      onChange={event=>setFeedback(event.target.value)} rows={4}
      className="w-full"
      placeholder="Optional for Accept/Lock — required for Request changes"/>
   </label>
   {allowLock&&currentActionAvailable&&canAdminSettleDelivery(currentStatus,currentLocked,projectStatus,"LOCK")?<details className="mt-[var(--lms-space-4)] min-w-0 border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-2)]">
     <summary className="inline-flex min-h-11 cursor-pointer items-center text-[13px] font-semibold text-[var(--lms-link-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary)]">Lock submission</summary>
     <div className="mt-[var(--lms-space-2)] flex"><Button className="w-full sm:w-auto" type="button" variant="secondary" disabled={pending} onClick={()=>setConfirmLock(true)}>Lock submission</Button></div>
   </details>:null}
   {loadingCurrent?<Banner tone="info">Checking the latest submission status…</Banner>:null}
   {!currentActionAvailable&&!loadingCurrent?<Banner tone="info">
     No review action is currently available. {missing?
       "This submission could not be found.":!isLatest?
       "This is a historical version. Open the latest submitted version to review.":
       "The current submission is not actionable."}
   </Banner>:null}
   {reviewSnapshot?<div className="mt-3 border-t border-border pt-3 text-sm text-body">
      <p className="font-semibold">Recorded review · {reviewSnapshot.decision}</p>
      <p className="mt-1 whitespace-pre-wrap">{reviewSnapshot.feedback??"No reviewer feedback."}</p>
    </div>:null}
   {error?<Banner tone="error">{error}</Banner>:null}
   {currentActionAvailable&&!feedback.trim()?<p className="mt-2 text-xs text-muted-foreground">
     Add feedback explaining what needs to change before requesting changes.</p>:null}
  </Dialog>
  <ConfirmDialog open={confirmLock} onOpenChange={setConfirmLock} title="Lock this submission?"
   description="The learner will no longer be able to edit or resubmit it."
   confirmLabel="Lock submission" pending={pending} onConfirm={()=>{void decide("LOCK")}}/>
 </section>;
}
