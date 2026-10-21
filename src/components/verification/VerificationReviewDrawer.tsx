"use client";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useEffect,useState} from "react";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";
import type {SafeSnapshot} from "@/modules/profile-verification/domain";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
import { verificationEducationRows } from "@/modules/verification/education-rows";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Dialog } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {tpoVerificationSectionReasons} from "@/modules/verification/review-reasons";
import {canRetryVerificationReview} from "@/modules/verification/review-retry-state";
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
 const {showToast}=useToast();
 const [detail,setDetail]=useState<Detail|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(true);
 const [retryKey,setRetryKey]=useState(0);
 const [saving,setSaving]=useState(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [pendingAction,setPendingAction]=useState<"VERIFY"|"SEND_BACK"|null>(null);
 const reasonChoices:readonly string[]=tpoVerificationSectionReasons(row.section);
 const [reason,setReason]=useState<string>(reasonChoices[0]??"");
 const [additional,setAdditional]=useState("");
 const url=`${apiBase}/${encodeURIComponent(row.learnerMembershipId)}/${row.section}${collegeId?`?collegeId=${encodeURIComponent(collegeId)}`:""}`;
 useEffect(()=>{
  let active=true;
  apiFetch<Detail>(url,{cache:"no-store"}).then(data=>{if(active)setDetail(data);})
   .catch(()=>{if(active){
    setError("Could not open this student");
    showToast({tone:"error",title:"Could not open this student"});
    onClose();
   }})
    .finally(()=>{if(active)setLoading(false);});
  return ()=>{active=false;};
 },[url,retryKey]);
 function retryReview(){
  setError("");setDetail(null);setLoading(true);
  setRetryKey(key=>key+1);
 }
 async function decide(action:"VERIFY"|"SEND_BACK"){
  if(!detail||saving||guardedPending||pendingAction!==action)return;
  if(action==="SEND_BACK"){
   const message=[reason,additional.trim()].filter(Boolean).join(": ").trim();
   if(message.length<3){setError("Say what needs to change");return;}
   if(message.length>500){setError("Use at most 500 characters in your reason.");return;}
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
   }else setError(action==="VERIFY"?"Could not verify":"Could not send it back");
  }
  finally{setSaving(false);}
 }
 return <Drawer open={true} onOpenChange={next=>{if(!next&&!saving)onClose();}} dismissible={!saving}
  title={row.learnerName+(row.rollNumber?" · "+row.rollNumber:"")} description={(row.section==="EDUCATION"?"Education":"Identity")+" · "+row.status.replaceAll("_"," ")}
  className="w-full sm:w-[min(760px,100vw)]" bodyClassName="pb-[max(1rem,env(safe-area-inset-bottom))]">
   {sequenceProgress&&<nav aria-label="Sequential verification progress" className="grid min-w-0 grid-cols-2 items-center gap-2 border-b border-[var(--lms-canvas-border)] py-3 text-[13px] sm:flex sm:flex-wrap sm:gap-3">
     <span role="status" className="col-span-2 min-w-0 break-words sm:col-span-1">{sequenceProgress}</span>
     <Button variant="secondary" type="button" disabled={saving} onClick={onNext} className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">Next</Button>
     <Button variant="secondary" type="button" disabled={saving} onClick={onFinish} className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">Finish</Button>
   </nav>}
   {loading?<div role="status" aria-label="Loading student verification details" className="space-y-3 py-6">
    <p className="text-[14px] text-[var(--lms-muted-text)]">Loading submitted details…</p>
    {Array.from({length:6},(_,i)=><div key={i} aria-hidden="true" className="h-6 animate-pulse rounded bg-muted"/>)}
   </div>:null}
   {error?<div role="alert" className="my-3 min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-error)] bg-[var(--lms-neutral-50)] p-3 text-[14px] break-words"><p>{error}</p>
    {canRetryVerificationReview(error,loading)&&<Button variant="secondary" type="button" onClick={retryReview}
     className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">Retry loading review</Button>}</div>:null}
   {detail?<div className="min-w-0 space-y-5 py-4">
    {row.section==="IDENTITY"?<section className="space-y-1 text-sm">
      <p className="text-muted-foreground">Numbers show only the last four digits; compare them with the document.</p>
      {(["aadhaarNumber","panNumber"] as const).map(field=>{
        const value=detail.review.submittedSnapshot[field];
        const digits=typeof value==="string"?value.replace(/[^0-9A-Za-z]/g,""):"";
        const lastFour=digits.length>=4?digits.slice(-4):null;
        return <p key={field}><strong>{field==="aadhaarNumber"?"Aadhaar":"PAN"}:</strong>
          {" "}{lastFour?"•••• "+lastFour:"Not given"}</p>;
      })}
    </section>:null}
    <section className="rounded-[var(--lms-radius-card)] border border-border p-4">
     <h3 className="flex flex-wrap items-center gap-2 font-semibold">{row.section==="EDUCATION"?"Education":"Identity"} <span className="text-xs font-normal text-muted-foreground">{detail.review.status.replaceAll("_"," ")}</span></h3>
     {detail.review.decidedAt&&detail.review.status==="VERIFIED"?<p className="mt-1 text-sm text-muted-foreground">Verified by {(detail.review.history??[]).filter(item=>item.action==="VERIFIED").slice(-1)[0]?.actorName??"the college"} on {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short",year:"numeric"}).format(new Date(detail.review.decidedAt))}</p>:null}
     <h4 className="mt-3 font-semibold">Submitted versus previously verified</h4>
     <dl className="mt-3 min-w-0 divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{verificationSnapshotComparison(detail.review.submittedSnapshot,detail.review.verifiedSnapshot)
      .map(item=><div key={item.key} className="min-w-0 space-y-1 py-3">
       <dt className="break-words [overflow-wrap:anywhere] text-[14px] font-semibold text-[var(--lms-heading)]">{item.key}</dt><dd className="break-words [overflow-wrap:anywhere] text-[13px] leading-5">Submitted: {item.submitted}</dd>
       <dd className="break-words [overflow-wrap:anywhere] text-[13px] leading-5">Previously verified: {item.previouslyVerified}</dd>
       {item.changed&&<dd className="text-[12px] font-semibold text-[var(--lms-primary-text)]">Changed</dd>}
      </div>)}</dl>
    </section>
    {row.section==="EDUCATION"&&Array.isArray(detail.review.submittedSnapshot.education)&&
      <section className="space-y-2">
        <h3 className="font-semibold">Education</h3>
        <DataTable
          caption="Submitted education records"
          rows={verificationEducationRows(detail.review.submittedSnapshot.education)}
          getRowKey={entry=>entry.id}
          empty={<p className="rounded border border-border p-3 text-sm">No education records supplied.</p>}
          columns={[
            {key:"level",header:"Level",mobilePriority:"primary",cell:entry=>entry.level},
            {key:"institution",header:"Institution",mobilePriority:"secondary",cell:entry=>entry.institution},
            {key:"year",header:"Year",mobilePriority:"secondary",cell:entry=>entry.year},
            {key:"marks",header:"Marks",mobilePriority:"secondary",cell:entry=>entry.marks},
            {key:"marksheet",header:"Marksheet",mobilePriority:"secondary",cell:entry=>entry.marksheet},
          ]}
        />
      </section>}
    <section className="rounded-[var(--lms-radius-card)] border border-border p-4">
     <h3 className="font-semibold">{row.section==="EDUCATION"?"Education documents":"Identity documents"}</h3>
     {detail.review.documents.some(doc=>doc.purpose==="RESUME")&&<p className="mb-2 text-sm font-semibold">
       Resume available: open the private signed link below.
     </p>}
     {detail.review.documents.length===0?<p className="text-sm text-muted-foreground">Not uploaded</p>:
      <ul className="mt-2 space-y-2">{detail.review.documents.map(doc=>
       <li key={doc.receiptId} className="break-words">
        <a target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 max-w-full items-center break-words [overflow-wrap:anywhere] text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
         href={`${apiBase}/${encodeURIComponent(row.learnerMembershipId)}/${row.section}/documents/${encodeURIComponent(doc.receiptId)}${collegeId?`?collegeId=${encodeURIComponent(collegeId)}`:""}`}>Open {doc.purpose==="RESUME"?"resume":doc.purpose==="MARKSHEET"?"marksheet":"document"} (private signed link)</a>
       </li>)}</ul>}
    </section>
    {detail.review.status==="SUBMITTED"||detail.review.status==="UPDATE_PENDING"?<>

     <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="primary" type="button" disabled={!canEditVerificationDecision(saving,pendingAction)} onClick={()=>setPendingAction("VERIFY")} className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">Verify</Button>
      <Button variant="secondary" type="button" disabled={!canEditVerificationDecision(saving,pendingAction)} onClick={()=>setPendingAction("SEND_BACK")} className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">Send back</Button>
     </div>
     {pendingAction==="VERIFY"&&<section aria-label="Confirm verification decision" className="w-full min-w-0 space-y-2 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-[var(--lms-neutral-50)] p-3">
      <h3 className="font-semibold">{verificationDecisionConfirmation(pendingAction,row.section,[reason,additional].filter(Boolean).join(": ")).heading}</h3>
      <p className="break-words text-sm">{verificationDecisionConfirmation(pendingAction,row.section,[reason,additional].filter(Boolean).join(": ")).message}</p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
       <Button variant="primary" type="button" disabled={saving||guardedPending} onClick={()=>void runGuarded(()=>decide(pendingAction))} className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">{verificationDecisionConfirmation(pendingAction,row.section,reason).button}</Button>
       <Button variant="secondary" type="button" disabled={saving} onClick={()=>setPendingAction(null)} className="min-h-11 w-full sm:min-h-[var(--lms-control-height)] sm:w-auto">Cancel</Button>
      </div>
     </section>}
     {saving&&<p role="status">Saving decision…</p>}
    </>:<p className="text-sm">This request is already decided. No actions are available.</p>}
    <section className="space-y-4 border-t border-[var(--lms-canvas-border)] pt-4" aria-label="Previous decisions and history">
      <h3 className="text-[14px] font-semibold text-[var(--lms-heading)]">Previous decisions and history</h3>
    <section className="min-w-0" aria-label="Previous verification decision">
     <h3 className="font-semibold">Recorded decision history</h3>
     <p className="text-sm">Last decision: {verificationDecisionHistory(detail.review).decidedAt??"Not yet decided"}</p>
     <p className="mt-1 whitespace-pre-wrap break-words text-sm">Last reviewer note: {verificationDecisionHistory(detail.review).note??"No note recorded"}</p>
    </section>
    <section aria-label="Verification history" className="space-y-2 min-w-0">
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
    </section>
   </div>:null}
   <Dialog open={pendingAction==="SEND_BACK"} onOpenChange={open=>{if(!open&&!saving)setPendingAction(null);}}
    title={"Send "+(row.section==="EDUCATION"?"Education":"Identity")+" back"}
    description="Each student sees the reason and can correct the submitted details."
    role="alertdialog" dismissible={!saving}
    className="w-full sm:w-[min(540px,100vw)]"
    footer={<div className="flex flex-wrap justify-end gap-2">
     <Button variant="secondary" type="button" disabled={saving} onClick={()=>setPendingAction(null)}>Cancel</Button>
     <Button variant="primary" type="button" disabled={saving||guardedPending||
      [reason,additional.trim()].filter(Boolean).join(": ").trim().length<3||
      [reason,additional.trim()].filter(Boolean).join(": ").length>500}
      onClick={()=>void runGuarded(()=>decide("SEND_BACK"))}>Send back</Button>
    </div>}>
    <div className="space-y-3">
     <p className="text-sm font-semibold">Why are you sending this back?</p>
     <div className="flex flex-wrap gap-2">
      {reasonChoices.map(item=><Button key={item} type="button" variant="secondary"
       aria-pressed={reason===item} onClick={()=>{setReason(item);setError("");}} disabled={saving}>{item}</Button>)}
      <Button type="button" variant="secondary" aria-pressed={!reason} disabled={saving}
       onClick={()=>setReason("")}>Write my own reason</Button>
     </div>
     <label className="grid gap-1 text-sm font-semibold">Or write what needs to change
      <Textarea rows={3} value={additional} onChange={event=>setAdditional(event.target.value)}
       maxLength={500} placeholder="Or write what needs to change" disabled={saving}/>
     </label>
     {error?<p role="alert" className="text-sm text-warning">{error}</p>:null}
    </div>
   </Dialog>
 </Drawer>;
}
