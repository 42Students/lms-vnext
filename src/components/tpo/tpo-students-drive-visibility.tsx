"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {tpoDriveVisibilitySelection,tpoDriveVisibilityValid} from "@/modules/placements/tpo-drive-visibility-bulk-model";
type Learner={id:string;name:string};
type Drive={id:string;name:string;status:string};
type Outcome={id:string;name:string;status:"saved"|"failed";action:"INCLUDE"|"EXCLUDE"|"CLEAR"};
export function TpoStudentsDriveVisibility({learners,drives}:{learners:readonly Learner[];drives:readonly Drive[]}){
 const router=useRouter();
 const selection=useTpoStudentsSelection();
 const [jobId,setJobId]=useState("");
 const [decision,setDecision]=useState<"INCLUDE"|"EXCLUDE"|"CLEAR">("INCLUDE");
 const [reason,setReason]=useState("");
 const [confirm,setConfirm]=useState(false),[error,setError]=useState("");
 const [results,setResults]=useState<Outcome[]>([]);
 const {run,pending}=useGuardedAction({timeoutMs:120000});
 const picked=tpoDriveVisibilitySelection(selection?.selected??[],learners,25);
 const valid=tpoDriveVisibilityValid({jobId,decision,reason,count:picked.length});
 async function submit(){
  if(!valid||pending)return;
  setError("");setResults([]);
  try{
   await run(async()=>{
    const outcomes:Outcome[]=[];
    for(const learner of picked){
     try{
      const endpoint="/api/placements/jobs/"+encodeURIComponent(jobId)+"/eligibility/"+encodeURIComponent(learner.id);
      await apiFetch(endpoint,decision==="CLEAR"?
       {method:"DELETE",credentials:"same-origin"}:
       {method:"PUT",credentials:"same-origin",headers:{"content-type":"application/json"},
        body:JSON.stringify({decision,reason:reason.trim()})});
      outcomes.push({id:learner.id,name:learner.name,status:"saved",action:decision});
     }catch{
      outcomes.push({id:learner.id,name:learner.name,status:"failed",action:decision});
     }
    }
    setResults(outcomes);setConfirm(false);
    if(outcomes.some(item=>item.status==="saved"))router.refresh();
   });
  }catch{setError("The drive changes did not finish. Review each result before retrying.");}
 }
 return <section aria-label="Show or hide a drive for selected students" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Show or hide a drive for selected students</h2>
  <p className="text-sm text-body">Apply an individual include or exclude decision with a reason. The eligibility rules still protect college and cohort targeting. Existing applications are preserved.</p>
  <p role="status">{picked.length} selected on this visible roster page (up to 25 per review).</p>
  {drives.length===0?<p>No draft or published drives can be changed here.</p>:null}
  <div className="flex flex-wrap gap-3">
   <label className="grid gap-1 text-sm">Drive
    <select value={jobId} disabled={pending} onChange={e=>{setJobId(e.target.value);setResults([]);}}
     className="min-h-11 max-w-full rounded border border-border bg-surface p-2">
     <option value="">Choose a drive</option>
     {drives.map(job=><option key={job.id} value={job.id}>{job.name} · {job.status}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm">Action
    <select value={decision} disabled={pending} onChange={e=>{setDecision(e.target.value as typeof decision);setResults([]);}}
     className="min-h-11 rounded border border-border bg-surface p-2">
     <option value="INCLUDE">Show / Include</option>
     <option value="EXCLUDE">Hide / Exclude</option>
     <option value="CLEAR">Clear active override</option>
    </select>
   </label>
  </div>
  {decision!=="CLEAR"?<label className="grid gap-1 text-sm">Reason
   <textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500}
    className="min-h-20 rounded border border-border bg-surface p-2"/>
  </label>:<p className="text-sm text-warning-text">Clearing an override returns to ordinary eligibility rules. It does not restore an older override or undo an application.</p>}
  <button type="button" disabled={!valid||pending} onClick={()=>setConfirm(true)}
   className="min-h-11 rounded border border-border px-3 font-semibold text-primary-text disabled:opacity-50">
   Review drive visibility for {picked.length} student(s)
  </button>
  <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open);}}
   title="Confirm drive eligibility overrides?"
   description={"This "+decision.toLowerCase()+" action is applied separately to "+picked.length+" selected learners. The server rechecks each college and learner."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button disabled={pending||!valid} onClick={()=>void submit()}>{pending?"Saving…":"Confirm changes"}</Button></>}>
   <ul className="max-h-40 list-disc overflow-auto pl-5 text-sm">{picked.map(row=><li key={row.id}>{row.name}</li>)}</ul>
   {decision!=="CLEAR"?<p className="mt-2 text-sm">Reason: {reason.trim()}</p>:null}
  </Dialog>
  {results.length>0?<div role="status" aria-live="polite" className="space-y-2 text-sm">
   <p>{results.filter(row=>row.status==="saved").length} saved · {results.filter(row=>row.status==="failed").length} not saved.</p>
   <ul className="max-h-48 space-y-1 overflow-y-auto">{results.map(item=><li key={item.id}>
    {item.name} — {item.status==="saved"?"Saved.":"Not saved; open the learner eligibility record before retrying."}
   </li>)}</ul>
  </div>:null}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
