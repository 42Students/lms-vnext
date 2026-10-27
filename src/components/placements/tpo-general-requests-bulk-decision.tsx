"use client";
import {useRef,useState} from "react";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {InlineNotice} from "@/components/ui/inline-notice";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {
 MAX_GENERAL_REQUEST_BULK_DECISIONS,generalRequestBulkBlockReason,planGeneralRequestBulk,
 type GeneralRequestBulkAction,type GeneralRequestBulkRow,
} from "@/modules/placements/tpo-general-request-bulk-model";

type Outcome={id:string;name:string;ok:boolean};
/** Separate CAS-protected decisions, never a pretend atomic batch. An uncertain
 * response is not automatically replayed; the operator must refresh first. */
export function TpoGeneralRequestsBulkDecision({rows,onReviewed}:{
 rows:readonly GeneralRequestBulkRow[];onReviewed:()=>Promise<void>;
}){
 const [expanded,setExpanded]=useState(false);
 const [selected,setSelected]=useState<string[]>([]);
 const [action,setAction]=useState<GeneralRequestBulkAction>("REJECT");
 const [reason,setReason]=useState("");
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [acknowledged,setAcknowledged]=useState(false);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState("");
 const [outcomes,setOutcomes]=useState<Outcome[]>([]);
 const inFlight=useRef(false);
 const plan=planGeneralRequestBulk(rows,selected,action);
 const note=reason.trim();
 const valid=plan.valid&&(action==="APPROVE"||(note.length>=3&&note.length<=2000));
 function toggle(row:GeneralRequestBulkRow,checked:boolean){
  if(inFlight.current)return;
  setSelected(current=>checked?[...current,row.id]:current.filter(id=>id!==row.id));
  setConfirmOpen(false);setAcknowledged(false);setOutcomes([]);setError("");
 }
 async function decide(){
  if(inFlight.current||!valid||!acknowledged||!plan.requests.length)return;
  inFlight.current=true;setPending(true);setError("");setOutcomes([]);
  // Snapshot the selected identities and expected versions; no silent
  // retries after an uncertain write or a stale-row response.
  const requests=[...plan.requests];
  const decision=action,decisionNote=decision==="REJECT"?note:"";
  try{
   const result:Outcome[]=[];
   for(const row of requests){
    try{
     await apiFetch("/api/placements/tpo/requests/general/"+encodeURIComponent(row.id)+"/decision",{
      method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},
      body:JSON.stringify({confirmed:true,version:row.version,action:decision,note:decisionNote}),
     });
     result.push({id:row.id,name:row.studentName??"Student",ok:true});
    }catch{
     result.push({id:row.id,name:row.studentName??"Student",ok:false});
    }
   }
   setOutcomes(result);
   setSelected([]);setAcknowledged(false);setConfirmOpen(false);
   // Fetch authoritative states even if an HTTP response was lost.
   await onReviewed();
  }catch{
   setError("The request list could not be refreshed. Check the current decisions before taking another action.");
  }finally{
   inFlight.current=false;setPending(false);
  }
 }
 // Keep the outcome receipt visible after a successful refresh leaves no pending rows.
 if(!rows.length&&!outcomes.length&&!pending)return null;
 return <section aria-label="Other student request bulk decisions" aria-busy={pending}
   className="space-y-3 border-y border-border py-3">
  <div className="flex flex-wrap items-center justify-between gap-3">
   <Button variant="secondary" type="button" disabled={pending} aria-expanded={expanded}
    onClick={()=>setExpanded(value=>!value)}>Act on selected other requests</Button>
   <p role="status" className="text-xs text-muted-foreground">
    {selected.length} selected · up to {MAX_GENERAL_REQUEST_BULK_DECISIONS} of one kind
   </p>
  </div>
  {expanded?<div className="space-y-3">
   <p className="text-xs text-muted-foreground">
    Each decision is authorized and saved separately. Approval requires a supported effect and valid proof where applicable; review missing proof individually.
   </p>
   <div role="group" aria-label="Select waiting general requests" tabIndex={0}
    className="max-h-64 min-w-0 divide-y divide-border overflow-y-auto border-y border-border">
    {rows.map(row=>{
     const checked=selected.includes(row.id);
     const blocked=generalRequestBulkBlockReason(row,action);
     const wrongKind=plan.kind!==null&&plan.kind!==row.kind;
     const unavailable=!checked&&(Boolean(blocked)||wrongKind||selected.length>=MAX_GENERAL_REQUEST_BULK_DECISIONS);
     return <label key={row.id} className="flex min-h-11 min-w-0 items-center gap-3 px-2 py-2 text-sm">
      <Checkbox checked={checked} disabled={pending||unavailable}
       onChange={event=>toggle(row,event.target.checked)}/>
      <span className="min-w-0 break-words">{row.studentName??"Student"} · {row.kind.replaceAll("_"," ").toLowerCase()}
       {blocked?<span className="block text-xs text-muted-foreground">{blocked}</span>:null}
      </span>
     </label>;
    })}
   </div>
   <label className="grid max-w-xs gap-2 text-sm font-semibold">Decision
    <Select value={action} disabled={pending} onChange={event=>{
     setAction(event.target.value as GeneralRequestBulkAction);
     setAcknowledged(false);setConfirmOpen(false);setError("");
    }}>
     <option value="REJECT">Decline with reason</option>
     <option value="APPROVE">Approve and apply supported effect</option>
    </Select>
   </label>
   {action==="REJECT"?<label className="grid gap-2 text-sm font-semibold">Rejection reason for each learner
    <Textarea value={reason} disabled={pending} minLength={3} maxLength={2000} rows={3}
     onChange={event=>{setReason(event.target.value);setAcknowledged(false);}}/>
   </label>:null}
   {selected.length>0&&plan.error?<InlineNotice tone="error" message={plan.error}/>:null}
   <Button type="button" disabled={!valid||pending} onClick={()=>{
    setAcknowledged(false);setConfirmOpen(true);
   }}>Review {selected.length} selected decision(s)</Button>
  </div>:null}
  {error?<InlineNotice tone="error" message={error}/>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={value=>{if(!pending)setConfirmOpen(value);}}
   title={action==="APPROVE"?"Approve selected requests?":"Decline selected requests?"}
   description="Each learner is notified separately. A partially completed batch cannot be undone or safely replayed automatically."
   confirmLabel={pending?"Saving decisions…":"Confirm decisions"} confirmVariant="primary"
   pending={pending} confirmDisabled={!valid||!acknowledged} onConfirm={()=>void decide()}>
   <div className="space-y-3">
    <p className="text-sm">You are deciding {plan.requests.length} {plan.kind?.replaceAll("_"," ").toLowerCase()} requests.</p>
    <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm">{plan.requests.map(row=>
     <li key={row.id} className="py-1">{row.studentName??"Student"}</li>)}</ul>
    <label className="flex min-h-11 items-center gap-2 text-sm">
     <Checkbox checked={acknowledged} disabled={pending}
      onChange={event=>setAcknowledged(event.target.checked)}/>
     I have reviewed the selections and understand each change is permanent here.
    </label>
   </div>
  </ConfirmDialog>
  {outcomes.length>0?<div role="status" aria-live="polite" className="space-y-2 text-sm">
   <p className="font-semibold">
    {outcomes.filter(item=>item.ok).length} decided · {outcomes.filter(item=>!item.ok).length} uncertain or failed.
   </p>
   {outcomes.some(item=>!item.ok)?<InlineNotice tone="error"
    message="Some requests could not be confirmed. Refresh and inspect their current status before trying again."/>:null}
   <ul className="divide-y divide-border">{outcomes.map(item=>
    <li key={item.id} className="py-2">{item.name}: {item.ok?"Decision saved":"Verify status before retrying"}</li>)}</ul>
  </div>:null}
 </section>;
}
