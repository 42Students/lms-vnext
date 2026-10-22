"use client";
import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Alert} from "@/components/ui/alert";
import {InlineNotice} from "@/components/ui/inline-notice";
import {tpoRequestFailedRowsTsv} from "@/modules/placements/tpo-request-failed-rows-model";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";

type Row={id:string;studentName:string;requestType:string;expectedUpdatedAt:string;proofMissing?:boolean};
const PROOF_SKIP_NOTE="No proof attached: open it to decide";
type Outcome={id:string;name:string;status:"updated"|"failed";message:string};
const MAX_BULK_REQUESTS=10;

/** Decisions remain separate tenant-scoped and version-checked transactions. */
export function TpoRequestBulkDecision({rows}:{rows:readonly Row[]}){
 const router=useRouter();
 const {run:runGuarded,pending}=useGuardedAction({timeoutMs:120000});
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<"APPROVE"|"REJECT">("APPROVE");
 const [reason,setReason]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [expanded,setExpanded]=useState(false);
 const selectionId=useId();
 const [acknowledged,setAcknowledged]=useState(false);
 const [error,setError]=useState("");
 const [outcomes,setOutcomes]=useState<Outcome[]>([]);
 // Keep the original signed audit identity if the response is lost. A retry
 // must NEVER repeat the separately committed per-learner decisions.
 const [auditRetry,setAuditRetry]=useState<{
  runId:string;action:"APPROVE"|"REJECT";requestIds:string[];
 }|null>(null);
 async function retryAudit(){
  if(!auditRetry||pending)return;
  setError("");
  try{
   await runGuarded(async()=>{
    await apiFetch("/api/placements/tpo/requests/bulk-audit",{
     method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
     body:JSON.stringify(auditRetry),
    });
    setAuditRetry(null);
    router.refresh();
   });
  }catch{
   setError("The batch audit could not be confirmed. You can retry the audit without deciding requests again.");
  }
 }
 async function copyFailed(){
  const text=tpoRequestFailedRowsTsv(outcomes);
  if(!text)return;
  try{
   await navigator.clipboard.writeText(text);
  }catch{setError("Could not copy failed requests. Check browser clipboard permissions.");}
 }
 // Approving without opening never covers a request whose proof is missing; those stay reviewable one by one.
 const chosen=rows.filter(row=>selected.includes(row.id)&&!(action==="APPROVE"&&row.proofMissing));
 const chosenKind=chosen[0]?.requestType??null;
 const valid=chosen.length>0&&chosen.length<=MAX_BULK_REQUESTS&&
  chosen.every(row=>row.requestType===chosenKind)&&
  (action==="APPROVE"||reason.trim().length>=3);
 function toggle(row:Row,checked:boolean){
  if(auditRetry)return;
  if(checked&&action==="APPROVE"&&row.proofMissing)return;
  if(checked&&(selected.length>=MAX_BULK_REQUESTS||chosenKind!==null&&chosenKind!==row.requestType))return;
  setSelected(ids=>checked?[...ids,row.id]:ids.filter(id=>id!==row.id));
  setConfirmOpen(false);setAcknowledged(false);setOutcomes([]);setError("");
 }
 async function submit(){
  if(!valid||!acknowledged||pending||auditRetry)return;
  setError("");
  try{
   await runGuarded(async()=>{
    const results:Outcome[]=[];
    const runId=window.crypto.randomUUID();
    for(const row of chosen){
     try{
      await apiFetch("/api/placements/tpo/requests/"+encodeURIComponent(row.id)+"/decision",{
       method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
       body:JSON.stringify({confirmed:true,action,note:action==="REJECT"?reason.trim():"",
        expectedUpdatedAt:row.expectedUpdatedAt}),
      });
      results.push({id:row.id,name:row.studentName,status:"updated",
       message:action==="APPROVE"?"Approved. The student has been told.":
       "Rejected. The student has been told, with your reason."});
     }catch{
      results.push({id:row.id,name:row.studentName,status:"failed",
       message:"This request was not decided. Open it to check its current status before retrying."});
     }
    }
    setOutcomes(results);
    // Decisions were persisted separately. Audit the batch from authoritative
    // database statuses, never a client-supplied success count; failure to
    // record summary does not pretend those decisions were rolled back.
    const batchAudit={runId,action,requestIds:chosen.map(row=>row.id)};
    let auditRecorded=true;
    try{
     await apiFetch("/api/placements/tpo/requests/bulk-audit",{
      method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
      body:JSON.stringify(batchAudit),
     });
    }catch{
     auditRecorded=false;
     setAuditRetry(batchAudit);
     setError("Decisions were processed, but the batch audit could not be confirmed. Check the request history.");
    }
    setSelected(ids=>ids.filter(id=>!results.some(result=>result.id===id&&result.status==="updated")));
    setAcknowledged(false);setConfirmOpen(false);
    // Keep the audit-only retry control mounted after an uncertain response.
    if(auditRecorded)router.refresh();
   });
  }catch{
   setError("The request review did not finish. Check the decisions before retrying.");
  }
 }
 return <section aria-label="Bulk request decisions" aria-busy={pending} className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-5)]">
  <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center sm:justify-between">
   <h2 className="min-w-0 text-[var(--lms-font-md)] font-semibold leading-[26px]">
    <Button variant="ghost" type="button" aria-expanded={expanded} aria-controls={selectionId} disabled={pending}
     onClick={()=>setExpanded(value=>!value)}
     className="max-w-full">
     <svg aria-hidden="true" className={expanded?"h-4 w-4 shrink-0 rotate-90":"h-4 w-4 shrink-0"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
     </svg>
     Act on selected requests
    </Button>
   </h2>
   <p role="status" className="min-w-0 text-[13px] leading-5 text-[var(--lms-body-text)]">
    {chosen.length} selected of {rows.length} waiting requests on this page.
   </p>
  </div>
  {auditRetry?<Alert tone="error" className="mt-[var(--lms-space-4)]">
   <p>Request decisions are saved, but their batch audit has not been confirmed. Retrying will only check the audit, not decide the requests again.</p>
   <div className="mt-[var(--lms-space-2)] flex">
    <Button variant="secondary" type="button" className="w-full sm:w-auto" disabled={pending} onClick={()=>void retryAudit()}>
     {pending?"Checking batch audit…":"Retry batch audit only"}
    </Button>
   </div>
  </Alert>:null}
  {error?<div className="mt-[var(--lms-space-4)]"><InlineNotice tone="error" message={error}/></div>:null}
  <div id={selectionId} className={expanded?"mt-[var(--lms-space-4)] space-y-[var(--lms-space-4)]":"hidden"}>
   <p className="max-w-prose text-[13px] leading-5 text-[var(--lms-muted-text)]">
    Choose up to {MAX_BULK_REQUESTS} waiting requests of one kind on this page. Each decision is rechecked and saved separately; a failure never approves the next request.
   </p>
   {rows.length>0?<>
    <div tabIndex={0} role="group" aria-label="Waiting requests, scroll for more"
     className="max-h-64 min-h-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
     {rows.map(row=>{
      const checked=selected.includes(row.id);
      const proofBlocked=action==="APPROVE"&&Boolean(row.proofMissing);
      const unavailable=pending||auditRetry!==null||proofBlocked||(!checked&&(selected.length>=MAX_BULK_REQUESTS||(chosenKind!==null&&chosenKind!==row.requestType)));
      return <label key={row.id} className="flex min-h-11 min-w-0 cursor-pointer items-center gap-[var(--lms-space-3)] px-[var(--lms-space-2)] py-[var(--lms-space-2)] text-[var(--lms-font-base)] leading-5 hover:bg-[var(--lms-neutral-50)] focus-within:bg-[var(--lms-neutral-50)]">
       <Checkbox checked={checked} disabled={unavailable} onChange={event=>toggle(row,event.target.checked)}/>
       <span className="min-w-0 break-words text-[var(--lms-body-text)]">{row.studentName} <span className="text-[var(--lms-muted-text)]">· {row.requestType.replaceAll("_"," ")}</span>{proofBlocked?<span className="block text-xs text-[var(--lms-warning-text)]">{PROOF_SKIP_NOTE}</span>:null}</span>
      </label>;
     })}
    </div>
    <div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-4)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)] sm:flex-row sm:items-end">
     <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:w-48 sm:shrink-0">
      Decision
      <Select value={action} disabled={pending||auditRetry!==null} onChange={event=>{setAction(event.target.value as "APPROVE"|"REJECT");setAcknowledged(false);}}>
       <option value="APPROVE">Approve</option><option value="REJECT">Reject</option>
      </Select>
     </label>
     {action==="REJECT"?<label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
      Rejection reason (required)
      <Textarea value={reason} disabled={pending||auditRetry!==null} minLength={3} maxLength={2000} rows={3}
       onChange={event=>{setReason(event.target.value);setAcknowledged(false);}}/>
     </label>:null}
    </div>
    <div className="flex justify-stretch sm:justify-end">
     <Button type="button" className="w-full sm:w-auto" disabled={!valid||pending||auditRetry!==null}
      onClick={()=>{setAcknowledged(false);setConfirmOpen(true);}}>
      Review {chosen.length} selected decision(s)
     </Button>
    </div>
   </>:<p role="status" className="text-[14px] leading-5 text-[var(--lms-body-text)]">Nothing is waiting for you.</p>}
  </div>
  <Dialog open={confirmOpen} onOpenChange={value=>{if(!pending)setConfirmOpen(value);}}
   title={action==="APPROVE"?"Approve selected requests?":"Reject selected requests?"}
   description={action==="APPROVE"?
    "Students are told straight away. Each approval may change a placement record and cannot be undone here.":
    "Each selected student will receive your recorded rejection reason."}
   bodyClassName="!px-[var(--lms-space-4)] !py-[var(--lms-space-4)] sm:!p-[var(--lms-canvas-padding)]"
   footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] sm:flex-row sm:justify-end">
    <Button variant="secondary" className="w-full sm:w-auto" disabled={pending} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
    <Button className="w-full sm:w-auto" disabled={!valid||!acknowledged||pending} onClick={()=>void submit()}>
     {pending?"Saving decisions…":"Confirm decisions"}
    </Button>
   </div>}>
   <div className="space-y-[var(--lms-space-4)]">
    <p className="text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
     Review {chosen.length} {chosenKind?.replaceAll("_"," ").toLowerCase()} request(s) one by one.
    </p>
    <ul tabIndex={0} aria-label="Selected request names, scroll for more"
     className="max-h-40 min-h-0 list-disc divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] py-[var(--lms-space-1)] pl-[var(--lms-space-5)] pr-[var(--lms-space-2)] text-[var(--lms-font-base)] leading-5 [mask-image:linear-gradient(to_bottom,black_0%,black_90%,transparent_100%)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
     {chosen.map(row=><li key={row.id} className="min-w-0 break-words py-[var(--lms-space-2)]">{row.studentName}</li>)}
    </ul>
    <label className="flex min-h-11 cursor-pointer items-start gap-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5 text-[var(--lms-body-text)]">
     <Checkbox checked={acknowledged} disabled={pending} onChange={event=>setAcknowledged(event.target.checked)} className="mt-[2px]"/>
     <span className="min-w-0">I have reviewed these requests and understand the decisions cannot be undone here.</span>
    </label>
   </div>
  </Dialog>
  {outcomes.length>0?<div role="status" aria-live="polite" className="mt-[var(--lms-space-4)] space-y-[var(--lms-space-3)] text-[var(--lms-font-base)] leading-5">
   <div className="flex flex-col gap-[var(--lms-space-2)] sm:flex-row sm:items-center sm:justify-between">
    <p className="font-semibold text-[var(--lms-body-text)]">
     {outcomes.filter(row=>row.status==="updated").length} decided · {outcomes.filter(row=>row.status==="failed").length} not decided.
    </p>
    {outcomes.some(row=>row.status==="failed")?
     <Button variant="secondary" type="button" className="w-full sm:w-auto" onClick={()=>void copyFailed()}>Copy failed</Button>:null}
   </div>
   {outcomes.some(row=>row.status==="failed")?<InlineNotice tone="error" message="Some requests were not decided. Recheck them before retrying."/>:null}
   <ul className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">
    {outcomes.map(row=><li key={row.id} className="min-w-0 break-words py-[var(--lms-space-3)]">
     <strong>{row.name}</strong>: {row.message}
    </li>)}
   </ul>
  </div>:null}
 </section>;
}
