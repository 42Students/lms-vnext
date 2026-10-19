"use client";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {tpoDriveVisibilitySelection,tpoDriveVisibilityValid} from "@/modules/placements/tpo-drive-visibility-bulk-model";
import {mapTpoBulkBounded} from "@/modules/placements/tpo-bulk-bounded-execution";
type Learner={id:string;name:string};
type Drive={id:string;name:string;status:string};
type Outcome={id:string;name:string;status:"saved"|"failed";action:"INCLUDE"|"EXCLUDE"|"CLEAR";overrideId?:string};
export function TpoStudentsDriveVisibility({learners,drives}:{learners:readonly Learner[];drives:readonly Drive[]}){
 const router=useRouter();
 const selection=useTpoStudentsSelection();
 const [jobId,setJobId]=useState("");
 const [decision,setDecision]=useState<"INCLUDE"|"EXCLUDE"|"CLEAR">("INCLUDE");
 const [reason,setReason]=useState("");
 const [confirm,setConfirm]=useState(false),[error,setError]=useState("");
 const [results,setResults]=useState<Outcome[]>([]);
 const [lastActionJobId,setLastActionJobId]=useState("");
 const {run,pending}=useGuardedAction({timeoutMs:120000});
 const picked=tpoDriveVisibilitySelection(selection?.selected??[],learners,200);
 const valid=tpoDriveVisibilityValid({jobId,decision,reason,count:picked.length});
 async function submit(){
  if(!valid||pending)return;
  setError("");setResults([]);
  try{
   await run(async()=>{
    setLastActionJobId(jobId);
    const outcomes=await mapTpoBulkBounded(picked,async(learner):Promise<Outcome>=>{
     try{
      const endpoint="/api/placements/jobs/"+encodeURIComponent(jobId)+
       "/eligibility/"+encodeURIComponent(learner.id);
      const current=await apiFetch<{eligibility:{override:{id:string}|null}}>(
       endpoint,{cache:"no-store"});
      const expectedOverrideId=current.eligibility.override?.id??null;
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
       action:decision,overrideId:data.override.id};
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
  const restorable=results.filter(row=>row.status==="saved"&&row.action!=="CLEAR"&&row.overrideId);
  try{
   await run(async()=>{
    const next=await mapTpoBulkBounded(restorable,async(row):Promise<Outcome>=>{
     try{
      await apiFetch("/api/placements/jobs/"+encodeURIComponent(lastActionJobId)+
       "/eligibility/"+encodeURIComponent(row.id),{
       method:"DELETE",credentials:"same-origin",headers:{"content-type":"application/json"},
       body:JSON.stringify({expectedOverrideId:row.overrideId,
        reason:"Undo previous TPO bulk change"}),
      });
      return {...row,status:"saved",action:"CLEAR"};
     }catch{
      return {...row,status:"failed"};
     }
    },5);
    setResults(next);if(next.some(row=>row.status==="saved"))router.refresh();
   });
  }catch{setError("Undo could not finish. Review the current override before trying again.");}
 }
 return <section aria-label="Show or hide a drive for selected students" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <h2 className="font-semibold">Show or hide a drive for selected students</h2>
  <p className="text-sm text-body">Apply an individual include or exclude decision with a reason. The eligibility rules still protect college and cohort targeting. Existing applications are preserved. Each selected override is version-checked so another officer’s newer decision is not overwritten.</p>
  <p role="status">{picked.length} selected from the current filtered roster (up to 200 per review).</p>
  {drives.length===0?<p>No draft or published drives can be changed here.</p>:null}
  <div className="flex flex-wrap gap-3">
   <label className="grid gap-1 text-sm">Drive
    <Select className="max-w-full" value={jobId} disabled={pending} onChange={e=>{setJobId(e.target.value);setResults([]);}}
     >
     <option value="">Choose a drive</option>
     {drives.map(job=><option key={job.id} value={job.id}>{job.name} · {job.status}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-sm">Action
    <Select value={decision} disabled={pending} onChange={e=>{setDecision(e.target.value as typeof decision);setResults([]);}}
     >
     <option value="INCLUDE">Show / Include</option>
     <option value="EXCLUDE">Hide / Exclude</option>
     <option value="CLEAR">Clear active override</option>
    </Select>
   </label>
  </div>
  <label className="grid gap-1 text-sm">Reason
   <Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}
    />
  </label>
  {decision==="CLEAR"?<p className="text-sm text-warning-text">Clearing an override returns to ordinary eligibility rules. It does not restore an older override or undo an application.</p>:null}
  <Button variant="secondary" type="button" disabled={!valid||pending} onClick={()=>setConfirm(true)}
   >
   Review drive visibility for {picked.length} student(s)
  </Button>
  <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open);}}
   title="Confirm drive eligibility overrides?"
   description={"This "+decision.toLowerCase()+" action is applied separately to "+picked.length+" selected learners. The server rechecks each college and learner."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button disabled={pending||!valid} onClick={()=>void submit()}>{pending?"Saving…":"Confirm changes"}</Button></>}>
   <ul className="list-disc pl-5 text-sm">{picked.map(row=><li key={row.id}>{row.name}</li>)}</ul>
   <p className="mt-2 text-sm">Reason: {reason.trim()}</p>
  </Dialog>
  {results.length>0?<div role="status" aria-live="polite" className="space-y-2 text-sm">
   <p>{results.filter(row=>row.status==="saved").length} saved · {results.filter(row=>row.status==="failed").length} not saved.</p>
   {results.some(row=>row.status==="saved"&&row.action!=="CLEAR"&&row.overrideId)
     ?<Button variant="secondary" type="button" disabled={pending} onClick={()=>void undoLast()}
       >
       Undo saved changes (only if still current)
      </Button>:null}
   <ul className="max-h-48 space-y-1 overflow-y-auto">{results.map(item=><li key={item.id}>
    {item.name} — {item.status==="saved"?"Saved.":"Not saved; open the learner eligibility record before retrying."}
   </li>)}</ul>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
