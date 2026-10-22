"use client";
import { Select } from "@/components/ui/select";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {BUG_STATUSES,type BugStatus} from "@/modules/bug-tracker/workflow";
import {auditFindingStatusPayload,canChangeAuditFindingStatus} from "@/modules/bug-tracker/audit-finding-status-action-model";
export function AuditFindingStatusAction({publicId,current,version}:{publicId:string;current:string;version:number}){
 const router=useRouter();
 const [status,setStatus]=useState<BugStatus>(current as BugStatus);
 const [pending,setPending]=useState(false);
 const [review,setReview]=useState(false);
 const inFlight=useRef(false);
 const [feedback,setFeedback]=useState("");
 const [stale,setStale]=useState(false);
 async function submit(){
  if(inFlight.current||!canChangeAuditFindingStatus(current,status,pending))return;
  inFlight.current=true;
  setPending(true);setFeedback("");
  try{
   const response=await fetch("/api/tracker/issues/"+encodeURIComponent(publicId)+"/workflow",{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify(auditFindingStatusPayload(version,status)),
   });
   if(!response.ok){
    if(response.status===409)setStale(true);
    setFeedback(response.status===409?"The finding changed elsewhere. Reload before changing its status.":"Status change was not saved.");
    return;
   }
   const receipt:unknown=await response.json().catch(()=>null);
   const issue=receipt&&typeof receipt==="object"&&!Array.isArray(receipt)
     ?(receipt as {issue?:unknown}).issue:null;
   if(!issue||typeof issue!=="object"||Array.isArray(issue)||
      (issue as Record<string,unknown>)["status"]!==status||
      (issue as Record<string,unknown>)["publicId"]!==publicId)
     throw Error("Tracker update could not be confirmed.");
   setFeedback("Status saved; updating the board.");setReview(false);router.refresh();
  }catch{setFeedback("Connection failure. No status change was confirmed.");}
  finally{inFlight.current=false;setPending(false);}
 }
 return <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Triage status
    <Select value={status} disabled={pending||stale} className="min-h-11 w-full md:min-h-9" onChange={e=>{setStatus(e.target.value as BugStatus);setFeedback("");setReview(false);}}
    >
      {BUG_STATUSES.map(item=><option key={item} value={item}>{item}</option>)}
    </Select>
   </label>
   <Button size="sm" variant="primary" aria-haspopup="dialog" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={stale||!canChangeAuditFindingStatus(current,status,pending)} onClick={()=>setReview(true)}>Review status</Button>
   <p className="min-w-0 text-xs text-muted-foreground sm:col-span-2">Current: {current} · Selected: {status}</p>
   {feedback?<div className="flex min-w-0 flex-wrap items-center gap-2 sm:col-span-2">
     <p role={stale?"alert":"status"} className="min-w-0 flex-1 text-sm text-body">{feedback}</p>
     {stale?<Button type="button" variant="secondary" onClick={()=>router.refresh()}
       className="min-h-11 w-full sm:w-auto md:min-h-9">Refresh finding</Button>:null}
   </div>:null}
   <ConfirmDialog open={review} onOpenChange={next=>{if(!pending)setReview(next);}} pending={pending} confirmLabel="Apply audited status" confirmVariant="primary"
    confirmDisabled={stale||!canChangeAuditFindingStatus(current,status,pending)}
    title="Confirm tracker finding status"
    description={"Change "+publicId+" from "+current+" to "+status+"? The server checks the current version and records the transition."}
    onConfirm={()=>{void submit();}}>
    {feedback?<p role="status" className="text-sm text-body">{feedback}</p>:null}
   </ConfirmDialog>
  </div>;
}
