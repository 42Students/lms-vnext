"use client";
import {useEffect,useRef,useState} from "react";
import type {SafeSnapshot} from "@/modules/profile-verification/domain";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
import {VERIFICATION_SEND_BACK_REASONS} from "@/modules/verification/review-reasons";
import {canRetryVerificationReview} from "@/modules/verification/review-retry-state";
import {canDismissVerificationDialog} from "@/modules/verification/review-dialog-keyboard";
import {verificationDecisionHistory} from "@/modules/verification/review-decision-history";
import {verificationDecisionConfirmation} from "@/modules/verification/review-confirmation";
import type {VerificationQueueCard} from "./VerificationWorkspace";

type Detail={review:{submittedSnapshot:SafeSnapshot;verifiedSnapshot:SafeSnapshot|null;
 documents:{purpose:string;receiptId:string}[];version:number;status:string;note:string|null;decidedAt:string|null;}};
export function VerificationReviewDrawer({row,onClose,onSaved,apiBase="/api/college/verification",collegeId}:{
 row:VerificationQueueCard;onClose:()=>void;onSaved:()=>void;apiBase?:string;collegeId?:string;
}){
 const closeButton=useRef<HTMLButtonElement>(null);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [retryKey,setRetryKey]=useState(0);
 const [saving,setSaving]=useState(false);
 const [pendingAction,setPendingAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const [reason,setReason]=useState<string>(VERIFICATION_SEND_BACK_REASONS[0]);
 const [additional,setAdditional]=useState("");
 const url=`${apiBase}/${encodeURIComponent(row.learnerMembershipId)}/${row.section}${collegeId?`?collegeId=${encodeURIComponent(collegeId)}`:""}`;
 useEffect(()=>{
  const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null;
  closeButton.current?.focus();
  return ()=>previouslyFocused?.focus();
 },[]);
 useEffect(()=>{
  function onKeyboard(event:KeyboardEvent){
   if(canDismissVerificationDialog(event.key,saving)){
    event.preventDefault();event.stopPropagation();onClose();
   }
  }
  window.addEventListener("keydown",onKeyboard);
  return ()=>window.removeEventListener("keydown",onKeyboard);
 },[onClose,saving]);
 useEffect(()=>{
  let active=true;
  fetch(url,{cache:"no-store"}).then(async response=>{
   if(!response.ok)throw Error(response.status===404?"Review is no longer available":"Unable to load review");
   return response.json() as Promise<Detail>;
  }).then(data=>{if(active)setDetail(data);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load review");})
    .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[url,retryKey]);
 function retryReview(){
  setError("");setDetail(null);setLoading(true);
  setRetryKey(key=>key+1);
 }
 async function decide(action:"VERIFY"|"SEND_BACK"){
  if(!detail||saving||pendingAction!==action)return;
  setSaving(true);setError("");
  try{
   const response=await fetch(`${apiBase}/review`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({... (collegeId?{collegeId}:{}),learnerMembershipId:row.learnerMembershipId,section:row.section,
      expectedVersion:detail.review.version,action,...(action==="SEND_BACK"?
      {reason:[reason,additional.trim()].filter(Boolean).join(": ")}:{})}),
   });
   if(!response.ok){
    const payload=await response.json().catch(()=>({error:"UNAVAILABLE"})) as {error?:string};
    if(payload.error==="STALE_VERSION"){
     setDetail(null);
     setPendingAction(null);
     throw Error("The request changed since it was opened. Reload the current details before deciding again.");
    }
    throw Error(payload.error??"Decision failed");
   }
   setPendingAction(null);onSaved();
  }catch(e){setError(e instanceof Error?e.message:"Decision failed");}
  finally{setSaving(false);}
 }
 return <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
  <aside role="dialog" aria-modal="true" aria-label={`Review ${row.learnerName}`} className="h-full w-full max-w-xl overflow-y-auto bg-background p-4 shadow-xl sm:p-6">
   <header className="flex items-start justify-between gap-3 border-b pb-3">
    <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{row.learnerName}</h2>
     <p className="text-sm">{row.section==="EDUCATION"?"Education":"Identity"} · {row.status.replaceAll("_"," ")}</p></div>
    <button type="button" ref={closeButton} disabled={saving} onClick={onClose} className="rounded-md border px-3 py-2 disabled:opacity-50">Close</button>
   </header>
   {loading?<p role="status" className="py-4">Loading submitted details…</p>:null}
   {error?<div role="alert" className="my-3 space-y-2 rounded-md border p-3"><p>{error}</p>
    {canRetryVerificationReview(error,loading)&&<button type="button" onClick={retryReview}
     className="rounded-md border px-3 py-2 text-sm">Retry loading review</button>}</div>:null}
   {detail?<div className="space-y-5 py-4">
    <section className="rounded-md border p-3" aria-label="Previous verification decision">
     <h3 className="font-semibold">Recorded decision history</h3>
     <p className="text-sm">Last decision: {verificationDecisionHistory(detail.review).decidedAt??"Not yet decided"}</p>
     <p className="mt-1 whitespace-pre-wrap break-words text-sm">Last reviewer note: {verificationDecisionHistory(detail.review).note??"No note recorded"}</p>
    </section>
    <section><h3 className="font-semibold">Submitted versus previously verified</h3>
     <dl className="mt-3 space-y-3">{verificationSnapshotComparison(detail.review.submittedSnapshot,detail.review.verifiedSnapshot)
      .map(item=><div key={item.key} className="min-w-0 rounded-md border p-3">
       <dt className="break-words font-medium">{item.key}</dt><dd className="break-words text-sm">Submitted: {item.submitted}</dd>
       <dd className="break-words text-sm">Previously verified: {item.previouslyVerified}</dd>
       {item.changed&&<dd className="text-xs font-medium">Changed</dd>}
      </div>)}</dl>
    </section>
    <section><h3 className="font-semibold">Private supporting documents</h3>
     {detail.review.documents.length===0?<p className="text-sm">No submitted document references.</p>:
      <ul className="mt-2 space-y-2">{detail.review.documents.map(doc=>
       <li key={doc.receiptId} className="break-words">
        <a target="_blank" rel="noopener noreferrer" className="underline"
         href={`${apiBase}/${encodeURIComponent(row.learnerMembershipId)}/${row.section}/documents/${encodeURIComponent(doc.receiptId)}${collegeId?`?collegeId=${encodeURIComponent(collegeId)}`:""}`}>Open {doc.purpose.toLowerCase()} (private signed link)</a>
       </li>)}</ul>}
    </section>
    {detail.review.status==="SUBMITTED"||detail.review.status==="UPDATE_PENDING"?<>
     <section className="space-y-2"><h3 className="font-semibold">Send back for correction</h3>
      <label className="block text-sm">Reason
       <select className="mt-1 w-full rounded-md border bg-background p-2" value={reason} onChange={e=>setReason(e.target.value)}>
        {VERIFICATION_SEND_BACK_REASONS.map(item=><option key={item} value={item}>{item}</option>)}
       </select></label>
      <label className="block text-sm">Additional details
       <textarea className="mt-1 min-h-20 w-full rounded-md border bg-background p-2" value={additional} onChange={e=>setAdditional(e.target.value)} maxLength={350}/></label>
     </section>
     <div className="flex flex-wrap gap-2">
      <button type="button" disabled={saving} onClick={()=>setPendingAction("VERIFY")} className="rounded-md border px-4 py-2 disabled:opacity-50">Verify</button>
      <button type="button" disabled={saving} onClick={()=>setPendingAction("SEND_BACK")} className="rounded-md border px-4 py-2 disabled:opacity-50">Send back</button>
     </div>
     {pendingAction&&<section aria-label="Confirm verification decision" className="w-full space-y-2 rounded-md border p-3">
      <h3 className="font-semibold">{verificationDecisionConfirmation(pendingAction,row.section,[reason,additional].filter(Boolean).join(": ")).heading}</h3>
      <p className="break-words text-sm">{verificationDecisionConfirmation(pendingAction,row.section,[reason,additional].filter(Boolean).join(": ")).message}</p>
      <div className="flex flex-wrap gap-2">
       <button type="button" disabled={saving} onClick={()=>void decide(pendingAction)} className="rounded-md border px-3 py-2 font-semibold disabled:opacity-50">{verificationDecisionConfirmation(pendingAction,row.section,reason).button}</button>
       <button type="button" disabled={saving} onClick={()=>setPendingAction(null)} className="rounded-md border px-3 py-2 disabled:opacity-50">Cancel</button>
      </div>
     </section>}
     {saving&&<p role="status">Saving decision…</p>}
    </>:<p className="text-sm">This request is already decided. No actions are available.</p>}
   </div>:null}
  </aside>
 </div>;
}
