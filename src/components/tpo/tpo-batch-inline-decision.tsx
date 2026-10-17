"use client";
import {useRouter} from "next/navigation";
import {useRef,useState} from "react";
import {TpoBatchUndoControl} from "./tpo-batch-undo-control";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import type {TpoMembershipDecisionSnapshot} from "@/modules/placements/tpo-participation-model";
type Decision="ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
const LEGACY_INELIGIBLE_REASONS=[
 "Higher studies","Not interested in placements","Detained / year back",
 "Discontinued","Disciplinary","Already has a job",
] as const;
export function TpoBatchInlineDecision({membershipId,batchId,expected}:{membershipId:string;batchId:string;expected:TpoMembershipDecisionSnapshot}){
 const router=useRouter(),reasonDialog=useRef<HTMLDialogElement>(null);
 const {run}=useGuardedAction({timeoutMs:35000});
 const [decision,setDecision]=useState<Decision>(expected.status??"NOT_DECIDED");
 const [reason,setReason]=useState(expected.reason??"");
 const [other,setOther]=useState(false),[reviewed,setReviewed]=useState(false);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [actionId,setActionId]=useState<string|null>(null);
 const valid=decision!=="INELIGIBLE"||(reason.trim().length>=3&&reason.trim().length<=200);
 async function save(){
  if(!valid||busy)return;
  if(!reviewed)return;
  await run(async()=>{setBusy(true);setError("");setNotice("");setActionId(null);
  try{
   const result=await apiFetch<{changed:boolean;actionId?:string|null}>("/api/placements/tpo/students/"+encodeURIComponent(membershipId)+"/participation",{
    method:"PUT",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({status:decision,expected,
     ...(decision==="INELIGIBLE"?{reason:reason.trim()}:{}),}),
   });
   setReviewed(false);
   setActionId(result.changed?result.actionId??null:null);
   setNotice(result.changed?"Saved 1 decision(s) for learner. Undo":"No decision change was necessary.");
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}finally{setBusy(false);}
  });
 }
 return <div className="mt-2 flex min-w-0 flex-wrap items-end gap-2">
  <label className="min-w-0 flex-1 text-xs">Learner override
   <select aria-label="Learner eligibility override" className="mt-1 min-h-10 w-full rounded border border-border bg-surface px-2"
    value={decision} disabled={busy} onChange={event=>{setDecision(event.target.value as Decision);setReviewed(false);}}>
    <option value="NOT_DECIDED">Inherit class/batch</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option>
   </select>
  </label>
  {decision==="INELIGIBLE"?<div className="min-w-0 flex-1 space-y-2">
   <p className="text-xs">Reason: {reason.trim()||"Not selected"}</p>
   <button type="button" disabled={busy} onClick={()=>reasonDialog.current?.showModal()}
    className="min-h-10 rounded border border-border px-3 text-xs text-primary-text">
    Pick ineligibility reason
   </button>
   <dialog ref={reasonDialog} aria-label="Mark learner ineligible"
    onCancel={event=>{if(busy)event.preventDefault();}}
    className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-lg space-y-3 overflow-y-auto rounded-xl border border-border bg-surface p-5 text-foreground backdrop:bg-black/40">
    <h3 className="font-semibold">Mark learner ineligible</h3>
    <p className="text-sm">Pick the reason. Students never see this. You can undo it straight after.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Common ineligibility reasons">
     {LEGACY_INELIGIBLE_REASONS.map(preset=><button type="button" key={preset}
      aria-pressed={!other&&reason===preset} disabled={busy}
      onClick={()=>{setReason(preset);setOther(false);setReviewed(false);}}
      className="min-h-10 rounded border border-border px-2 text-xs text-primary-text">{preset}</button>)}
     <button type="button" aria-pressed={other} disabled={busy}
      onClick={()=>{setOther(true);setReason("");setReviewed(false);}}
      className="min-h-10 rounded border border-border px-2 text-xs text-primary-text">Other</button>
    </div>
    {other?<label className="block text-sm">Reason
     <textarea autoFocus aria-label="Reason for ineligibility" placeholder="Why are they not in placements?"
      className="mt-1 min-h-20 w-full rounded border border-border bg-surface p-2" maxLength={200}
      value={reason} disabled={busy} onChange={event=>{setReason(event.target.value);setReviewed(false);}}/>
    </label>:null}
    {!valid?<p role="status" className="text-xs text-error">Enter a reason of at least 3 characters.</p>:null}
    <div className="flex gap-2">
     <button type="button" onClick={()=>reasonDialog.current?.close()} className="min-h-10 rounded border border-border px-3">Cancel</button>
     <button type="button" disabled={!valid} onClick={()=>reasonDialog.current?.close()}
      className="min-h-10 rounded bg-primary px-3 text-on-primary disabled:opacity-50">Use reason</button>
    </div>
   </dialog>
  </div>:null}
  <label className="flex w-full items-center gap-2 text-xs text-body">
   <input type="checkbox" checked={reviewed} disabled={busy}
    onChange={event=>setReviewed(event.target.checked)}/>
   I reviewed this learner eligibility decision; it will be audited.
  </label>
  <button type="button" onClick={()=>void save()} disabled={!valid||busy||!reviewed}
   className="min-h-10 rounded border border-primary px-3 text-sm disabled:opacity-50">
   {busy?"Saving…":"Save decision"}</button>
  {error?<p role="alert" className="w-full text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="w-full text-sm">{notice}</p>:null}
  {actionId?<div className="w-full"><TpoBatchUndoControl batchId={batchId} actionId={actionId}/></div>:null}
 </div>;
}
