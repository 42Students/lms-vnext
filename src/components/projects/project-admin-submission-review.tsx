"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {adminDeliveryToast,canAdminSettleDelivery,type AdminDeliveryAction} from "@/modules/projects/admin-submission-review-model";
export function ProjectAdminSubmissionReview({projectId,submissionId,status,locked,projectStatus}:{
 projectId:string;submissionId:string;status:string;locked:boolean;projectStatus:string;
}){
 const router=useRouter();
 const [pending,setPending]=useState(false),[feedback,setFeedback]=useState("");
 const [message,setMessage]=useState(""),[error,setError]=useState("");
 async function decide(action:AdminDeliveryAction){
  if(pending||!canAdminSettleDelivery(status,locked,projectStatus,action))return;
  if(action==="CHANGES_REQUESTED"&&!feedback.trim()){setError("Feedback is required.");return;}
  if(!window.confirm("Confirm "+(action==="APPROVED"?"accepting":action==="CHANGES_REQUESTED"?"requesting changes to":"locking")+" this submission?"))return;
  setPending(true);setError("");setMessage("");
  try{
   const base="/api/projects/"+encodeURIComponent(projectId)+"/submissions/"+encodeURIComponent(submissionId);
   const response=await fetch(base+(action==="LOCK"?"/lock":"/review"),{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(action==="LOCK"?{reason:feedback.trim()||"Locked by College Admin"}:
     {decision:action,feedback:feedback.trim()||undefined}),
   });
   if(!response.ok){
    const details=await response.json().catch(()=>({error:"Review failed"}));
    throw new Error(details.error||"Review failed");
   }
   setMessage(adminDeliveryToast(action));router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Review failed");}
  finally{setPending(false);}
 }
 if(!(["SUBMITTED","APPROVED"].includes(status))||locked||projectStatus==="ARCHIVED")return null;
 return <section aria-label="Review final submission" className="mt-3 space-y-2 border-t border-border pt-3">
  <label className="block text-sm">Feedback
   <textarea maxLength={6000} value={feedback} disabled={pending}
    onChange={e=>setFeedback(e.target.value)}
    className="mt-1 min-h-20 w-full rounded border border-border bg-surface p-2"
    placeholder="Explain what needs changing (required for Request changes)"/>
  </label>
  <div className="flex flex-wrap gap-2">
   {([{action:"APPROVED" as const,label:"Accept"},
      {action:"CHANGES_REQUESTED" as const,label:"Request changes"},
      {action:"LOCK" as const,label:"Lock"}]).map(({action,label})=>
    canAdminSettleDelivery(status,locked,projectStatus,action)?
    <button type="button" key={action} disabled={pending} onClick={()=>void decide(action)}
     className="min-h-10 rounded border border-border px-3 text-sm disabled:opacity-50">{label}</button>:null)}
  </div>
  {message&&<p role="status" className="text-sm">{message}</p>}
  {error&&<p role="alert" className="text-sm text-error">{error}</p>}
 </section>;
}
