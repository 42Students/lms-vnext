"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import type {LearnerVerificationState} from "@/modules/placements/learner-verification-status-model";
import {learnerVerificationSubmitLabel} from "@/modules/placements/learner-verification-submit-label";

export function LearnerVerificationSubmit({
 section,expectedVersion,status,
}:{section:"EDUCATION"|"IDENTITY";expectedVersion:number;status:LearnerVerificationState}){
 const [pending,setPending]=useState(false);
 const [message,setMessage]=useState<string|null>(null);
 const router=useRouter();
 async function submit(){
  if(pending)return;
  setPending(true);setMessage(null);
  try{
   const response=await fetch("/api/profile-verification/self",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section,expectedVersion}),
   });
   if(response.ok){
    setMessage("Submitted for review. Your current review status is being refreshed.");
    router.refresh();
   }else if(response.status===409){
    setMessage("Your review details changed or there is nothing new to submit. Refresh and check the latest status.");
   }else if(response.status===422){
    setMessage("Submission needs complete, privately verified documents. Check your evidence and try again.");
   }else{
    setMessage("This submission was not completed. Check your access or try again.");
   }
  }catch{
   setMessage("The request could not be completed. Please retry.");
  }finally{setPending(false);}
 }
 return <div className="mt-4 min-w-0">
  <button type="button" disabled={pending} onClick={submit}
   className="inline-flex min-h-11 max-w-full items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-60">
   {pending?"Submitting…":learnerVerificationSubmitLabel(status)}
  </button>
  {message?<p role="status" aria-live="polite" className="mt-2 break-words text-sm text-body">{message}</p>:null}
 </div>;
}
