"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import type {LearnerVerificationState} from "@/modules/placements/learner-verification-status-model";
import {learnerVerificationSubmitLabel} from "@/modules/placements/learner-verification-submit-label";
import {learnerVerificationSubmissionFeedback} from "@/modules/placements/learner-verification-submit-feedback-model";

export function LearnerVerificationSubmit({
 section,expectedVersion,status,
}:{section:"EDUCATION"|"IDENTITY";expectedVersion:number;status:LearnerVerificationState}){
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState<string|null>(null);
 const [refreshRequired,setRefreshRequired]=useState(false);
 const router=useRouter();
 async function submit(){
  if(pending||refreshRequired)return;
  setPending(true);setMessage(null);
  try{
   const response=await fetch("/api/profile-verification/self",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section,expectedVersion}),
   });
   if(response.ok){
    setMessage("Submitted for review. Your current review status is being refreshed.");
    router.refresh();
   }else{
    const result=await response.json().catch(()=>null) as {error?:string}|null;
    const feedback=learnerVerificationSubmissionFeedback(response.status,result?.error);
    setMessage(feedback.message);
    setRefreshRequired(feedback.refreshRequired);
   }
  }catch{
   setMessage("The request could not be completed. Please retry.");
  }finally{setPending(false);}
 }
 return <div className="mt-4 min-w-0">
  <button type="button" disabled={pending||refreshRequired} onClick={submit}
   className="inline-flex min-h-11 max-w-full items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
   {pending?"Submitting…":learnerVerificationSubmitLabel(status)}
  </button>
  {message?<p role="status" aria-live="polite" className="mt-2 break-words text-sm text-body">{message}</p>:null}
  {refreshRequired?<button type="button" onClick={()=>router.refresh()}
    className="mt-3 min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Refresh verification status</button>:null}
 </div>;
}
