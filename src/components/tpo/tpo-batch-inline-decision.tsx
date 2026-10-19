"use client";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Dialog} from "@/components/ui/dialog";
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
 const router=useRouter();
 const [reasonOpen,setReasonOpen]=useState(false);
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
   <Select className="mt-1" aria-label="Learner eligibility override" 
    value={decision} disabled={busy} onChange={event=>{setDecision(event.target.value as Decision);setReviewed(false);}}>
    <option value="NOT_DECIDED">Inherit class/batch</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option>
   </Select>
  </label>
  {decision==="INELIGIBLE"?<div className="min-w-0 flex-1 space-y-2">
   <p className="text-xs">Reason: {reason.trim()||"Not selected"}</p>
   <Button variant="secondary" type="button" disabled={busy} onClick={()=>setReasonOpen(true)}
    >
    Pick ineligibility reason
   </Button>
   <Dialog open={reasonOpen} onOpenChange={setReasonOpen} dismissible={!busy}
    title="Mark learner ineligible"><div className="space-y-3">
    <p className="text-sm">Pick the reason. Students never see this. You can undo it straight after.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Common ineligibility reasons">
     {LEGACY_INELIGIBLE_REASONS.map(preset=><Button variant="secondary" type="button" key={preset}
      aria-pressed={!other&&reason===preset} disabled={busy}
      onClick={()=>{setReason(preset);setOther(false);setReviewed(false);}}
      >{preset}</Button>)}
     <Button variant="secondary" type="button" aria-pressed={other} disabled={busy}
      onClick={()=>{setOther(true);setReason("");setReviewed(false);}}
      >Other</Button>
    </div>
    {other?<label className="block text-sm">Reason
     <Textarea className="mt-1" autoFocus aria-label="Reason for ineligibility" placeholder="Why are they not in placements?"
       maxLength={200}
      value={reason} disabled={busy} onChange={event=>{setReason(event.target.value);setReviewed(false);}}/>
    </label>:null}
    {!valid?<p role="status" className="text-xs text-error">Enter a reason of at least 3 characters.</p>:null}
    <div className="flex gap-2">
     <Button variant="secondary" type="button" onClick={()=>setReasonOpen(false)} >Cancel</Button>
     <Button variant="primary" type="button" disabled={!valid} onClick={()=>setReasonOpen(false)}
      >Use reason</Button>
    </div>
   </div></Dialog>
  </div>:null}
  <label className="flex w-full items-center gap-2 text-xs text-body">
   <input type="checkbox" checked={reviewed} disabled={busy}
    onChange={event=>setReviewed(event.target.checked)}/>
   I reviewed this learner eligibility decision; it will be audited.
  </label>
  <Button variant="primary" type="button" onClick={()=>void save()} disabled={!valid||busy||!reviewed}
   >
   {busy?"Saving…":"Save decision"}</Button>
  {error?<p role="alert" className="w-full text-sm text-error">{error}</p>:null}
  {notice?<p role="status" className="w-full text-sm">{notice}</p>:null}
  {actionId?<div className="w-full"><TpoBatchUndoControl batchId={batchId} actionId={actionId}/></div>:null}
 </div>;
}
