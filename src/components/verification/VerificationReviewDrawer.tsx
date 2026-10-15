"use client";
import {useEffect,useState} from "react";
import type {SafeSnapshot} from "@/modules/profile-verification/domain";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
import {VERIFICATION_SEND_BACK_REASONS} from "@/modules/verification/review-reasons";
import type {VerificationQueueCard} from "./VerificationWorkspace";

type Detail={review:{submittedSnapshot:SafeSnapshot;verifiedSnapshot:SafeSnapshot|null;
 documents:{purpose:string;receiptId:string}[];version:number;status:string;note:string|null;}};
export function VerificationReviewDrawer({row,onClose,onSaved}:{
 row:VerificationQueueCard;onClose:()=>void;onSaved:()=>void;
}){
 const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [saving,setSaving]=useState(false);
 const [reason,setReason]=useState<string>(VERIFICATION_SEND_BACK_REASONS[0]);
 const [additional,setAdditional]=useState("");
 const url=`/api/college/verification/${encodeURIComponent(row.learnerMembershipId)}/${row.section}`;
 useEffect(()=>{
  let active=true;
  setLoading(true);setDetail(null);setError("");
  fetch(url,{cache:"no-store"}).then(async response=>{
   if(!response.ok)throw Error(response.status===404?"Review is no longer available":"Unable to load review");
   return response.json() as Promise<Detail>;
  }).then(data=>{if(active)setDetail(data);}).catch(e=>{if(active)setError(e instanceof Error?e.message:"Unable to load review");})
    .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[url]);
 async function decide(action:"VERIFY"|"SEND_BACK"){
  if(!detail||saving)return;
  setSaving(true);setError("");
  try{
   const response=await fetch("/api/college/verification/review",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({learnerMembershipId:row.learnerMembershipId,section:row.section,
      expectedVersion:detail.review.version,action,...(action==="SEND_BACK"?
      {reason:[reason,additional.trim()].filter(Boolean).join(": ")}:{})}),
   });
   if(!response.ok){
    const payload=await response.json().catch(()=>({error:"UNAVAILABLE"})) as {error?:string};
    throw Error(payload.error==="STALE_VERSION"?"This review changed. Close and refresh before deciding.":payload.error??"Decision failed");
   }
   onSaved();
  }catch(e){setError(e instanceof Error?e.message:"Decision failed");}
  finally{setSaving(false);}
 }
 return <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
  <aside role="dialog" aria-modal="true" aria-label={`Review ${row.learnerName}`} className="h-full w-full max-w-xl overflow-y-auto bg-background p-4 shadow-xl sm:p-6">
   <header className="flex items-start justify-between gap-3 border-b pb-3">
    <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{row.learnerName}</h2>
     <p className="text-sm">{row.section==="EDUCATION"?"Education":"Identity"} · {row.status.replaceAll("_"," ")}</p></div>
    <button type="button" onClick={onClose} className="rounded-md border px-3 py-2">Close</button>
   </header>
   {loading?<p role="status" className="py-4">Loading submitted details…</p>:null}
   {error?<p role="alert" className="my-3 rounded-md border p-3">{error}</p>:null}
   {detail?<div className="space-y-5 py-4">
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
         href={`${url}/documents/${encodeURIComponent(doc.receiptId)}`}>Open {doc.purpose.toLowerCase()} (private signed link)</a>
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
      <button type="button" disabled={saving} onClick={()=>void decide("VERIFY")} className="rounded-md border px-4 py-2 disabled:opacity-50">Verify</button>
      <button type="button" disabled={saving} onClick={()=>void decide("SEND_BACK")} className="rounded-md border px-4 py-2 disabled:opacity-50">Send back</button>
     </div>
     {saving&&<p role="status">Saving decision…</p>}
    </>:<p className="text-sm">This request is already decided. No actions are available.</p>}
   </div>:null}
  </aside>
 </div>;
}
