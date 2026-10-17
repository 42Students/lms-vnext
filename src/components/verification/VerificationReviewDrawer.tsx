"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useEffect,useRef,useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import type {SafeSnapshot} from "@/modules/profile-verification/domain";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
import {tpoVerificationSectionReasons} from "@/modules/verification/review-reasons";
import {canRetryVerificationReview} from "@/modules/verification/review-retry-state";
import {canDismissVerificationDialog} from "@/modules/verification/review-dialog-keyboard";
import {verificationFocusWrap} from "@/modules/verification/review-focus-loop";
import {verificationDecisionHistory} from "@/modules/verification/review-decision-history";
import {verificationDecisionConfirmation} from "@/modules/verification/review-confirmation";
import {canEditVerificationDecision} from "@/modules/verification/review-edit-guard";
import type {VerificationQueueCard} from "./VerificationWorkspace";

type HistoryItem={id:string;action:string;actorKind:string;actorName:string|null;
 note:string|null;occurredAt:string;priorVersion:number;nextVersion:number};
type Detail={review:{submittedSnapshot:SafeSnapshot;verifiedSnapshot:SafeSnapshot|null;
 documents:{purpose:string;receiptId:string}[];version:number;status:string;note:string|null;
 decidedAt:string|null;history:HistoryItem[];}};
