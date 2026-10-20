"use client";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {useConfirmFlow} from "@/components/ui/use-confirm-flow";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {TpoBatchUndoControl} from "./tpo-batch-undo-control";
type Decision="ELIGIBLE"|"INELIGIBLE"|"NOT_DECIDED";
export function TpoBatchDecisionControl({batchId,current}:{batchId:string;current:{
 status:string;reason:string|null;expectedVersion:string;
}}){
 const router=useRouter();
 const {askConfirm,dialog}=useConfirmFlow();
 const [decision,setDecision]=useState<Decision>(
  current.status==="ELIGIBLE"?"ELIGIBLE":current.status==="INELIGIBLE"?"INELIGIBLE":"NOT_DECIDED");
 const [reason,setReason]=useState(current.reason??"");
 const [pending,setPending]=useState(false),[error,setError]=useState(""),[message,setMessage]=useState("");
 const [actionId,setActionId]=useState<string|null>(null);
 const valid=decision!=="INELIGIBLE"||reason.trim().length>=3;
 async function submit(){
  if(pending||!valid)return;
  if(!(await askConfirm("Apply this eligibility decision to the entire batch? Learner and class overrides take precedence.")))return;
  setPending(true);setError("");setMessage("");setActionId(null);
  try{
   const response=await fetch("/api/placements/tpo/batches/"+encodeURIComponent(batchId)+"/decisions",{
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
 return <section className="min-w-0 space-y-3 border-y border-border py-4" aria-label="Batch eligibility decision">
  <h2 className="font-semibold">Who is in placements?</h2>
  <p className="text-sm text-muted-foreground">This sets the default for this whole cohort. More specific class and student decisions override it.</p>
  <label className="block text-sm">Batch default decision
   <Select className="min-h-11 md:min-h-9" value={decision} disabled={pending}
     onChange={e=>setDecision(e.target.value as Decision)}>
    <option value="NOT_DECIDED">Not decided</option><option value="ELIGIBLE">Eligible</option><option value="INELIGIBLE">Ineligible</option>
   </Select>
  </label>
  {decision==="INELIGIBLE"?<label className="block text-sm">Reason required
   <Textarea  maxLength={200} value={reason}
    onChange={e=>setReason(e.target.value)} disabled={pending}/>
  </label>:null}
  <Button type="button" onClick={()=>void submit()} disabled={pending||!valid}
   className="min-h-11 md:min-h-9">{pending?"Saving…":"Review and save batch decision"}</Button>
  {error?<InlineNotice tone="error" message={error}/>:null}
  {message?<InlineNotice tone="success" message={message}/>:null}
  {actionId?<TpoBatchUndoControl batchId={batchId} actionId={actionId}/>:null}
  {dialog}
 </section>;
}
