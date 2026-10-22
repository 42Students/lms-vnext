"use client";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {ScrollCue} from "@/components/ui/scroll-cue";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {InlineNotice} from "@/components/ui/inline-notice";
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
 const visibleIds=new Set(learners.map(row=>row.id));
 const outsideSelection=selected.filter(id=>!visibleIds.has(id)).length;
 const unselectedCount=learners.length-picked.length;
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
 return <section aria-label="Bulk student debarment" className="min-w-0 space-y-3 border-y border-border py-4">
  <h2 className="font-semibold">Debar or lift selected students</h2>
  <p className="text-sm">Uses the same students selected in the roster. Each student is checked and updated separately. Existing applications are not deleted.</p>
  <p role="status" aria-live="polite" className="min-w-0 break-words text-sm text-body">
   {picked.length} selected · {unselectedCount} unselected from this visible roster.
   Maximum {MAX} selected students per batch.
   {outsideSelection>0?" "+outsideSelection+" selected outside this roster will not be changed.":""}
  </p>
  {picked.length>MAX?<InlineNotice tone="error" message={
   "Too many students selected ("+picked.length+"). Limit this batch to "+MAX+" and review the remaining students separately."
  }/>:null}
  {outsideSelection>0?<InlineNotice tone="info" message={
   "Your selection includes "+outsideSelection+" learner(s) from another page or filter. Only the "+picked.length+" visible selected learners are included in this action."
  }/>:null}
  <label className="grid w-full min-w-0 gap-[6px] md:max-w-xs text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Action
   <Select value={action} disabled={pending} onChange={e=>setAction(e.target.value as "DEBAR"|"LIFT")} className="min-h-11 w-full min-w-0 md:min-h-9">
    <option value="DEBAR">Debar</option><option value="LIFT">Lift</option>
   </Select>
  </label>
  <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Reason (required)
   <Textarea value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} disabled={pending} className="min-h-20 w-full min-w-0"/>
  </label>
  {action==="DEBAR"?<>
   <label className="grid w-full min-w-0 gap-[6px] md:max-w-xs text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Until
    <Select value={duration} disabled={pending} onChange={e=>setDuration(e.target.value as "DATE"|"DRIVES"|"MANUAL")} className="min-h-11 w-full min-w-0 md:min-h-9">
     <option value="DATE">A specific date (IST)</option><option value="DRIVES">A number of drives</option><option value="MANUAL">Lifted by placement team</option>
    </Select>
   </label>
   {duration==="DATE"?<label className="grid w-full min-w-0 gap-[6px] md:max-w-xs text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Last date
    <Input type="date" disabled={pending} value={untilDate} onChange={e=>setUntilDate(e.target.value)} className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>:duration==="DRIVES"?<label className="grid w-full min-w-0 gap-[6px] md:max-w-xs text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Number of drives
    <Input type="number" min={1} max={10000} disabled={pending} value={untilDrives} onChange={e=>setUntilDrives(e.target.value)} className="min-h-11 w-full min-w-0 md:min-h-9"/>
   </label>:null}
  </>:null}
  {!check.ok&&picked.length>0?<InlineNotice tone="error" message={check.message}/>:null}
  <Button variant="primary" type="button" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={!check.ok||pending} onClick={()=>setConfirm(true)}
   >Review {action==="DEBAR"?"debarment":"lifting"} for {picked.length} student(s)</Button>
  <Dialog open={confirm} onOpenChange={open=>{if(!pending)setConfirm(open);}}
   title={action==="DEBAR"?"Debar selected students?":"Lift restrictions for selected students?"}
   description={"Review "+picked.length+" selected students in this college before "+(action==="DEBAR"?"restricting placement eligibility":"lifting their restrictions")+". No student is affected until you confirm."}
   footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
    <Button variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={()=>setConfirm(false)}>Cancel</Button>
    <Button variant={action==="DEBAR"?"danger":"primary"} className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={!check.ok||pending} onClick={()=>void run()}>{pending?"Saving…":action==="DEBAR"?"Confirm debarment":"Confirm restriction lift"}</Button>
   </div>}>
    <div className="min-w-0 space-y-2">
     <p role="status" className="text-sm font-semibold text-body">
      {picked.length} selected in this visible college roster · {unselectedCount} unselected.
      {outsideSelection>0?" "+outsideSelection+" selected elsewhere are excluded.":""}
     </p>
     <p className="text-sm text-body">Only authorized learners of this college can be changed; the server rechecks each record. Existing applications are preserved and affected learners are notified.</p>
     <p className="text-sm text-body">Reason: {reason.trim()}</p>
     {action==="DEBAR"?<p className="text-sm text-body">{duration==="DATE"?"Until: "+untilDate:duration==="DRIVES"?"Drives: "+untilDrives:"Lifted by placement team"}</p>:null}
     <ScrollCue axis="y" label="Selected learners for bulk debarment" viewportClassName="max-h-52">
      <ul className="min-w-0 divide-y divide-border text-sm">{picked.map(row=><li key={row.id} className="min-w-0 break-words py-2">{row.name}</li>)}</ul>
     </ScrollCue>
     {error?<InlineNotice tone="error" message={error}/>:null}
    </div>
  </Dialog>
  {results.length>0?<div role="status" aria-live="polite" className="space-y-2">
   <p>{results.filter(r=>r.status==="saved").length} saved · {results.filter(r=>r.status==="skipped").length} skipped · {results.filter(r=>r.status==="failed").length} failed.</p>
   <ScrollCue axis="y" label="Bulk debarment results" viewportClassName="max-h-64"><ul className="min-w-0 divide-y divide-border text-sm">{results.map(row=><li key={row.id} className="min-w-0 break-words py-2"><strong>{row.name}</strong> — {row.detail}</li>)}</ul></ScrollCue>
  </div>:null}
  {error&&!confirm?<InlineNotice tone="error" message={error}/>:null}
 </section>;
}
