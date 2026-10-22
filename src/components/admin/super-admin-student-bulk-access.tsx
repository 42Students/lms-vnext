"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {useEffect,useRef,useState} from "react";
import {superAdminStudentBulkFailure} from "@/modules/module-access/super-admin-student-bulk-feedback";
import {useRouter} from "next/navigation";
type Learner={id:string;name:string};
const MAX_SELECTED_STUDENTS=1000;
export function SuperAdminStudentBulkAccess({learners,collegeId}:{learners:readonly Learner[];collegeId:string}){
 const router=useRouter(),[selected,setSelected]=useState<string[]>([]);
 const pendingRef=useRef(false);
 const lastClickedIndex=useRef<number|null>(null),shiftHandled=useRef(false);
 const [hydratedKey,setHydratedKey]=useState<string|null>(null);
 const storageKey="lms-vnext:student-bulk:"+collegeId;
 useEffect(()=>{
  setHydratedKey(null);
  setSelected([]);
  try{
   const raw=window.sessionStorage.getItem(storageKey);
   const parsed:unknown=raw?JSON.parse(raw):[];
   const ids=Array.isArray(parsed)?parsed.filter((id):id is string=>
    typeof id==="string"&&/^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i.test(id)):[];
   setSelected([...new Set(ids)].slice(0,MAX_SELECTED_STUDENTS));
  }catch{setSelected([]);}
  setHydratedKey(storageKey);
 },[storageKey]);
 useEffect(()=>{
  if(hydratedKey!==storageKey)return;
  try{window.sessionStorage.setItem(storageKey,JSON.stringify(selected));}
  catch{setError("Selection storage is full. Reduce selection before changing pages.");}
 },[selected,storageKey,hydratedKey]);
 const [module,setModule]=useState<"projects"|"electives">("projects");
 const [action,setAction]=useState<"ENABLE"|"DISABLE"|"INHERIT">("ENABLE");
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const [report,setReport]=useState<{requested:number;applied:number;failures:{id:string;error:string}[]}|null>(null);
 const capped=learners;
 const visibleIds=capped.map(row=>row.id);
 const allVisible=visibleIds.length>0&&visibleIds.every(id=>selected.includes(id));
 function toggleVisible(checked:boolean){
  const visible=new Set(visibleIds);
  setSelected(curr=>{
   if(!checked)return curr.filter(id=>!visible.has(id));
   const next=[...new Set([...curr,...visibleIds])];
   if(next.length>MAX_SELECTED_STUDENTS){setError("Select at most 1,000 students.");return curr;}
   return next;
  });
 }
 async function submit(){
  if(pendingRef.current||busy||selected.length===0)return;
  if(selected.length>MAX_SELECTED_STUDENTS){setError("Select at most 1,000 students.");return;}
  if(new Set(selected).size!==selected.length){
   setError("Duplicate student membership IDs in the selection. Refresh this page and try again.");
   return;
  }
  const membershipIds=[...selected],requestedModule=module,requestedAction=action;
  pendingRef.current=true;setBusy(true);setError(null);setReport(null);
  const confirmedIds=new Set<string>();
  const failures:{id:string;error:string}[]=[];
  let groupStart=0;
  function markUnconfirmed(ids:readonly string[],message:string){
   for(const id of ids)failures.push({id,error:message});
  }
  function retainOnlyUnconfirmed(){
   setSelected(curr=>curr.filter(id=>!confirmedIds.has(id)));
  }
  try{
   for(groupStart=0;groupStart<membershipIds.length;groupStart+=25){
    const ids=membershipIds.slice(groupStart,groupStart+25);
    const response=await fetch("/api/admin/students/module-access/bulk",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({membershipIds:ids,module:requestedModule,
      action:requestedAction,confirmed:true}),
    });
    if(!response.ok){
     markUnconfirmed(ids,superAdminStudentBulkFailure(response.status));
     markUnconfirmed(membershipIds.slice(groupStart+ids.length),
      "Not processed after the prior group failed.");
     break;
    }
    const data=await response.json() as {
     requested:number;applied:number;failures:{id:string;error:string}[];
    };
    // Never infer 24 successes from a one-row failure diagnostic.
    // The server commits or rolls back each complete group atomically.
    if(data.requested===ids.length&&data.applied===ids.length&&
       Array.isArray(data.failures)&&data.failures.length===0){
     ids.forEach(id=>confirmedIds.add(id));
     continue;
    }
    const diagnostics=new Map<string,string>(
     Array.isArray(data.failures)?
      data.failures.filter(row=>typeof row.id==="string"&&typeof row.error==="string")
       .map(row=>[row.id,row.error] as const):[],
    );
    markUnconfirmed(ids,"No confirmed group update; "+
      (diagnostics.size?"review the failed row details and retry the whole group.":"refresh the learner rules before retrying."));
    for(const item of failures){
     if(diagnostics.has(item.id))item.error=diagnostics.get(item.id)!;
    }
    markUnconfirmed(membershipIds.slice(groupStart+ids.length),
     "Not processed after the prior group failed.");
    break;
   }
   setReport({requested:membershipIds.length,applied:confirmedIds.size,failures});
   // Retry only the failed/unconfirmed memberships. Confirmed groups are
   // removed from the cross-page selection after the server acknowledges all
   // of their IDs; no successful learner is resubmitted by accident.
   retainOnlyUnconfirmed();
   if(confirmedIds.size>0)router.refresh();
  }catch{
   // A transport failure may happen after the server committed this group.
   // Previously acknowledged groups are safe to clear; this group and all
   // unattempted groups remain selected for a fresh read before retry.
   markUnconfirmed(membershipIds.slice(groupStart),
    "Outcome not confirmed. Refresh this learner's current rule before retrying.");
   setReport({requested:membershipIds.length,applied:confirmedIds.size,failures});
   retainOnlyUnconfirmed();
   setError("The connection interrupted the bulk update. "+
    "Earlier confirmed groups remain saved. The current group's outcome is unknown; "+
    "refresh the rule preview before retrying the remaining students.");
   if(confirmedIds.size>0)router.refresh();
  }finally{pendingRef.current=false;setBusy(false);setConfirmOpen(false);}
 }

 return <section aria-label="Bulk student access" className="min-w-0 space-y-3 pb-4">
  <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold text-[var(--lms-heading)]">Bulk module access</h2></div>
  {selected.length>0?<div role="status" aria-live="polite"
    className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--lms-control-radius)] border border-[var(--lms-primary)] bg-[var(--lms-primary-subtle)] p-3">
    <strong className="text-sm text-body">{selected.length} students selected</strong>
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" variant={module==="projects"?"primary":"secondary"}
       disabled={busy} onClick={()=>setModule("projects")}>Projects</Button>
      <Button type="button" size="sm" variant={module==="electives"?"primary":"secondary"}
       disabled={busy} onClick={()=>setModule("electives")}>Electives</Button>
      <Button type="button" size="sm" variant="secondary" disabled
       title="Placements access is set at college scope, not per student">Placements</Button>
      <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={()=>setSelected([])}>Clear selection</Button>
    </div>
  </div>:null}
  <p className="text-xs text-muted-foreground leading-5">Select at most 1,000 authorized students across roster pages. Each 25-person group is atomic; already completed groups remain committed if a later group fails. Selection is retained across this college's roster pages and filters for this browser session. Updates are saved in validated batches of 25 with a separate audit event for each group. Placements remains configured at college scope (not per student); Projects and Electives can be overridden here. Locked ancestor policies remain protected.</p>
  <label className="flex min-h-11 items-center gap-2 text-sm text-body print:hidden">
   <Checkbox checked={allVisible}
    onChange={e=>toggleVisible(e.target.checked)} disabled={busy}/>
   {allVisible?"Clear":"Select"} all {capped.length} students on this visible page
  </label>
  <div role="region" aria-label="Bulk student selection" tabIndex={0} className="grid max-h-44 gap-2 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] md:grid-cols-2 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] print:hidden">
   {capped.map((learner,index)=><label key={learner.id}
     className={"flex min-h-11 items-center gap-2 rounded-[var(--lms-control-radius)] px-2 text-sm text-body "+(selected.includes(learner.id)?"bg-[var(--lms-primary-subtle)]":"")}>
    <Checkbox checked={selected.includes(learner.id)} disabled={busy}
     aria-label={"Select "+learner.name}
     onClick={event=>{
      if(event.shiftKey&&lastClickedIndex.current!==null){
       const start=Math.min(lastClickedIndex.current,index),end=Math.max(lastClickedIndex.current,index);
       const range=capped.slice(start,end+1).map(row=>row.id);
       shiftHandled.current=true;
       setSelected(curr=>{
        const next=[...new Set([...curr,...range])];
        if(next.length>MAX_SELECTED_STUDENTS){setError("Select at most 1,000 students.");return curr;}
        return next;
       });
      }
      lastClickedIndex.current=index;
     }}
     onChange={event=>{
      if(shiftHandled.current){shiftHandled.current=false;return;}
      setSelected(curr=>{
        if(!event.target.checked)return curr.filter(id=>id!==learner.id);
        const next=[...new Set([...curr,learner.id])];
        if(next.length>MAX_SELECTED_STUDENTS){setError("Select at most 1,000 students.");return curr;}
        return next;
       });
     }}/>
    <span className="min-w-0 break-words">{learner.name}</span>
   </label>)}
  </div>
  <div className="grid min-w-0 grid-cols-1 items-end gap-3 text-sm print:hidden md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
   <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Module<Select value={module} disabled={busy} onChange={e=>setModule(e.target.value as typeof module)}
    className="min-h-11 w-full">
    <option value="projects">Projects</option><option value="electives">Electives</option></Select></label>
   <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Access<Select value={action} disabled={busy} onChange={e=>setAction(e.target.value as typeof action)}
    className="min-h-11 w-full">
    <option value="ENABLE">Enable</option><option value="DISABLE">Disable</option>
    <option value="INHERIT">Clear override / Inherit</option></Select></label>
   <Button variant="primary" type="button" className="min-h-11 w-full md:w-auto" disabled={busy||!selected.length} onClick={()=>setConfirmOpen(true)}
    >{busy?"Saving…":"Review and apply"}</Button>
  </div>
  {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
  {report?<div role="status" className="space-y-1 text-sm text-body">
   <p>{report.applied} of {report.requested} updated · {report.failures.length} failed or not processed</p>
   {report.failures.length?<ul className="list-disc pl-5">{report.failures.map(f=><li key={f.id}>{f.id}: {f.error}</li>)}</ul>:null}
  </div>:null}
  <ConfirmDialog open={confirmOpen} onOpenChange={next=>{if(!busy)setConfirmOpen(next);}}
    title={"Apply " + action.toLowerCase() + " " + module + " access?"}
    description={selected.length + " selected students in this college. Only this college's authorized memberships will be updated."}
    confirmLabel="Apply to selected" confirmVariant={action==="DISABLE"?"danger":"primary"}
    pending={busy} confirmDisabled={busy||selected.length===0}
    onConfirm={()=>void submit()}>
    <p className="text-sm text-body leading-[22px]">
      Each group of 25 is atomic. Earlier confirmed groups remain saved if a later group fails.
      Failed and unprocessed students stay selected for a reviewed retry.
    </p>
  </ConfirmDialog>
 </section>;
}
