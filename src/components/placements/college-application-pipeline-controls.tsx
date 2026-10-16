"use client";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {COLLEGE_APPLICATION_STAGES} from "@/modules/placements/college-stage-action-model";
import type {DriveApplicationsQuery} from "@/modules/placements/college-drive-applications-model";
import {CollegeApplicationDetailDrawer} from "./college-application-detail-drawer";
type Row={id:string;name:string|null;rollNumber:string|null;roleTitle:string;
 status:string;screening:string|null;stage:string;previousStage:string|null;stageVersion:number|null};
const transitions:Record<string,readonly string[]>={
 APPLIED:["SHORTLISTED","ASSESSMENT","REJECTED"],
 SHORTLISTED:["ASSESSMENT","INTERVIEW","WAITLISTED","REJECTED"],
 ASSESSMENT:["INTERVIEW","WAITLISTED","REJECTED"],
 INTERVIEW:["WAITLISTED","OFFERED","REJECTED"],
 WAITLISTED:["OFFERED","REJECTED"],OFFERED:["HIRED","REJECTED"],HIRED:[],REJECTED:[],
};
export function CollegeApplicationPipelineControls({jobId,rows,total,query}:{jobId:string;rows:Row[];total:number;query:DriveApplicationsQuery}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [allMatching,setAllMatching]=useState(false);
 const [detailId,setDetailId]=useState<string|null>(null);
 const [target,setTarget]=useState<string>("SHORTLISTED");
 const [reason,setReason]=useState("");
 const [action,setAction]=useState<"MOVE"|"REINSTATE">("MOVE");
 const [dialog,setDialog]=useState(false);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState("");
 const [outcome,setOutcome]=useState<{moved:number;skipped:number;
  results:Array<{applicationId:string;status:string;reason?:string}>}|null>(null);
 const [email,setEmail]=useState(false);
 const eligible=rows.filter(r=>r.status==="SUBMITTED");
 const allPage=eligible.length>0&&eligible.every(r=>selected.includes(r.id));
 const selectedCount=allMatching?total:selected.length;
 const rowMap=useMemo(()=>new Map(rows.map(r=>[r.id,r])),[rows]);
 function toggle(id:string){setAllMatching(false);setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 function selectRow(row:Row,next:string){
  setAllMatching(false);setSelected([row.id]);setTarget(next);setAction(next==="REINSTATE"?"REINSTATE":"MOVE");
  setReason("");setOutcome(null);setError("");setDialog(true);
 }
 function chooseBulk(next:string){
  setAction(next==="REINSTATE"?"REINSTATE":"MOVE");setTarget(next);setReason("");setOutcome(null);setError("");setDialog(true);
 }
 async function save(){
  if(!selectedCount||reason.trim().length<3||busy)return;
  setBusy(true);setError("");setOutcome(null);
  try{
   const response=await fetch("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/pipeline",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,applicationIds:allMatching?[]:selected,
      matchingFilter:allMatching?query:undefined,stage:action==="MOVE"?target:undefined,
      reason:reason.trim(),notifyByEmail:email,confirmed:true}),
   });
   const payload=await response.json() as {error?:string;issues?:Array<{message:string}>;moved?:number;skipped?:number;
    results?:Array<{applicationId:string;status:string;reason?:string}>};
   if(!response.ok)throw Error(payload.issues?.[0]?.message??payload.error??"Could not update applications");
   setOutcome({moved:payload.moved??0,skipped:payload.skipped??0,results:payload.results??[]});
   setAllMatching(false);
   setSelected(payload.results?.filter(r=>r.status==="skipped").map(r=>r.applicationId).slice(0,100)??[]);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Update failed");}finally{setBusy(false);}
 }
 return <section className="space-y-4">
  <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4 text-sm">
   <label className="flex items-center gap-2"><input type="checkbox" checked={allPage}
    disabled={busy||!eligible.length} onChange={e=>{setAllMatching(false);setSelected(e.target.checked?eligible.map(r=>r.id):[]);}} />
    Select all {eligible.length} on this page</label>
   <strong>{selectedCount} selected</strong>
   {total>eligible.length?<button type="button" disabled={busy||total>3000}
    onClick={()=>{setAllMatching(true);setSelected([]);}} className="min-h-10 rounded border border-border px-3 text-primary-text">
    Select all {total.toLocaleString("en-IN")} matching this filter</button>:null}
   {allMatching?<button type="button" onClick={()=>{setAllMatching(false);setSelected([]);}}
    className="min-h-10 rounded border border-border px-3">Clear selection</button>:null}
   {total>3000?<span className="text-error">Narrow filters to 3,000 or fewer applicants before bulk actions.</span>:null}
   <select aria-label="Bulk application action" value={target} onChange={e=>setTarget(e.target.value)}
    className="min-h-10 rounded border border-border bg-surface px-3">
    {COLLEGE_APPLICATION_STAGES.filter(s=>s!=="APPLIED").map(stage=><option key={stage} value={stage}>
      {stage==="SHORTLISTED"?"Shortlist":stage==="REJECTED"?"Reject":
       stage==="ASSESSMENT"?"Move to Assessment":stage==="INTERVIEW"?"Move to Interview":
       stage==="WAITLISTED"?"Move to Waitlisted":stage==="OFFERED"?"Move to Offered":
       stage==="HIRED"?"Mark Hired":stage}</option>)}
   </select>
   <button type="button" disabled={!selectedCount||busy} onClick={()=>chooseBulk(target)}
    className="min-h-10 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
    Act on {selectedCount} selected</button>
   <span className="text-body">Changes are tracked with per-row results and students receive in-app notifications.</span>
  </div>
  <div className="overflow-x-auto rounded-xl border border-border bg-surface">
   <table className="min-w-full text-left text-sm">
    <thead><tr className="border-b border-border bg-muted"><th className="p-3">Select</th>
     <th className="p-3">Learner Name</th><th className="p-3">Roll</th><th className="p-3">Role</th>
     <th className="p-3">Current Status</th><th className="p-3">Screening</th><th className="p-3">Actions</th></tr></thead>
    <tbody>{rows.map(row=><tr key={row.id} className="border-b border-border">
     <td className="p-3"><input type="checkbox" disabled={row.status!=="SUBMITTED"||busy||allMatching}
      aria-label={"Select "+(row.name??row.id)} checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/></td>
     <td className="p-3">{row.name??"Unnamed learner"}</td>
     <td className="p-3">{row.rollNumber??"Not recorded"}</td>
     <td className="p-3">{row.roleTitle}</td><td className="p-3">{row.stage}</td>
     <td className="p-3">{row.screening??"Not recorded"}</td>
     <td className="p-3"><div className="flex flex-wrap gap-2">
      <button type="button" onClick={()=>setDetailId(row.id)}
       className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text">Details</button>
      {row.stage==="REJECTED"?
       <button type="button" disabled={busy||row.status!=="SUBMITTED"} onClick={()=>selectRow(row,"REINSTATE")}
        className="min-h-10 rounded border border-border px-3 font-semibold text-primary-text disabled:opacity-50">Reinstate</button>:
       <select aria-label={"Move "+(row.name??"learner")+" to"} value="" disabled={busy||row.status!=="SUBMITTED"}
        onChange={e=>{if(e.target.value)selectRow(row,e.target.value);}}
        className="min-h-10 max-w-44 rounded border border-border bg-surface px-2">
        <option value="">Move to...</option>
        {(transitions[row.stage]??[]).map(next=><option key={next} value={next}>{next}</option>)}
       </select>}
     </div></td>
    </tr>)}</tbody>
   </table>
  </div>
  {detailId?<CollegeApplicationDetailDrawer key={detailId} jobId={jobId}
    applicationId={detailId} onClose={()=>setDetailId(null)}/>:null}
  {dialog?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div role="dialog" aria-modal="true" aria-label="Application status update"
    className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
    <h2 className="text-lg font-semibold">{action==="REINSTATE"?"Reinstate this application?":
      target==="REJECTED"?"Reject selected applications":"Move applications to "+target}</h2>
    <p className="text-sm text-body">{selectedCount} application(s) chosen. Outcomes requiring real offers and joining confirmations cannot be fabricated from a pipeline change.
      Students are notified in-app of successful actions. Changes that violate screening rules are reported as skipped.</p>
    <ul className="max-h-28 overflow-y-auto text-sm">{selected.slice(0,8).map(id=>
      <li key={id}>{rowMap.get(id)?.name??id}</li>)}
     {selected.length>8?<li>and {selected.length-8} more</li>:null}</ul>
    <label className="grid gap-2 text-sm font-semibold">Reason
     <textarea rows={3} minLength={3} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}
      className="rounded border border-border bg-surface p-3"/></label>
    <label className="flex items-center gap-2 text-sm">
     <input type="checkbox" checked={email} onChange={e=>setEmail(e.target.checked)}/>
     Also notify candidates by email (currently unavailable)
    </label>
    {email?<p role="alert" className="text-sm text-error">Email delivery is not registered for College Admin stage moves. Uncheck email to use in-app notifications.</p>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {outcome?<div role="status" className="max-h-36 overflow-auto rounded border border-border p-3 text-sm">
     <p className="font-semibold">{outcome.moved} updated, {outcome.skipped} skipped.</p>
     {outcome.results.filter(r=>r.status==="skipped").map(r=><p key={r.applicationId}>{rowMap.get(r.applicationId)?.name??r.applicationId}: {r.reason}</p>)}
    </div>:null}
    <div className="flex flex-wrap gap-3">
     <button type="button" disabled={busy||email||reason.trim().length<3||!selectedCount}
      onClick={()=>void save()} className="min-h-11 rounded bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
      {busy?"Updating…":action==="REINSTATE"?"Reinstate "+selectedCount+" application(s)":"Confirm "+selectedCount+" application(s)"}</button>
     <button type="button" disabled={busy} onClick={()=>{setDialog(false);setError("");setOutcome(null);}}
      className="min-h-11 rounded border border-border px-4">Close</button>
    </div>
   </div>
  </div>:null}
 </section>;
}
