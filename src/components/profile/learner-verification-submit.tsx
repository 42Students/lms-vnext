"use client";
import { Button } from "@/components/ui/button";
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
  <Button variant="primary" type="button" disabled={pending||refreshRequired} onClick={submit}
   className="max-w-full">
   {pending?"Submitting…":learnerVerificationSubmitLabel(status)}
  </Button>
  {message?<p role="status" aria-live="polite" className="mt-2 break-words text-sm text-body">{message}</p>:null}
  {refreshRequired?<Button variant="primary" type="button" onClick={()=>router.refresh()}
    className="mt-3 text-primary-text">Refresh verification status</Button>:null}
 </div>;
}
