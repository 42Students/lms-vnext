"use client";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {useMemo,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {COLLEGE_APPLICATION_STAGES} from "@/modules/placements/college-stage-action-model";
import type {DriveApplicationsQuery} from "@/modules/placements/college-drive-applications-model";
import {CollegeApplicationDetailDrawer,type CollegeApplicationDetail} from "./college-application-detail-drawer";
type Row={id:string;name:string|null;email:string|null;collegeName:string;ageDays:number;
 source:string;submittedAt:Date|string;rollNumber:string|null;roleTitle:string;
 status:string;screening:string|null;stage:string;previousStage:string|null;stageVersion:number|null};
const transitions:Record<string,readonly string[]>={
 APPLIED:["SHORTLISTED","ASSESSMENT","REJECTED"],
 SHORTLISTED:["ASSESSMENT","INTERVIEW","WAITLISTED","REJECTED"],
 ASSESSMENT:["INTERVIEW","WAITLISTED","REJECTED"],
 INTERVIEW:["WAITLISTED","OFFERED","REJECTED"],
 WAITLISTED:["OFFERED","REJECTED"],OFFERED:["HIRED","REJECTED"],HIRED:[],REJECTED:[],
};
export function CollegeApplicationPipelineControls({jobId,rows,total,query,basePath="/college/placements"}:{jobId:string;rows:Row[];total:number;query:DriveApplicationsQuery;basePath?: "/college/placements"|"/admin/placements"}){
 const router=useRouter();
 const [selected,setSelected]=useState<string[]>([]);
 const [allMatching,setAllMatching]=useState(false);
 const [detailId,setDetailId]=useState<string|null>(null);
 const [detailPayload,setDetailPayload]=useState<CollegeApplicationDetail|null>(null);
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
 async function openDetail(id:string){
  setError("");
  try{
   const body=await apiFetch<CollegeApplicationDetail>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+
    "/applications/"+encodeURIComponent(id),{cache:"no-store"});
   if(!body?.application)throw Error("Could not load this application. Please try again.");
   setDetailPayload(body);
   setDetailId(id);
  }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({}));}
 }
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
   const payload=await apiFetch<{moved?:number;skipped?:number;results?:Array<{applicationId:string;status:string;reason?:string}>}>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/pipeline",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,applicationIds:allMatching?[]:selected,
      matchingFilter:allMatching?query:undefined,stage:action==="MOVE"?target:undefined,
      reason:reason.trim(),notifyByEmail:email,confirmed:true}),
   });
   setOutcome({moved:payload.moved??0,skipped:payload.skipped??0,results:payload.results??[]});
   setAllMatching(false);
   setSelected(payload.results?.filter(r=>r.status==="skipped").map(r=>r.applicationId).slice(0,100)??[]);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:friendlyApiError({}));}finally{setBusy(false);}
 }
 const columns:DataTableColumn<Row>[]=[
  {key:"selected",header:"Select",mobilePriority:"action",cell:row=>
   <label className="inline-flex min-h-11 items-center gap-2 text-sm">
    <Checkbox aria-label={"Select "+(row.name??row.id)}
     disabled={row.status!=="SUBMITTED"||busy||allMatching}
     checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/> Select</label>},
  {key:"name",header:"Learner Name",mobilePriority:"primary",
   cell:row=>row.name??"Unnamed learner"},
  {key:"email",header:"Email",mobilePriority:"secondary",cell:row=>row.email??"—"},
  {key:"college",header:"College",mobilePriority:"secondary",cell:row=>row.collegeName},
  {key:"roll",header:"Roll",mobilePriority:"secondary",cell:row=>row.rollNumber??"Not recorded"},
  {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle},
  {key:"source",header:"Source",mobilePriority:"secondary",cell:row=>row.source},
  {key:"date",header:"Applied Date",mobilePriority:"secondary",
   cell:row=>new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(new Date(row.submittedAt))},
  {key:"age",header:"Age",mobilePriority:"secondary",cell:row=>row.ageDays+" days"},
  {key:"match",header:"Match Score",mobilePriority:"secondary",
   cell:()=> <span title="No persisted match score available">—</span>},
  {key:"status",header:"Current Status",mobilePriority:"secondary",cell:row=>row.stage},
  {key:"screening",header:"Screening",mobilePriority:"secondary",cell:row=>row.screening??"Not recorded"},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=>
   <div className="flex flex-wrap gap-2">
    <Button type="button" variant="secondary" onClick={()=>void openDetail(row.id)}
     >Details</Button>
    {row.stage==="REJECTED"?
     <Button type="button" disabled={busy||row.status!=="SUBMITTED"}
      variant="secondary" onClick={()=>selectRow(row,"REINSTATE")}
      >Reinstate</Button>:
     <Select aria-label={"Move "+(row.name??"learner")+" to"} value=""
      disabled={busy||row.status!=="SUBMITTED"}
      onChange={event=>{if(event.target.value)selectRow(row,event.target.value);}}
      className="min-h-9 max-w-full text-base sm:text-sm">
      <option value="">Move to...</option>
      {(transitions[row.stage]??[]).map(stage=><option key={stage} value={stage}>{stage}</option>)}
     </Select>}
   </div>},
 ];
 return <section className="space-y-4">
  <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4 text-sm">
   <label className="flex items-center gap-2"><Checkbox checked={allPage}
    disabled={busy||!eligible.length} onChange={e=>{setAllMatching(false);setSelected(e.target.checked?eligible.map(r=>r.id):[]);}} />
    Select all {eligible.length} on this page</label>
   <strong>{selectedCount} selected</strong>
   {total>eligible.length?<Button type="button" disabled={busy||total>3000}
    variant="secondary" onClick={()=>{setAllMatching(true);setSelected([]);}} >
    Select all {total.toLocaleString("en-IN")} matching this filter</Button>:null}
   {allMatching?<Button type="button" variant="secondary" onClick={()=>{setAllMatching(false);setSelected([]);}}
    >Clear selection</Button>:null}
   {total>3000?<span className="text-error">Narrow filters to 3,000 or fewer applicants before bulk actions.</span>:null}
   <Select aria-label="Bulk application action" value={target} onChange={e=>setTarget(e.target.value)}
    className="min-h-9 text-base sm:text-sm">
    {COLLEGE_APPLICATION_STAGES.filter(s=>s!=="APPLIED").map(stage=><option key={stage} value={stage}>
      {stage==="SHORTLISTED"?"Shortlist":stage==="REJECTED"?"Reject":
       stage==="ASSESSMENT"?"Move to Assessment":stage==="INTERVIEW"?"Move to Interview":
       stage==="WAITLISTED"?"Move to Waitlisted":stage==="OFFERED"?"Move to Offered":
       stage==="HIRED"?"Mark Hired":stage}</option>)}
   </Select>
   <Button type="button" disabled={!selectedCount||busy} onClick={()=>chooseBulk(target)}
    >
    Act on {selectedCount} selected</Button>
   <span className="text-body">Changes are tracked with per-row results and students receive in-app notifications.</span>
  </div>
  <DataTable columns={columns} rows={rows} getRowKey={row=>row.id}
   caption="Applications pipeline" empty={<p role="status" className="text-sm text-body">No applications match these filters.</p>}/>
  {detailId?<CollegeApplicationDetailDrawer key={detailId} jobId={jobId}
    applicationId={detailId} initialDetail={detailPayload??undefined} basePath={basePath}
    onClose={()=>{setDetailId(null);setDetailPayload(null);}}/>:null}
  <Dialog open={dialog} onOpenChange={next=>{if(!next&&!busy)setDialog(false);}} title="Application status update" dismissible={!busy}>
    <h2 className="text-lg font-semibold">{action==="REINSTATE"?"Reinstate this application?":
      target==="REJECTED"?"Reject selected applications":"Move applications to "+target}</h2>
    <p className="text-sm text-body">{selectedCount} application(s) chosen. Outcomes requiring real offers and joining confirmations cannot be fabricated from a pipeline change.
      Students are notified in-app of successful actions. Changes that violate screening rules are reported as skipped.</p>
    {selected.length>5?<p id="pipeline-selected-scroll-cue" className="text-xs text-muted-foreground">More selected learners below ↓</p>:null}
   <ul tabIndex={0} role="region" aria-label="Selected applications" aria-describedby={selected.length>5?"pipeline-selected-scroll-cue":undefined}
    className="max-h-28 overflow-y-auto overscroll-contain pb-4 text-sm [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)]">{selected.slice(0,8).map(id=>
      <li key={id}>{rowMap.get(id)?.name??id}</li>)}
     {selected.length>8?<li>and {selected.length-8} more</li>:null}</ul>
    <label className="grid gap-2 text-sm font-semibold">Reason
     <Textarea rows={3} minLength={3} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}
      className="w-full text-base sm:text-sm"/></label>
    <label className="flex items-center gap-2 text-sm">
     <Checkbox checked={email} onChange={e=>setEmail(e.target.checked)}/>
     Also notify candidates by email (currently unavailable)
    </label>
    {email?<p role="alert" className="text-sm text-error">Email delivery is not registered for College Admin stage moves. Uncheck email to use in-app notifications.</p>:null}
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {outcome&&outcome.results.length>5?<p id="pipeline-outcome-scroll-cue" className="text-xs text-muted-foreground">More outcomes below ↓</p>:null}
    {outcome?<div role="status" tabIndex={0} aria-label="Bulk application outcomes" aria-describedby={outcome.results.length>5?"pipeline-outcome-scroll-cue":undefined}
     className="max-h-36 overflow-y-auto overscroll-contain rounded border border-border p-3 pb-5 text-sm [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)]">
     <p className="font-semibold">{outcome.moved} updated, {outcome.skipped} skipped.</p>
     {outcome.results.filter(r=>r.status==="skipped").map(r=><p key={r.applicationId}>{rowMap.get(r.applicationId)?.name??r.applicationId}: {r.reason}</p>)}
    </div>:null}
    <div className="flex flex-wrap gap-3">
     <Button type="button" disabled={busy||email||reason.trim().length<3||!selectedCount}
      onClick={()=>void save()} >
      {busy?"Updating…":action==="REINSTATE"?"Reinstate "+selectedCount+" application(s)":"Confirm "+selectedCount+" application(s)"}</Button>
     <Button type="button" disabled={busy} variant="secondary" onClick={()=>{setDialog(false);setError("");setOutcome(null);}}
      >Close</Button>
    </div>
  </Dialog>
 </section>;
}
