"use client";
import {useRouter} from "next/navigation";
import {useEffect,useState} from "react";
import {TpoBatchUndoControl} from "./tpo-batch-undo-control";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import type {TpoMembershipDecisionSnapshot} from "@/modules/placements/tpo-participation-model";
type Decision="ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
export function TpoBatchInlineDecision({membershipId,batchId,expected}:{membershipId:string;batchId:string;expected:TpoMembershipDecisionSnapshot}){
 const router=useRouter();
 const {run}=useGuardedAction({timeoutMs:35000});
 const [decision,setDecision]=useState<Decision>(expected.status??"NOT_DECIDED");
 const [reason,setReason]=useState(expected.reason??"");
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [actionId,setActionId]=useState<string|null>(null);
 useEffect(()=>{setDecision(expected.status??"NOT_DECIDED");setReason(expected.reason??"");},[expected.status,expected.reason,expected.updatedAt]);
 const valid=decision!=="INELIGIBLE"||(reason.trim().length>=3&&reason.trim().length<=200);
 async function save(){
  if(!valid||busy)return;
  await run(async()=>{setBusy(true);setError("");setNotice("");setActionId(null);
  try{
   const result=await apiFetch<{changed:boolean;actionId?:string|null}>("/api/placements/tpo/students/"+encodeURIComponent(membershipId)+"/participation",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status:decision,expected,
     ...(decision==="INELIGIBLE"?{reason:reason.trim()}:{}),}),
   });
   setActionId(result.changed?result.actionId??null:null);
   setNotice(result.changed?"Saved 1 decision(s) for learner. Undo":"No decision change was necessary.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}finally{setBusy(false);}
  });
 }
 return <div className="mt-2 flex min-w-0 flex-wrap items-end gap-2">
  <label className="min-w-0 flex-1 text-xs">Learner override
   <select aria-label="Learner eligibility override" className="mt-1 min-h-10 w-full rounded border border-border bg-surface px-2"
    value={decision} disabled={busy} onChange={event=>setDecision(event.target.value as Decision)}>
    <option value="NOT_DECIDED">Inherit class/batch</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option>
   </select>
  </label>
  {decision==="INELIGIBLE"?<label className="min-w-0 flex-1 text-xs">Reason
   <input aria-label="Reason for ineligibility" className="mt-1 min-h-10 w-full rounded border border-border bg-surface px-2" maxLength={200}
    value={reason} disabled={busy} onChange={event=>setReason(event.target.value)}/>
  </label>:null}
  {decision==="INELIGIBLE"?<div className="flex w-full flex-wrap gap-1" role="group" aria-label="Common ineligibility reasons">
    {["Academic criteria not met","Not participating","Missing required documents","Disciplinary restriction","Other"].map(preset=>
      <button key={preset} type="button" disabled={busy}
        onClick={()=>setReason(preset==="Other"?"":preset)}
        className="min-h-9 rounded-md border border-border px-2 text-xs text-body">{preset}</button>)}
    {!valid?<p role="status" className="w-full text-xs text-error">Enter a reason of at least 3 characters.</p>:null}
  </div>:null}
  <button type="button" onClick={()=>void save()} disabled={!valid||busy}
   className="min-h-10 rounded border border-primary px-3 text-sm disabled:opacity-50">
   {busy?"Saving…":"Save decision"}</button>
  {error?<p role="alert" className="w-full text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="w-full text-sm">{notice}</p>:null}
  {actionId?<div className="w-full"><TpoBatchUndoControl batchId={batchId} actionId={actionId}/></div>:null}
 </div>;
}
