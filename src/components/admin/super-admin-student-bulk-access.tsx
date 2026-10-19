"use client";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {useRef,useState} from "react";
import {bulkStudentSelectionIsCurrent,superAdminStudentBulkFailure} from "@/modules/module-access/super-admin-student-bulk-feedback";
import {useRouter} from "next/navigation";
type Learner={id:string;name:string};
export function SuperAdminStudentBulkAccess({learners}:{learners:readonly Learner[]}){
 const router=useRouter(),[selected,setSelected]=useState<string[]>([]);
 const pendingRef=useRef(false);
 const [module,setModule]=useState<"projects"|"electives">("projects");
 const [action,setAction]=useState<"ENABLE"|"DISABLE"|"INHERIT">("ENABLE");
 const [busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null);
 const [report,setReport]=useState<{requested:number;applied:number;failures:{id:string;error:string}[]}|null>(null);
 const capped=learners.slice(0,100);
 async function submit(){
  if(pendingRef.current||busy)return;
  if(!bulkStudentSelectionIsCurrent(selected,capped.map(learner=>learner.id))){
   setError("The student roster changed. Refresh the page and select students again.");
   setSelected([]);
   return;
  }
  const membershipIds=[...selected],requestedModule=module,requestedAction=action;
  if(!confirm(requestedAction+" "+requestedModule+" access for "+membershipIds.length+" student(s) in this college?"))return;
  // A ref closes the gap before React commits busy=true; the exact confirmed
  // members/action are immutable during this in-flight request.
  pendingRef.current=true;
  setBusy(true);setError(null);setReport(null);
  try{
   const response=await fetch("/api/admin/students/module-access/bulk",{method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({membershipIds,module:requestedModule,action:requestedAction,confirmed:true}),
   });
   if(!response.ok)throw new Error(superAdminStudentBulkFailure(response.status));
   const data=await response.json() as {requested:number;applied:number;failures:{id:string;error:string}[]};
   setReport(data);router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Update failed. Refresh and retry.");}
  finally{pendingRef.current=false;setBusy(false);}
 }
 return <section aria-label="Bulk student access" className="space-y-3 border-b border-border pb-5">
  <div className="flex flex-wrap justify-between gap-3"><h2 className="text-lg font-semibold text-[var(--lms-heading)]">Bulk module access</h2>
   <p role="status" className="text-sm text-muted-foreground">{selected.length}/25 students selected</p></div>
  <p className="text-xs text-muted-foreground">Membership-scoped overrides work for Projects and Electives. Placements is configured at college scope, so it is deliberately not offered here. Locked ancestor policies remain protected.</p>
  <label className="flex min-h-11 items-center gap-2 text-sm">
   <Checkbox checked={capped.length>0&&selected.length===Math.min(capped.length,25)}
    onChange={e=>setSelected(e.target.checked?capped.slice(0,25).map(x=>x.id):[])} disabled={busy}/>
   Select first {Math.min(25,capped.length)} students in these search results
  </label>
  <div role="region" aria-label="Bulk student selection" tabIndex={0} className="grid max-h-44 gap-2 overflow-y-auto overscroll-contain [mask-image:linear-gradient(to_bottom,black_85%,transparent_100%)] sm:grid-cols-2 focus-visible:outline-2 focus-visible:outline-[var(--lms-teal-deep)]">
   {capped.map(learner=><label key={learner.id} className="flex min-h-11 items-center gap-2 text-sm">
    <Checkbox checked={selected.includes(learner.id)} disabled={busy||(!selected.includes(learner.id)&&selected.length>=25)}
     onChange={e=>setSelected(curr=>e.target.checked?[...curr,learner.id]:curr.filter(id=>id!==learner.id))}/>
    <span className="truncate">{learner.name}</span>
   </label>)}
  </div>
  <div className="flex flex-wrap items-end gap-3 text-sm">
   <label className="grid gap-1 font-semibold">Module<Select value={module} disabled={busy} onChange={e=>setModule(e.target.value as typeof module)}
    className="w-full">
    <option value="projects">Projects</option><option value="electives">Electives</option></Select></label>
   <label className="grid gap-1 font-semibold">Access<Select value={action} disabled={busy} onChange={e=>setAction(e.target.value as typeof action)}
    className="w-full">
    <option value="ENABLE">Enable</option><option value="DISABLE">Disable</option>
    <option value="INHERIT">Clear override / Inherit</option></Select></label>
   <Button variant="primary" type="button" disabled={busy||!selected.length} onClick={()=>void submit()}
    >{busy?"Saving…":"Apply to selected"}</Button>
  </div>
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
  {report?<div role="status" className="space-y-1 text-sm">
   <p>{report.applied} of {report.requested} processed · {report.failures.length} failed</p>
   {report.failures.length?<ul className="list-disc pl-5">{report.failures.map(f=><li key={f.id}>{f.id}: {f.error}</li>)}</ul>:null}
  </div>:null}
 </section>;
}
