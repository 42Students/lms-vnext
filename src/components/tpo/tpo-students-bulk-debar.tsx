"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {validateTpoBulkDebarDraft} from "@/modules/placements/tpo-bulk-debar-model";
type Learner={id:string;name:string;debarred:boolean};
type DebarRow={id:string;active:boolean};
type Result={id:string;name:string;status:"saved"|"skipped"|"failed";detail:string};
const endpoint=(id:string)=>"/api/placements/tpo/students/"+encodeURIComponent(id)+"/debarments";
export function TpoStudentsBulkDebar({learners}:{learners:readonly Learner[]}){
 const router=useRouter();
 const shared=useTpoStudentsSelection();
 const [localSelection,setLocalSelection]=useState<string[]>([]);
 const selected=shared?.selected??localSelection;
 const setSelected=shared?.setSelected??setLocalSelection;
 const [action,setAction]=useState<"DEBAR"|"LIFT">("DEBAR");
 const [reason,setReason]=useState("");
 const [untilDate,setUntilDate]=useState("");
 const [untilDrives,setUntilDrives]=useState("1");
 const [duration,setDuration]=useState<"DATE"|"DRIVES"|"MANUAL">("DATE");
 const [confirm,setConfirm]=useState(false);
 const [results,setResults]=useState<Result[]>([]);
 const [error,setError]=useState("");
 const {run:runGuarded,pending}=useGuardedAction({timeoutMs:120000});
 const picked=learners.filter(row=>selected.includes(row.id));
 const MAX=25;
 const check=validateTpoBulkDebarDraft({action,reason,untilDate,duration,untilDrives,count:picked.length});
 async function run(){
  if(pending||!check.ok)return;
  setError("");setResults([]);
  await runGuarded(async()=>{
   const next:Result[]=[];
   for(const learner of picked){
    if(action==="DEBAR"&&learner.debarred || action==="LIFT"&&!learner.debarred){
     next.push({id:learner.id,name:learner.name,status:"skipped",detail:learner.debarred?
      "Already debarred. Review the existing restriction before changing it.":
      "No active restriction is recorded on this roster."});
     continue;
    }
    try{
     let body:Record<string,unknown>;
     if(action==="DEBAR")body={action:"DEBAR",reason:reason.trim(),
      untilDate:duration==="DATE"?untilDate:null,
      untilDrives:duration==="DRIVES"?Number(untilDrives):null};
     else{
      const data=await apiFetch<{rows:DebarRow[]}>(endpoint(learner.id),{cache:"no-store"});
      const active=data.rows.filter(row=>row.active);
      if(!active.length){
       next.push({id:learner.id,name:learner.name,status:"skipped",detail:"Restriction ended before review."});continue;
      }
      if(active.length>1){
       next.push({id:learner.id,name:learner.name,status:"failed",detail:"Multiple restrictions need individual review."});continue;
      }
      body={action:"LIFT",debarmentId:active[0].id,reason:reason.trim()};
     }
     await apiFetch(endpoint(learner.id),{method:"POST",credentials:"same-origin",
      headers:{"content-type":"application/json"},body:JSON.stringify(body)});
     next.push({id:learner.id,name:learner.name,status:"saved",
      detail:action==="DEBAR"?"Debarment recorded. The learner was notified.":"Restriction lifted. The learner was notified."});
    }catch(cause){
     next.push({id:learner.id,name:learner.name,status:"failed",
      detail:cause instanceof FriendlyFetchError&&cause.status===409?
       "This restriction changed. Check the student's current record before retrying.":
       "Could not save this student's restriction. Review it before retrying."});
    }
   }
   setResults(next);setConfirm(false);
   setSelected(ids=>ids.filter(id=>!next.some(row=>row.id===id&&row.status==="saved")));
   if(next.some(row=>row.status==="saved"))router.refresh();
  }).catch(()=>setError("The batch did not finish. Review the per-student results before trying again."));
 }
 return <section aria-label="Bulk student debarment" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="font-semibold">Debar or lift selected students</h2>
  <p className="text-sm">Uses the same students selected in the roster. Each student is checked and updated separately. Existing applications are not deleted.</p>
  <p role="status" className="text-sm">{picked.length} selected on this page (maximum {MAX} per batch).</p>
  <label className="grid max-w-xs gap-1 text-sm">Action
   <select value={action} disabled={pending} onChange={e=>setAction(e.target.value as "DEBAR"|"LIFT")} className="min-h-11 rounded border bg-surface p-2">
    <option value="DEBAR">Debar</option><option value="LIFT">Lift</option>
   </select>
  </label>
  <label className="grid gap-1 text-sm">Reason (required)
   <textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} disabled={pending} className="min-h-20 rounded border p-2"/>
  </label>
  {action==="DEBAR"?<>
   <label className="grid max-w-xs gap-1 text-sm">Until
    <select value={duration} onChange={e=>setDuration(e.target.value as "DATE"|"DRIVES"|"MANUAL")} className="min-h-11 rounded border bg-surface p-2">
     <option value="DATE">A specific date (IST)</option><option value="DRIVES">A number of drives</option><option value="MANUAL">Lifted by placement team</option>
    </select>
   </label>
   {duration==="DATE"?<label className="grid gap-1 text-sm">Last date
    <input type="date" value={untilDate} onChange={e=>setUntilDate(e.target.value)} className="min-h-11 max-w-xs rounded border p-2"/>
   </label>:duration==="DRIVES"?<label className="grid gap-1 text-sm">Number of drives
    <input type="number" min={1} max={10000} value={untilDrives} onChange={e=>setUntilDrives(e.target.value)} className="min-h-11 max-w-xs rounded border p-2"/>
   </label>:null}
  </>:null}
  {!check.ok&&picked.length>0?<p role="alert" className="text-sm text-error">{check.message}</p>:null}
  <button type="button" disabled={!check.ok||pending} onClick={()=>setConfirm(true)}
   className="min-h-11 rounded border border-border px-4 text-sm font-semibold disabled:opacity-50">Review {action==="DEBAR"?"debarment":"lifting"} for {picked.length} student(s)</button>
  <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open);}}
   title={action==="DEBAR"?"Confirm bulk debarment":"Confirm bulk lift"}
   description={"Apply "+action.toLowerCase()+" to up to "+picked.length+" students? Each decision records the named reason and the learner is notified."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button disabled={!check.ok||pending} onClick={()=>void run()}>{pending?"Saving…":"Confirm selected changes"}</Button></>}>
    <ul className="max-h-44 list-disc overflow-y-auto pl-4 text-sm">{picked.map(row=><li key={row.id}>{row.name}</li>)}</ul>
  </Dialog>
  {results.length>0?<div role="status" aria-live="polite" className="space-y-2">
   <p>{results.filter(r=>r.status==="saved").length} saved · {results.filter(r=>r.status==="skipped").length} skipped · {results.filter(r=>r.status==="failed").length} failed.</p>
   <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">{results.map(row=><li key={row.id}><strong>{row.name}</strong> — {row.detail}</li>)}</ul>
  </div>:null}
  {error?<p role="alert" className="text-error">{error}</p>:null}
 </section>;
}
