"use client";
import {Checkbox} from "@/components/ui/checkbox";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useRouter} from "next/navigation";
import {useId,useState} from "react";
import type {VerificationQueueCard} from "@/components/verification/VerificationWorkspace";
import {verificationSelectionKey} from "@/modules/verification/selection-model";
import {collegeBulkReviewPayload} from "@/modules/verification/bulk-client-payload";
import {describeBulkReviewOutcomeRows,type BulkReviewOutcome} from "@/modules/verification/bulk-outcome";

type Action="VERIFY"|"SEND_BACK";
export function TpoRosterVerificationBulk({rows,scope="roster"}:{rows:readonly VerificationQueueCard[];scope?:"roster"|"verification"}){
 const router=useRouter();
 const previewId=useId();
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<Action>("VERIFY");
 const [preview,setPreview]=useState(false);
 const [ack,setAck]=useState(false);
 const [reason,setReason]=useState("Marksheet is missing or unreadable");
 const [busy,setBusy]=useState(false);
 const {run:runGuarded,pending:guardedPending}=useGuardedAction();
 const [error,setError]=useState("");
 const [outcomes,setOutcomes]=useState<BulkReviewOutcome[]>([]);
 const [receiptRows,setReceiptRows]=useState<VerificationQueueCard[]>([]);
 const waiting=[...new Map(rows.filter(row=>
  row.status==="SUBMITTED"||row.status==="UPDATE_PENDING"
 ).map(row=>[verificationSelectionKey(row),row] as const)).values()];
 const educationWaiting=waiting.filter(row=>row.section==="EDUCATION").length;
 const identityWaiting=waiting.filter(row=>row.section==="IDENTITY").length;
 const checked=waiting.filter(row=>selected.includes(verificationSelectionKey(row)));
 const eligible=action==="VERIFY"?checked.filter(row=>!row.missingMarksheet&&!row.missingIdentityProof):checked;
 const skipped=checked.filter(row=>!eligible.includes(row));
 const described=describeBulkReviewOutcomeRows(outcomes,receiptRows);
 function invalidate(){setPreview(false);setAck(false);setError("");setOutcomes([]);setReceiptRows([]);}
 function toggle(id:string){
  setSelected(old=>old.includes(id)?old.filter(item=>item!==id):old.length<20?[...old,id]:old);
  invalidate();
 }
 async function save(){
  if(busy||!preview||eligible.length===0||action==="VERIFY"&&!ack||
    action==="SEND_BACK"&&reason.trim().length<3)return;
  const payload=collegeBulkReviewPayload(eligible.map(row=>({
   learnerMembershipId:row.learnerMembershipId,section:row.section,version:row.version,
   status:row.status==="SUBMITTED"?"SUBMITTED" as const:"UPDATE_PENDING" as const,
  })),action,reason);
  if(payload.items.length===0)return;
  setBusy(true);setError("");
  try{
   const result=await apiFetch<{outcomes:BulkReviewOutcome[];summary?:{attempted:number;succeeded:number;failed:number}}>("/api/tpo/verification/bulk-review",{
    method:"POST",credentials:"same-origin",cache:"no-store",
    headers:{"Content-Type":"application/json"},body:JSON.stringify(payload),
   });
   if(!Array.isArray(result?.outcomes))throw Error("Could not read the verification result. Refresh and try again.");
   setReceiptRows(eligible);
   setOutcomes(result.outcomes);
   setPreview(false);setAck(false);
   // Retain only failed, still-visible sections for a scoped retry. Successful
   // sections must not be resubmitted on the next review.
   const failedKeys=result.outcomes.filter(item=>item.result!=="VERIFIED"&&item.result!=="SENT_BACK")
    .map(item=>item.learnerMembershipId+":"+item.section);
   setSelected(eligible.filter(row=>failedKeys.includes(verificationSelectionKey(row)))
    .map(verificationSelectionKey));
   router.refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Could not review selected students.");}
  finally{setBusy(false);}
 }
 if(!waiting.length&&!outcomes.length)return <section role="status" aria-label="Bulk profile verification" className="space-y-2">
  <p className="text-sm text-muted-foreground leading-[22px]">Nothing waiting in Education or Identity on this page.</p>
  <p className="text-xs text-muted-foreground">No submitted Education sections or Identity sections need review in the current {scope==="roster"?"student roster":"verification queue"} page.</p>
 </section>;
 return <section aria-label="Bulk student profile verification" className="min-w-0 space-y-3 border-b border-border py-4">
  <h2 className="font-semibold text-[var(--lms-heading)] text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px]">Verify profiles / Send back for correction</h2>
  <p className="text-sm text-muted-foreground leading-[22px]">Select up to 20 submitted Education or Identity sections from this current {scope==="roster"?"student roster":"verification queue"} page. Every decision is rechecked, audited, and sent to the student.</p>
  <p role="status" aria-live="polite" className="text-sm tabular-nums leading-[22px]">
   {checked.length} selected of {waiting.length} visible waiting sections ·
   {" "}{waiting.length-checked.length} not selected · limit 20 sections per review.
  </p>
  <p className="text-xs text-muted-foreground">
   Education: {educationWaiting} waiting · Identity: {identityWaiting} waiting.
   Selecting a learner's Education section does not also select Identity.
  </p>
  <label className="flex min-h-11 items-center gap-2 text-sm print:hidden">
   <Checkbox  disabled={busy} checked={waiting.length>0&&waiting.slice(0,20).every(row=>selected.includes(verificationSelectionKey(row)))}
    onChange={event=>{setSelected(event.target.checked?waiting.slice(0,20).map(verificationSelectionKey):[]);invalidate();}}/>
   Select first {Math.min(20,waiting.length)} waiting section(s)
  </label>
  <div className="grid max-h-64 min-w-0 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-1 md:grid-cols-2 print:hidden">
   {waiting.map(row=>{const key=verificationSelectionKey(row);return <label key={key} className="flex min-h-11 min-w-0 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border px-3 py-2 text-sm hover:bg-primary-subtle focus-within:outline-2 focus-within:outline-offset-[3px] focus-within:outline-[var(--lms-primary-text)]">
    <Checkbox  disabled={busy||selected.length>=20&&!selected.includes(key)}
     checked={selected.includes(key)} onChange={()=>toggle(key)}/>
    <span className="min-w-0 break-words">{row.learnerName} · {row.section==="EDUCATION"?"Education":"Identity"}{row.missingMarksheet||row.missingIdentityProof?" · Missing document":""}</span>
   </label>;})}
  </div>
  <label className="grid gap-[6px] text-[13px] print:hidden font-semibold leading-4 text-[var(--lms-neutral-400)]">Action
   <Select  disabled={busy} value={action}
    onChange={event=>{setAction(event.target.value as Action);invalidate();}}>
    <option value="VERIFY">Verify selected</option><option value="SEND_BACK">Send back for correction</option>
   </Select>
  </label>
  {action==="SEND_BACK"?<div className="space-y-2">
   <div className="flex flex-wrap gap-2">
    {(checked.every(row=>row.section==="IDENTITY")
      ?["Identity document is missing or unclear","Submitted details do not match the document"]
      :checked.every(row=>row.section==="EDUCATION")
      ?["Marksheet is missing or unreadable","Submitted details do not match the document"]
      :["Submitted details do not match the document"]).map(item=>
      <Button variant="secondary" type="button" key={item} aria-pressed={reason===item} disabled={busy} onClick={()=>{setReason(item);invalidate();}}
       >{item}</Button>)}
   </div>
   <label className="grid gap-[6px] text-[13px] print:hidden font-semibold leading-4 text-[var(--lms-neutral-400)]">Correction reason (shown to students)
    <Textarea  rows={3} minLength={3} maxLength={500}
     value={reason} disabled={busy} onChange={event=>{setReason(event.target.value);invalidate();}}/>
   </label>
  </div>:null}
  <Button variant="secondary" type="button" aria-expanded={preview} aria-controls={preview?previewId:undefined} disabled={busy||guardedPending||checked.length===0||action==="SEND_BACK"&&reason.trim().length<3}
   onClick={()=>{setPreview(true);setError("");setOutcomes([]);}}
   >Preview selected</Button>
  {preview?<div id={previewId} className="space-y-3 border-t border-border bg-primary-subtle px-3 py-4 md:px-4">
   <h3 className="font-semibold">Review {eligible.length} eligible, {skipped.length} left out</h3>
   {skipped.length?<p className="text-sm text-warning-text leading-[22px]">{skipped.map(row=>row.learnerName+" ("+row.section+")").join(", ")}: a required document is missing.</p>:null}
   {action==="VERIFY"?<label className="flex gap-2 text-sm"><Checkbox  checked={ack} disabled={busy} onChange={event=>setAck(event.target.checked)}/>
    I have checked their documents another way (for example the college&apos;s own records).
   </label>:null}
   <Button variant="primary" type="button" disabled={busy||guardedPending||eligible.length===0||action==="VERIFY"&&!ack}
     onClick={()=>void runGuarded(save)}>
    {busy?"Saving…":action==="VERIFY"?"Confirm verify selected":"Confirm send back selected"}
   </Button>
   <Button variant="secondary" type="button" disabled={busy}  onClick={()=>setPreview(false)}>Cancel preview</Button>
  </div>:null}
  {outcomes.length>0?<div role="status" className="space-y-2 border-t border-border py-3">
   <h3 className="font-semibold">Bulk review results</h3>
   <p>{outcomes.filter(item=>item.result==="VERIFIED"||item.result==="SENT_BACK").length} saved; {outcomes.filter(item=>item.result!=="VERIFIED"&&item.result!=="SENT_BACK").length} need review.</p>
   {outcomes.some(item=>item.result!=="VERIFIED"&&item.result!=="SENT_BACK")?<p className="text-sm text-muted-foreground">Failed sections remain selected if still waiting. Refresh to retry with their latest versions. Sections no longer waiting cannot be retried.</p>:null}
   <div className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-border">
    <table className="w-full min-w-[420px] text-left text-sm">
     <thead className="border-b border-border bg-muted/30"><tr>
      <th scope="col" className="p-2 font-semibold">Learner</th>
      <th scope="col" className="p-2 font-semibold">Section</th>
      <th scope="col" className="p-2 font-semibold">Result</th>
     </tr></thead>
     <tbody className="divide-y divide-border">{described.map(item=><tr key={item.key}>
      <td className="p-2">{item.label}</td>
      <td className="p-2">{item.section}</td>
      <td className="p-2">{item.message}</td>
     </tr>)}</tbody>
    </table>
   </div>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
 </section>;
}