export function VerificationReviewDrawer({row,onClose,onSaved,apiBase="/api/college/verification",collegeId,sequenceProgress,onNext,onFinish}:{
 row:VerificationQueueCard;onClose:()=>void;onSaved:(action?:"VERIFY"|"SEND_BACK")=>void;apiBase?:string;collegeId?:string;sequenceProgress?:string;onNext?:()=>void;onFinish?:()=>void;
}){
 const closeButton=useRef<HTMLButtonElement>(null);
 const drawer=useRef<HTMLElement>(null);
 const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [retryKey,setRetryKey]=useState(0);
 const [saving,setSaving]=useState(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [pendingAction,setPendingAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const isTpo=apiBase==="/api/tpo/verification";
 const reasonChoices:readonly string[]=tpoVerificationSectionReasons(row.section);
 const [reason,setReason]=useState<string>(reasonChoices[0]??"");
 const [additional,setAdditional]=useState("");
 const url=`${apiBase}/${encodeURIComponent(row.learnerMembershipId)}/${row.section}${collegeId?`?collegeId=${encodeURIComponent(collegeId)}`:""}`;
 useEffect(()=>{
  const previouslyFocused=document.activeElement instanceof HTMLElement?document.activeElement:null;
  closeButton.current?.focus();
  return ()=>previouslyFocused?.focus();
 },[]);
 useEffect(()=>{
  function onKeyboard(event:KeyboardEvent){
   if(event.key==="Tab"&&drawer.current){
    const focusable=[...drawer.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')]
     .filter(element=>element.getClientRects().length>0);
    if(focusable.length){
     const direction=verificationFocusWrap(document.activeElement===focusable[0],document.activeElement===focusable[focusable.length-1],event.shiftKey);
     if(direction){event.preventDefault();focusable[direction==="FIRST"?0:focusable.length-1]?.focus();}
     else if(!drawer.current.contains(document.activeElement)){event.preventDefault();focusable[0]?.focus();}
    }
   }
   if(canDismissVerificationDialog(event.key,saving)){
    event.preventDefault();event.stopPropagation();onClose();
   }
  }
  window.addEventListener("keydown",onKeyboard);
  return ()=>window.removeEventListener("keydown",onKeyboard);
 },[onClose,saving]);
 useEffect(()=>{
  let active=true;
  apiFetch<Detail>(url,{cache:"no-store"}).then(data=>{if(active)setDetail(data);})
   .catch(e=>{if(active)setError(isTpo?"Could not open this student":e instanceof Error?e.message:"Could not load review. Please try again.");})
    .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[url,retryKey]);
 function retryReview(){
  setError("");setDetail(null);setLoading(true);
  setRetryKey(key=>key+1);
 }
 async function decide(action:"VERIFY"|"SEND_BACK"){
  if(!detail||saving||guardedPending||pendingAction!==action)return;
  if(action==="SEND_BACK"&&[reason,additional.trim()].filter(Boolean).join(": ").trim().length<3){
   setError("Write what needs to change before sending this back.");return;
  }
  setSaving(true);setError("");
  try{
   await apiFetch(`${apiBase}/review`,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({... (collegeId?{collegeId}:{}),learnerMembershipId:row.learnerMembershipId,section:row.section,
      expectedVersion:detail.review.version,action,...(action==="SEND_BACK"?
      {reason:[reason,additional.trim()].filter(Boolean).join(": ")}:{})}),
   });
   setPendingAction(null);onSaved(action);
  }catch(e){
   if(e instanceof FriendlyFetchError&&e.status===409){
     setDetail(null);setPendingAction(null);
     setError("This changed while you were working. Refresh the details and re-apply your decision.");
   }else setError((action==="VERIFY"?"Could not verify":"Could not send it back")+". Please try again.");
  }
  finally{setSaving(false);}
 }
 return <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
  <aside ref={drawer} role="dialog" aria-modal="true" aria-label={`Review ${row.learnerName}`} className="h-full w-full max-w-xl overflow-y-auto bg-background p-4 shadow-xl sm:p-6">
   <header className="flex items-start justify-between gap-3 border-b pb-3">
    <div className="min-w-0"><h2 className="break-words text-lg font-semibold">{row.learnerName}</h2>
     {row.rollNumber?<p className="text-xs text-muted-foreground">Roll no.: {row.rollNumber}</p>:null}
     <p className="text-sm">{row.section==="EDUCATION"?"Education":"Identity"} · {row.status.replaceAll("_"," ")}</p></div>
    <button type="button" ref={closeButton} disabled={saving} onClick={onClose} className="rounded-md border px-3 py-2 disabled:opacity-50">Close</button>
   </header>
   {sequenceProgress&&<nav aria-label="Sequential verification progress" className="flex flex-wrap items-center gap-3 border-b py-3 text-sm">
     <span role="status">{sequenceProgress}</span>
     <button type="button" disabled={saving} onClick={onNext} className="rounded border px-3 py-2">Next</button>
     <button type="button" disabled={saving} onClick={onFinish} className="rounded border px-3 py-2">Finish</button>
   </nav>}
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
    <section aria-label="Verification history" className="space-y-2 rounded-md border p-3">
      <h3 className="font-semibold">History</h3>
      {detail.review.history?.length===0&&<p className="text-sm text-muted-foreground">No recorded verification events.</p>}
      <ol className="space-y-3 border-l border-border pl-4 text-sm">
        {(detail.review.history??[]).map(item=><li key={item.id} className="space-y-1">
          <p className="font-semibold">{item.action==="SUBMITTED"?"Sent by the student"
            :item.action==="UPDATE_SUBMITTED"?"Update sent by the student"
            :item.action==="VERIFIED"?"Verified by "+(item.actorName??item.actorKind)
            :item.action==="SENT_BACK"?"Sent back by "+(item.actorName??item.actorKind)
            :item.action.replaceAll("_"," ")}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(item.occurredAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}
          </p>
          {item.note&&<p className="whitespace-pre-wrap break-words">{item.note}</p>}
        </li>)}
      </ol>
      {detail.review.history?.length===50&&<p className="text-xs text-muted-foreground">
        Showing the latest 50 history events.
      </p>}
    </section>
    {row.section==="IDENTITY"?<p className="text-sm text-muted-foreground">Numbers show only the last four digits; compare them with the document.</p>:null}
    <section><h3 className="font-semibold">Submitted versus previously verified</h3>
     <dl className="mt-3 space-y-3">{verificationSnapshotComparison(detail.review.submittedSnapshot,detail.review.verifiedSnapshot)
      .map(item=><div key={item.key} className="min-w-0 rounded-md border p-3">
       <dt className="break-words font-medium">{item.key}</dt><dd className="break-words text-sm">Submitted: {item.submitted}</dd>
       <dd className="break-words text-sm">Previously verified: {item.previouslyVerified}</dd>
       {item.changed&&<dd className="text-xs font-medium">Changed</dd>}
      </div>)}</dl>
    </section>
    {row.section==="EDUCATION"&&Array.isArray(detail.review.submittedSnapshot.education)&&
      <section className="space-y-2">
        <h3 className="font-semibold">Education</h3>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead><tr className="border-b">
              {["Level","Institution","Year","Marks","Marksheet"].map(label=>
                <th key={label} className="p-2 font-semibold">{label}</th>)}
            </tr></thead>
            <tbody>{detail.review.submittedSnapshot.education.map((entry,index)=>{
              if(!entry||typeof entry!=="object"||Array.isArray(entry))return null;
              const string=(key:string)=>typeof entry[key]==="string"?String(entry[key]).slice(0,200):"—";
              const hasProof=typeof entry.marksheetDocumentId==="string";
              return <tr key={index} className="border-b">
                <td className="p-2">{string("educationType")}</td>
                <td className="p-2">{string("institutionName")!=="—"?string("institutionName"):string("institution")}</td>
                <td className="p-2">{string("endYear")}</td>
                <td className="p-2">{string("grade")}</td>
                <td className="p-2">{hasProof?"Submitted":"Missing"}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>}
    <section><h3 className="font-semibold">Private supporting documents</h3>
     {detail.review.documents.some(doc=>doc.purpose==="RESUME")&&<p className="mb-2 text-sm font-semibold">
       Resume available: open the private signed link below.
     </p>}
     {detail.review.documents.length===0?<p className="text-sm">No submitted document references.</p>:
      <ul className="mt-2 space-y-2">{detail.review.documents.map(doc=>
       <li key={doc.receiptId} className="break-words">
        <a target="_blank" rel="noopener noreferrer" className="underline"
         href={`${apiBase}/${encodeURIComponent(row.learnerMembershipId)}/${row.section}/documents/${encodeURIComponent(doc.receiptId)}${collegeId?`?collegeId=${encodeURIComponent(collegeId)}`:""}`}>Open {doc.purpose.toLowerCase()} (private signed link)</a>
       </li>)}</ul>}
    </section>
    {detail.review.status==="SUBMITTED"||detail.review.status==="UPDATE_PENDING"?<>
     <section className="space-y-2"><h3 className="font-semibold">Send {row.section==="EDUCATION"?"Education":"Identity"} back</h3>
      <label className="block text-sm">Reason
       <select disabled={!canEditVerificationDecision(saving,pendingAction)} className="mt-1 w-full rounded-md border bg-background p-2" value={reason} onChange={e=>setReason(e.target.value)}>
        {reasonChoices.map(item=><option key={item} value={item}>{item}</option>)}
        <option value="">Or write what needs to change</option>
       </select></label>
      <label className="block text-sm">Additional details
       <textarea disabled={!canEditVerificationDecision(saving,pendingAction)} className="mt-1 min-h-20 w-full rounded-md border bg-background p-2" value={additional} onChange={e=>setAdditional(e.target.value)} maxLength={350}/></label>
     </section>
     <div className="flex flex-wrap gap-2">
      <button type="button" disabled={!canEditVerificationDecision(saving,pendingAction)} onClick={()=>setPendingAction("VERIFY")} className="rounded-md border px-4 py-2 disabled:opacity-50">Verify</button>
      <button type="button" disabled={!canEditVerificationDecision(saving,pendingAction)||[reason,additional.trim()].filter(Boolean).join(": ").trim().length<3} onClick={()=>setPendingAction("SEND_BACK")} className="rounded-md border px-4 py-2 disabled:opacity-50">Send back</button>
     </div>
     {pendingAction&&<section aria-label="Confirm verification decision" className="w-full space-y-2 rounded-md border p-3">
      <h3 className="font-semibold">{isTpo&&pendingAction==="SEND_BACK"?"Send "+(row.section==="EDUCATION"?"education":"identity")+" back":verificationDecisionConfirmation(pendingAction,row.section,[reason,additional].filter(Boolean).join(": ")).heading}</h3>
      <p className="break-words text-sm">{pendingAction==="SEND_BACK"?"The student sees your reason and fixes it on their profile.":verificationDecisionConfirmation(pendingAction,row.section,[reason,additional].filter(Boolean).join(": ")).message}</p>
      <div className="flex flex-wrap gap-2">
       <button type="button" disabled={saving||guardedPending} onClick={()=>void runGuarded(()=>decide(pendingAction))} className="rounded-md border px-3 py-2 font-semibold disabled:opacity-50">{verificationDecisionConfirmation(pendingAction,row.section,reason).button}</button>
       <button type="button" disabled={saving} onClick={()=>setPendingAction(null)} className="rounded-md border px-3 py-2 disabled:opacity-50">Cancel</button>
      </div>
     </section>}
     {saving&&<p role="status">Saving decision…</p>}
    </>:<p className="text-sm">This request is already decided. No actions are available.</p>}
   </div>:null}
  </aside>
 </div>;
}
