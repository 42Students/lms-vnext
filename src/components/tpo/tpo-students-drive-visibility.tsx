"use client";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {useId,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {tpoDriveVisibilitySelection,tpoDriveVisibilityValid} from "@/modules/placements/tpo-drive-visibility-bulk-model";
import {mapTpoBulkBounded} from "@/modules/placements/tpo-bulk-bounded-execution";
type Learner={id:string;name:string};
type Drive={id:string;name:string;status:string};
type PreviousOverride={id:string;decision:"INCLUDE"|"EXCLUDE";reason:string};
type Outcome={id:string;name:string;status:"saved"|"failed";action:"INCLUDE"|"EXCLUDE"|"CLEAR";overrideId?:string;previous?:PreviousOverride|null;undone?:boolean;undoError?:boolean};
export function TpoStudentsDriveVisibility({learners,drives}:{learners:readonly Learner[];drives:readonly Drive[]}){
 const router=useRouter();
 const clearWarningId=useId();
 const selection=useTpoStudentsSelection();
 const [jobId,setJobId]=useState("");
 const [decision,setDecision]=useState<"INCLUDE"|"EXCLUDE"|"CLEAR">("INCLUDE");
 const [reason,setReason]=useState("");
 const [confirm,setConfirm]=useState(false),[error,setError]=useState("");
 const [results,setResults]=useState<Outcome[]>([]);
 const [lastActionJobId,setLastActionJobId]=useState("");
 const [undoFeedback,setUndoFeedback]=useState("");
 const {run,pending}=useGuardedAction({timeoutMs:120000});
 const picked=tpoDriveVisibilitySelection(selection?.selected??[],learners,200);
 const valid=tpoDriveVisibilityValid({jobId,decision,reason,count:picked.length});
 async function submit(){
  if(!valid||pending)return;
  setError("");setResults([]);setUndoFeedback("");
  try{
   await run(async()=>{
    setLastActionJobId(jobId);
    const outcomes=await mapTpoBulkBounded(picked,async(learner):Promise<Outcome>=>{
     try{
      const endpoint="/api/placements/jobs/"+encodeURIComponent(jobId)+
       "/eligibility/"+encodeURIComponent(learner.id);
      const current=await apiFetch<{eligibility:{override:PreviousOverride|null}}>(
       endpoint,{cache:"no-store"});
      const previous=current.eligibility.override;
      const expectedOverrideId=previous?.id??null;
      let data:{override:{id:string}};
      if(decision==="CLEAR"){
       if(!expectedOverrideId)throw new Error("No current override to clear");
       data=await apiFetch<{override:{id:string}}>(endpoint,{
        method:"DELETE",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({expectedOverrideId,reason:reason.trim()}),
       });
      }else{
       data=await apiFetch<{override:{id:string}}>(endpoint,{
        method:"PUT",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({decision,reason:reason.trim(),expectedOverrideId}),
       });
      }
      return {id:learner.id,name:learner.name,status:"saved",
       action:decision,overrideId:decision==="CLEAR"?undefined:data.override.id,previous};
     }catch{
      return {id:learner.id,name:learner.name,status:"failed",action:decision};
     }
    },5);
    setResults(outcomes);setConfirm(false);
    if(outcomes.some(item=>item.status==="saved"))router.refresh();
   });
  }catch{setError("The drive changes did not finish. Review each result before retrying.");}
 }
 async function undoLast(){
  if(pending||!lastActionJobId)return;
  // Undo reinstates the prior explicit INCLUDE or EXCLUDE and keeps the
  // revision audit. The current override ID protects every restoration.
  const restorable=results.filter(row=>row.status==="saved"&&!row.undone&&
   (row.action==="CLEAR"?Boolean(row.previous):Boolean(row.overrideId)));
  if(!restorable.length){setUndoFeedback("Nothing to undo");return;}
  setUndoFeedback("");setError("");
  try{
   await run(async()=>{
    const attempted=await mapTpoBulkBounded(restorable,async(row):Promise<Outcome>=>{
     const endpoint="/api/placements/jobs/"+encodeURIComponent(lastActionJobId)+
      "/eligibility/"+encodeURIComponent(row.id);
     try{
      if(row.previous){
       await apiFetch(endpoint,{method:"PUT",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({decision:row.previous.decision,reason:row.previous.reason,
         expectedOverrideId:row.action==="CLEAR"?null:row.overrideId}),
       });
      }else if(row.overrideId){
       await apiFetch(endpoint,{method:"DELETE",credentials:"same-origin",
        headers:{"content-type":"application/json"},
        body:JSON.stringify({expectedOverrideId:row.overrideId,
         reason:"Undo previous TPO bulk change"}),
       });
      }else{throw new Error("Nothing to undo");}
      return {...row,undone:true,undoError:false};
     }catch{return {...row,undoError:true};}
    },5);
    const applied=new Map(attempted.map(row=>[row.id,row]));
    setResults(current=>current.map(row=>applied.get(row.id)??row));
    const restored=attempted.filter(row=>row.undone).length;
    const failed=attempted.length-restored;
    setUndoFeedback(failed
     ?restored+" override(s) restored; "+failed+" changed again or could not be restored. Review current eligibility."
     :restored+" previous override state(s) restored.");
    if(restored)router.refresh();
   });
  }catch{setError("Undo could not finish. Review the current override before trying again.");}
 }

 return <section aria-label="Show or hide a drive for selected students" className="min-w-0 space-y-3 border-y border-border py-4">
  <h2 className="font-semibold">Show or hide a drive for selected students</h2>
  <p className="text-sm text-body">Apply an individual include or exclude decision with a reason. The eligibility rules still protect college and cohort targeting. Existing applications are preserved. Each selected override is version-checked so another officer’s newer decision is not overwritten. Undo restores the previous explicit Include/Exclude state if your change is still current; history is retained.</p>
  <p role="status" className="break-words text-sm text-body">{picked.length} selected from the current filtered roster (up to 200 per review).</p>
  {drives.length===0?<p role="status" className="text-sm text-body">No draft or published drives can be changed here.</p>:null}
  <div className="grid min-w-0 gap-3 md:grid-cols-2">
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Drive
    <Select className="min-h-11 w-full min-w-0 md:min-h-9" value={jobId} disabled={pending} onChange={e=>{setJobId(e.target.value);setResults([]);}}
     >
     <option value="">Choose a drive</option>
     {drives.map(job=><option key={job.id} value={job.id}>{job.name} · {job.status}</option>)}
    </Select>
   </label>
   <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Action
    <Select className="min-h-11 w-full min-w-0 md:min-h-9" aria-describedby={decision==="CLEAR"?clearWarningId:undefined} value={decision} disabled={pending} onChange={e=>{setDecision(e.target.value as typeof decision);setResults([]);}}
     >
     <option value="INCLUDE">Show / Include</option>
     <option value="EXCLUDE">Hide / Exclude</option>
     <option value="CLEAR">Clear active override</option>
    </Select>
   </label>
  </div>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason
   <Textarea className="w-full min-w-0" value={reason} disabled={pending} onChange={e=>setReason(e.target.value)} maxLength={500}
    />
  </label>
  {decision==="CLEAR"?<p id={clearWarningId} className="text-sm text-warning-text">Clearing an override returns to ordinary eligibility rules. It does not restore an older override or undo an application.</p>:null}
  <Button variant="primary" type="button" aria-haspopup="dialog" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={!valid||pending} onClick={()=>setConfirm(true)}
   >
   Review drive visibility for {picked.length} student(s)
  </Button>
  <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open);}}
   title="Confirm drive eligibility overrides?"
   description={"This "+decision.toLowerCase()+" action is applied separately to "+picked.length+" selected learners. The server rechecks each college and learner."}
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button type="button" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending||!valid} onClick={()=>void submit()}>{pending?"Saving…":"Confirm changes"}</Button>
   </div>}>
   <div className="min-w-0 space-y-2">
    <p className="break-words text-sm text-body">Reason: {reason.trim()}</p>
    <ScrollCue axis="y" label="Learners in visibility override" viewportClassName="max-h-52">
     <ul className="min-w-0 divide-y divide-border text-sm">{picked.map(row=><li key={row.id} className="min-w-0 break-words py-2">{row.name}</li>)}</ul>
    </ScrollCue>
    {error?<InlineNotice tone="error" message={error}/>:null}
   </div>
  </Dialog>
  {results.length>0?<div role="status" aria-live="polite" className="space-y-2 text-sm">
   <p>{results.filter(row=>row.status==="saved").length} saved · {results.filter(row=>row.status==="failed").length} not saved.</p>
   {results.some(row=>row.status==="saved"&&!row.undone&&(row.action==="CLEAR"?Boolean(row.previous):Boolean(row.overrideId)))
     ?<Button variant="secondary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" loading={pending} disabled={pending} onClick={()=>void undoLast()}
       >
       Restore previous override state (only if still current)
      </Button>:null}
   <ul className="max-h-48 min-w-0 divide-y divide-border overflow-y-auto">{results.map(item=><li key={item.id} className="min-w-0 break-words py-2">
    {item.name} — {item.undone?"Previous state restored.":item.undoError?"Undo unavailable: a later change may have occurred.":item.status==="saved"?"Saved.":"Not saved; open the learner eligibility record before retrying."}
   </li>)}</ul>
  </div>:null}
  {undoFeedback?<p role="status" aria-live="polite" className="text-sm text-body">{undoFeedback}</p>:null}
  {error&&!confirm?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
