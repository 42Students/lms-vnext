"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {TpoBatchUndoControl} from "./tpo-batch-undo-control";
type Decision="ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
export function TpoBatchDecisionControl({batchId,current}:{batchId:string;current:{
 status:string;reason:string|null;expectedVersion:string;
}}){
 const router=useRouter();
 const [decision,setDecision]=useState<Decision>(
  current.status==="ELIGIBLE"?"ELIGIBLE":current.status==="INELIGIBLE"?"INELIGIBLE":"NOT_DECIDED");
 const [reason,setReason]=useState(current.reason??"");
 const [pending,setPending]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [actionId,setActionId]=useState<string|null>(null);
 const valid=decision!=="INELIGIBLE"||reason.trim().length>=3;
 async function submit(){
  if(pending||!valid)return;
  if(!window.confirm("Apply this eligibility decision to the entire batch? Learner and class overrides take precedence."))return;
  setPending(true);setError("");setMessage("");setActionId(null);
  try{
   const response=await fetch("/api/placements/tpo/batches/"+batchId+"/decisions",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({membershipId:batchId,decision,expectedVersion:current.expectedVersion,
      ...(decision==="INELIGIBLE"?{reason:reason.trim()}:{})}),
   });
   const body=await response.json() as {error?:string;changedCount?:number;actionId?:string|null};
   if(!response.ok)throw new Error(response.status===409?"Decision changed since opening this page. Refresh before trying again.":body.error??"Unable to save decision.");
   setMessage((body.changedCount??0)>0?"Saved "+body.changedCount+" decision(s) for whole batch. Undo":"No decision change was necessary.");
   setActionId((body.changedCount??0)>0?body.actionId??null:null);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to confirm the change.");}
  finally{setPending(false);}
 }
 return <section className="min-w-0 space-y-3 rounded border border-border bg-surface p-4" aria-label="Batch eligibility decision">
  <h2 className="font-semibold">Who is in placements?</h2>
  <p className="text-sm text-muted-foreground">This sets the default for this whole cohort. More specific class and student decisions override it.</p>
  <label className="block text-sm">Batch default decision
   <select className="mt-1 min-h-11 w-full rounded border border-border bg-surface px-3" value={decision} disabled={pending}
     onChange={e=>setDecision(e.target.value as Decision)}>
    <option value="NOT_DECIDED">Not decided</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option>
   </select>
  </label>
  {decision==="INELIGIBLE"?<label className="block text-sm">Reason required
   <textarea className="mt-1 min-h-20 w-full rounded border border-border bg-surface p-3" maxLength={200} value={reason}
    onChange={e=>setReason(e.target.value)} disabled={pending}/>
  </label>:null}
  <button type="button" onClick={()=>void submit()} disabled={pending||!valid}
   className="min-h-11 rounded bg-primary px-4 text-on-primary disabled:opacity-50">{pending?"Saving…":"Review and save batch decision"}</button>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {message?<p role="status" className="text-sm">{message}</p>:null}
  {actionId?<TpoBatchUndoControl batchId={batchId} actionId={actionId}/>:null}
 </section>;
}
