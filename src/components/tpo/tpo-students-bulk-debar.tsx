"use client";
import {Textarea} from "@/components/ui/textarea";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import {validateTpoBulkDebarDraft} from "@/modules/placements/tpo-bulk-debar-model";
import {mapTpoBulkBounded} from "@/modules/placements/tpo-bulk-bounded-execution";
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
 const MAX=200;
 const check=validateTpoBulkDebarDraft({action,reason,untilDate,duration,untilDrives,count:picked.length});
 async function run(){
  if(pending||!check.ok)return;
  setError("");setResults([]);
  await runGuarded(async()=>{
   const next=await mapTpoBulkBounded(picked,async(learner):Promise<Result>=>{
    if(action==="DEBAR"&&learner.debarred || action==="LIFT"&&!learner.debarred){
     return {id:learner.id,name:learner.name,status:"skipped",detail:learner.debarred?
      "Already debarred. Review the existing restriction before changing it.":
      "No active restriction is recorded on this roster."};
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
       return {id:learner.id,name:learner.name,status:"skipped",detail:"Restriction ended before review."};
      }
      if(active.length>1){
       return {id:learner.id,name:learner.name,status:"failed",detail:"Multiple restrictions need individual review."};
      }
      const current=active[0];
      if(!current)return {id:learner.id,name:learner.name,status:"failed",detail:"Restriction changed before review."};
      body={action:"LIFT",debarmentId:current.id,reason:reason.trim()};
     }
     await apiFetch(endpoint(learner.id),{method:"POST",credentials:"same-origin",
      headers:{"content-type":"application/json"},body:JSON.stringify(body)});
     return {id:learner.id,name:learner.name,status:"saved",
      detail:action==="DEBAR"?"Debarment recorded. The learner was notified.":"Restriction lifted. The learner was notified."};
    }catch(cause){
     return {id:learner.id,name:learner.name,status:"failed",
      detail:cause instanceof FriendlyFetchError&&cause.status===409?
       "This restriction changed. Check the student's current record before retrying.":
       "Could not save this student's restriction. Review it before retrying."};
    }
   },5);
   setResults(next);setConfirm(false);
   setSelected(ids=>ids.filter(id=>!next.some(row=>row.id===id&&row.status==="saved")));
   if(next.some(row=>row.status==="saved"))router.refresh();
  }).catch(()=>setError("The batch did not finish. Review the per-student results before trying again."));
 }
 return <section aria-label="Bulk student debarment" className="space-y-3 rounded-[var(--lms-canvas-radius)] border border-border bg-surface p-4">
  <h2 className="font-semibold">Debar or lift selected students</h2>
  <p className="text-sm">Uses the same students selected in the roster. Each student is checked and updated separately. Existing applications are not deleted.</p>
  <p role="status" className="text-sm">{picked.length} selected from the filtered roster (maximum {MAX} per batch).</p>
  <label className="grid max-w-xs gap-1 text-sm">Action
   <Select value={action} disabled={pending} onChange={e=>setAction(e.target.value as "DEBAR"|"LIFT")} >
    <option value="DEBAR">Debar</option><option value="LIFT">Lift</option>
   </Select>
  </label>
  <label className="grid gap-1 text-sm">Reason (required)
   <Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} disabled={pending} />
  </label>
  {action==="DEBAR"?<>
   <label className="grid max-w-xs gap-1 text-sm">Until
    <Select value={duration} onChange={e=>setDuration(e.target.value as "DATE"|"DRIVES"|"MANUAL")} >
     <option value="DATE">A specific date (IST)</option><option value="DRIVES">A number of drives</option><option value="MANUAL">Lifted by placement team</option>
    </Select>
   </label>
   {duration==="DATE"?<label className="grid gap-1 text-sm">Last date
    <Input type="date" value={untilDate} onChange={e=>setUntilDate(e.target.value)} className="max-w-xs"/>
   </label>:duration==="DRIVES"?<label className="grid gap-1 text-sm">Number of drives
    <Input type="number" min={1} max={10000} value={untilDrives} onChange={e=>setUntilDrives(e.target.value)} className="max-w-xs"/>
   </label>:null}
  </>:null}
  {!check.ok&&picked.length>0?<p role="alert" className="text-sm text-error">{check.message}</p>:null}
  <Button variant="secondary" type="button" disabled={!check.ok||pending} onClick={()=>setConfirm(true)}
   >Review {action==="DEBAR"?"debarment":"lifting"} for {picked.length} student(s)</Button>
  <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open);}}
   title={action==="DEBAR"?"Confirm bulk debarment":"Confirm bulk lift"}
   description={"Apply "+action.toLowerCase()+" to up to "+picked.length+" students? Each decision records the named reason and the learner is notified."}
   footer={<><Button variant="secondary" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button disabled={!check.ok||pending} onClick={()=>void run()}>{pending?"Saving…":"Confirm selected changes"}</Button></>}>
    <ul className="list-disc pl-4 text-sm">{picked.map(row=><li key={row.id}>{row.name}</li>)}</ul>
  </Dialog>
  {results.length>0?<div role="status" aria-live="polite" className="space-y-2">
   <p>{results.filter(r=>r.status==="saved").length} saved · {results.filter(r=>r.status==="skipped").length} skipped · {results.filter(r=>r.status==="failed").length} failed.</p>
   <ScrollCue axis="y" label="Bulk debarment results" viewportClassName="max-h-64"><ul className="space-y-1 text-sm">{results.map(row=><li key={row.id}><strong>{row.name}</strong> — {row.detail}</li>)}</ul></ScrollCue>
  </div>:null}
  {error?<p role="alert" className="text-error">{error}</p>:null}
 </section>;
}
