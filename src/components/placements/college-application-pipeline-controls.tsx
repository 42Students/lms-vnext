"use client";
import Link from "next/link";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Select} from "@/components/ui/select";
import {Textarea} from "@/components/ui/textarea";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {useEffect,useMemo,useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {useToast} from "@/components/ui/toast";
import {COLLEGE_APPLICATION_STAGES,COLLEGE_APPLICATION_TRANSITIONS} from "@/modules/placements/college-stage-action-model";
import type {DriveApplicationsQuery} from "@/modules/placements/college-drive-applications-model";
import {CollegeApplicationDetailDrawer,type CollegeApplicationDetail} from "./college-application-detail-drawer";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge, applicationStatusTone } from "@/components/ui/status-badge";
type Row={id:string;name:string|null;email:string|null;collegeName:string;ageDays:number;
 source:string;submittedAt:Date|string;rollNumber:string|null;roleTitle:string;
 status:string;screening:string|null;stage:string;previousStage:string|null;stageVersion:number|null;
 allowedNextStages?:readonly string[];stageMovedByName?:string|null;stageMovedAt?:string|null;};
const transitions=COLLEGE_APPLICATION_TRANSITIONS;
const istDateTime=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"});
const istDay=new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"});
function stageAge(row:Row){
 const start=new Date(row.stageMovedAt??row.submittedAt).getTime();
 if(!Number.isFinite(start))return null;
 return Math.max(0,Math.floor((Date.now()-start)/86400000));
}
const stageLabel=(stage:string)=>stage.replaceAll("_"," ").toLowerCase()
 .replace(/(^|\s)\S/g,match=>match.toUpperCase());
export function CollegeApplicationPipelineControls({jobId,rows,total,query,basePath="/college/placements",initialDetailId=null,legacyShortlisted=false}:{jobId:string;rows:Row[];total:number;query:DriveApplicationsQuery;basePath?: "/college/placements"|"/admin/placements";initialDetailId?:string|null;legacyShortlisted?:boolean}){
 const router=useRouter();
 const {showToast}=useToast();
 // A late network reply from the previous selected college must not open a
 // drawer or change row selections in the new workspace.
 const scopeEpoch=useRef(0);
 const activeScope=jobId+"|"+basePath;
 const filterScope=JSON.stringify({...query,page:1});
 const [failedDetailId,setFailedDetailId]=useState<string|null>(null);
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
 useEffect(()=>{
  scopeEpoch.current+=1;
  setSelected([]);setAllMatching(false);setDetailId(null);setDetailPayload(null);
  setDialog(false);setBusy(false);setError("");setOutcome(null);setFailedDetailId(null);
 },[activeScope]);
 useEffect(()=>{
  // Reject late drawer responses and hidden selection after filter changes.
  scopeEpoch.current+=1;
  setAllMatching(false);setSelected([]);setDetailId(null);setDetailPayload(null);
  setFailedDetailId(null);setDialog(false);setError("");setOutcome(null);
 },[filterScope]);
 useEffect(()=>{
  // The detail API separately rechecks selected-college access.
  if(initialDetailId)void openDetail(initialDetailId);
 },[activeScope,initialDetailId,filterScope]);
 const eligible=rows.filter(r=>r.status==="SUBMITTED");
 const allPage=eligible.length>0&&eligible.every(r=>selected.includes(r.id));
 const selectedCount=allMatching?total:selected.length;
 const rowMap=useMemo(()=>new Map(rows.map(r=>[r.id,r])),[rows]);
 function toggle(id:string){setAllMatching(false);setSelected(current=>current.includes(id)?current.filter(x=>x!==id):[...current,id]);}
 async function openDetail(id:string){
  const epoch=scopeEpoch.current;
  setError("");setFailedDetailId(null);
  try{
   const body=await apiFetch<CollegeApplicationDetail>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+
    "/applications/"+encodeURIComponent(id),{cache:"no-store"});
   if(scopeEpoch.current!==epoch)return;
   if(!body?.application||body.application.id!==id)
    throw Error("Could not load this application. Please try again.");
   setDetailPayload(body);
   setDetailId(id);
  }catch(reason){
   if(scopeEpoch.current!==epoch)return;
   setFailedDetailId(id);
   setError(reason instanceof Error?reason.message:friendlyApiError({}));
  }
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
  const epoch=scopeEpoch.current;
  setBusy(true);setError("");setOutcome(null);
  try{
   const payload=await apiFetch<{moved?:number;skipped?:number;results?:Array<{applicationId:string;status:string;reason?:string}>}>("/api/placements/college/jobs/"+encodeURIComponent(jobId)+"/pipeline",{
    method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,applicationIds:allMatching?[]:selected,
      matchingFilter:allMatching?query:undefined,stage:action==="MOVE"?target:undefined,
      reason:reason.trim(),notifyByEmail:false,confirmed:true}),
   });
   if(scopeEpoch.current!==epoch)return;
   const moved=payload.moved??0,skipped=payload.skipped??0;
   setOutcome({moved,skipped,results:payload.results??[]});
   setAllMatching(false);
   setSelected(payload.results?.filter(r=>r.status==="skipped").map(r=>r.applicationId).slice(0,100)??[]);
   showToast({tone:skipped?"info":"success",
    title:skipped?moved+" updated, "+skipped+" skipped":"Application status updated",
    description:skipped?"Review skipped applicants and retry after refreshing.":"Candidates were notified in-app."});
   router.refresh();
  }catch(e){
   if(scopeEpoch.current!==epoch)return;
   setError(e instanceof Error?e.message:friendlyApiError({}));
  }finally{
   if(scopeEpoch.current===epoch)setBusy(false);
  }
 }
 const filtered=Boolean(query.q||query.status!=="ALL"||query.source!=="ALL"||
  query.stage!=="ALL"||query.screening!=="ALL"||query.departmentId||
  query.programId||query.cohortId||query.appliedFrom||query.appliedTo);
 const clearHref=basePath+"/jobs/"+encodeURIComponent(jobId)+"/applications";
 const dialogTitle=action==="REINSTATE"?"Reinstate application?":
  target==="REJECTED"?"Reject application?":"Move applications to "+stageLabel(target);
 const columns:DataTableColumn<Row>[]=[
  {key:"name",header:"Learner Name",mobilePriority:"primary",
   cell:row=><span className="font-semibold text-foreground">{row.name?.trim()||"—"}</span>},
  {key:"selected",header:"Select",mobilePriority:"action",cell:row=>
   <label className="inline-flex min-h-11 items-center gap-2 text-sm">
    <Checkbox aria-label={"Select "+(row.name??row.id)}
     disabled={row.status!=="SUBMITTED"||busy||allMatching}
     checked={selected.includes(row.id)} onChange={()=>toggle(row.id)}/> Select</label>},

  {key:"email",header:"Email",mobilePriority:"secondary",cell:row=>row.email?.trim()||"—"},
  {key:"college",header:"College",mobilePriority:"secondary",cell:row=>row.collegeName?.trim()||"—"},
  {key:"roll",header:"Roll",mobilePriority:"secondary",cell:row=>row.rollNumber?.trim()||"—"},
  {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle?.trim()||"—"},
  {key:"source",header:"Source",mobilePriority:"secondary",cell:row=><StatusBadge tone="info">{row.source==="EXTERNAL"?"External":row.source==="INTERNAL"?"Internal":row.source||"—"}</StatusBadge>},
  {key:"date",header:"Applied Date",mobilePriority:"secondary",
   cell:row=>Number.isFinite(new Date(row.submittedAt).getTime())?istDay.format(new Date(row.submittedAt)):"—"},
  {key:"age",header:"Age",mobilePriority:"secondary",cell:row=>{
   const days=stageAge(row);
   return <span title={row.stageMovedAt?"Time since most recent stage change":"Time since application"}
     className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--lms-info)]"/>
     {days===null?"—":days+"d"}</span>;
  }},

  {key:"status",header:"Current Status",mobilePriority:"secondary",cell:row=>
   <span className="inline-flex flex-col items-start gap-1">
    <StatusBadge tone={applicationStatusTone(row.stage)}>{stageLabel(row.stage)}</StatusBadge>
    {row.stageMovedAt&&Number.isFinite(Date.parse(row.stageMovedAt))?
     <span className="text-xs text-muted-foreground" title="Last stage change">{istDateTime.format(new Date(row.stageMovedAt))} IST</span>:null}
   </span>},
  {key:"screening",header:"Screening",mobilePriority:"secondary",cell:row=>row.screening?<StatusBadge tone={applicationStatusTone(row.screening)}>{stageLabel(row.screening)}</StatusBadge>:"—"},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=>
   <div className="flex min-w-[210px] flex-wrap items-center gap-2">
    <Button type="button" variant="secondary" onClick={()=>void openDetail(row.id)}
     aria-label={"View Details for "+(row.name||"learner")} disabled={busy}
     className="min-h-11 text-xs md:min-h-9">View Details</Button>
    {legacyShortlisted&&row.stage==="ASSESSMENT"&&
      (row.allowedNextStages??transitions[row.stage]??[]).includes("INTERVIEW")?
      <Link href={basePath+"/jobs/"+encodeURIComponent(jobId)+"/interviews?applicationId="+encodeURIComponent(row.id)}
       className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-primary-text underline md:min-h-9">
       Mark Passed · Schedule Interview</Link>:null}
    {legacyShortlisted&&row.stage==="INTERVIEW"&&
      (row.allowedNextStages??transitions[row.stage]??[]).includes("OFFERED")?
      <Button type="button" variant="secondary" disabled={busy} onClick={()=>selectRow(row,"OFFERED")}
       className="min-h-11 text-xs md:min-h-9">Move to Offered</Button>:null}
    {legacyShortlisted&&row.stage==="OFFERED"&&
      (row.allowedNextStages??transitions[row.stage]??[]).includes("HIRED")?
      <Button type="button" variant="secondary" disabled={busy} onClick={()=>selectRow(row,"HIRED")}
       className="min-h-11 text-xs md:min-h-9">Mark Hired</Button>:null}
    {row.stage==="INTERVIEW"&&basePath==="/college/placements"?
     <Link href={basePath+"/jobs/"+encodeURIComponent(jobId)+"/interviews?applicationId="+encodeURIComponent(row.id)}
      className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-xs font-semibold text-primary-text underline md:min-h-9">
      Schedule Interview</Link>:null}
    {row.stage==="REJECTED"?
     <Button type="button" disabled={busy||row.status!=="SUBMITTED"}
      aria-label={"Reinstate "+(row.name||"learner")} variant="secondary"
      onClick={()=>selectRow(row,"REINSTATE")} className="min-h-11 text-xs md:min-h-9">Reinstate</Button>:
     <Select aria-label={"Move "+(row.name||"learner")+" to"} value=""
      disabled={busy||row.status!=="SUBMITTED"}
      onChange={event=>{if(event.target.value)selectRow(row,event.target.value);}}
      className="min-h-11 min-w-32 max-w-full text-sm md:min-h-9">
      <option value="">Move to...</option>
      {(row.allowedNextStages??transitions[row.stage]??[]).filter(stage=>
        stage!=="REJECTED"&&!(legacyShortlisted&&row.stage==="ASSESSMENT"&&stage==="INTERVIEW"))
       .map(stage=><option key={stage} value={stage}>{stageLabel(stage)}</option>)}
     </Select>}
    {row.status==="SUBMITTED"&&(row.allowedNextStages??transitions[row.stage]??[]).includes("REJECTED")?
     <Button type="button" variant="danger" disabled={busy}
      aria-label={"Reject "+(row.name||"learner")}
      onClick={()=>selectRow(row,"REJECTED")} className="min-h-11 text-xs md:min-h-9">
      {legacyShortlisted&&row.stage==="ASSESSMENT"?"Mark Failed":"Reject"}</Button>:null}
   </div>},
 ];
 return <section className="space-y-4">
  <div className="grid min-w-0 grid-cols-1 items-center gap-[var(--lms-space-3)] border-b border-border pb-[var(--lms-space-4)] text-sm md:grid-cols-2 lg:grid-cols-[auto_auto_auto_minmax(0,1fr)_auto]">
   <label className="flex items-center gap-2"><Checkbox checked={allPage}
    disabled={busy||!eligible.length} onChange={e=>{setAllMatching(false);setSelected(e.target.checked?eligible.map(r=>r.id):[]);}} />
    Select all {eligible.length} on this page</label>
   <strong role="status" aria-live="polite">{selectedCount} selected</strong>
   {total>eligible.length?<Button type="button" disabled={busy||total>3000}
    variant="secondary" onClick={()=>{setAllMatching(true);setSelected([]);}} >
    Select all {total.toLocaleString("en-IN")} matching this filter</Button>:null}
   {allMatching?<Button type="button" variant="secondary" onClick={()=>{setAllMatching(false);setSelected([]);}}
    >Clear selection</Button>:null}
   {total>3000?<span className="text-error">Narrow filters to 3,000 or fewer applicants before bulk actions.</span>:null}
   <Select aria-label="Bulk application action" value={target} onChange={e=>setTarget(e.target.value)}
    className="min-h-11 w-full text-base sm:text-sm md:min-h-9">
    {COLLEGE_APPLICATION_STAGES.filter(s=>s!=="APPLIED").map(stage=><option key={stage} value={stage}>
      {stage==="SHORTLISTED"?"Shortlist":stage==="REJECTED"?"Reject":
       stage==="ASSESSMENT"?"Move to Assessment":stage==="INTERVIEW"?"Move to Interview":
       stage==="WAITLISTED"?"Move to Waitlisted":stage==="OFFERED"?"Move to Offered":
       stage==="HIRED"?"Mark Hired":stage}</option>)}
   </Select>
   <Button type="button" disabled={!selectedCount||busy} className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>chooseBulk(target)}
    >
    Update {selectedCount} selected</Button>
   <span className="text-body sm:col-span-2 lg:col-span-5">Changes are tracked with per-row results. Students receive in-app notifications; email is not available.</span>
  </div>

  {error&&!dialog?<div role="alert" className="flex flex-wrap items-center gap-3 rounded-[var(--lms-control-radius)] border border-error p-3 text-sm">
   <span className="min-w-0 flex-1">{error}</span>
   {failedDetailId?<Button type="button" variant="secondary" disabled={busy}
    onClick={()=>void openDetail(failedDetailId)}>Retry details</Button>:null}
   <Button type="button" variant="secondary" onClick={()=>router.refresh()}>Reload applications</Button>
  </div>:null}
  <DataTable columns={columns} rows={rows} getRowKey={row=>row.id}
   caption="Applications pipeline" mobileMode="scroll"
   empty={<EmptyState title={filtered?"No applications match these filters.":"No applications yet."}
    description={filtered?"Try another search or clear the filters.":"Applicants will appear here when students apply for this drive."}
    action={filtered?<Link href={clearHref} className="inline-flex min-h-11 items-center font-semibold text-link underline">Clear filters</Link>:undefined}/>}/>
  {detailId?<CollegeApplicationDetailDrawer key={detailId} jobId={jobId}
    applicationId={detailId} initialDetail={detailPayload??undefined} basePath={basePath}
    onClose={()=>{setDetailId(null);setDetailPayload(null);}}/>:null}
  <Dialog open={dialog} onOpenChange={next=>{if(!next&&!busy)setDialog(false);}} title={dialogTitle} dismissible={!busy} footer={<div className="flex w-full min-w-0 flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:min-h-11 [&>button]:w-full md:[&>button]:min-h-9 md:[&>button]:w-auto">
    <Button type="button" disabled={busy} variant="secondary" onClick={()=>{setDialog(false);setError("");setOutcome(null);}}>Close</Button>
    <Button type="button" variant={target==="REJECTED"?"danger":"primary"}
      disabled={busy||reason.trim().length<3||!selectedCount}
      onClick={()=>void save()}>{busy?"Updating…":action==="REINSTATE"?"Reinstate "+selectedCount+" application(s)":
       target==="REJECTED"?"Reject "+selectedCount+" application(s)":"Confirm "+selectedCount+" application(s)"}</Button>
   </div>}>
    <p className="text-base font-semibold">{dialogTitle}</p>
    <p className="text-sm text-body leading-[22px]">{selectedCount} application(s) chosen. {action==="REINSTATE"?"Reinstate restores the previous stage while preserving recorded rejection history.":target==="REJECTED"?"Reject requires a recorded reason and is reversible only through Reinstate.":"Outcomes requiring real offers and joining confirmations cannot be fabricated from a pipeline change."}
      Students are notified in-app of successful actions. Changes that violate screening rules are reported as skipped.</p>
    {selected.length>5?<p id="pipeline-selected-scroll-cue" className="text-xs text-muted-foreground leading-5">More selected learners below ↓</p>:null}
   <ul tabIndex={0} role="region" aria-label="Selected applications" aria-describedby={selected.length>5?"pipeline-selected-scroll-cue":undefined}
    className="max-h-28 overflow-y-auto overscroll-contain pb-4 text-sm [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)]">{selected.slice(0,8).map(id=>
      <li key={id}>{rowMap.get(id)?.name??id}</li>)}
     {selected.length>8?<li>and {selected.length-8} more</li>:null}</ul>
    <label className="grid gap-[6px] font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Reason
     <Textarea rows={3} required minLength={3} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}
      className="w-full text-base sm:text-sm"/></label>
    {target==="ASSESSMENT"?<p className="text-sm text-body">Assessment links are managed through the drive's registered rounds. This status update does not send or save an assessment URL.</p>:null}
    {target==="INTERVIEW"?<p className="text-sm text-body">Moving a candidate to Interview does not schedule an appointment. Use Schedule Interview in the applicant row after the update.</p>:null}
    {target==="OFFERED"||target==="HIRED"?<p className="text-sm text-body">An existing issued offer is required for Offered, and accepted offer plus confirmed joining are required for Hired. This action does not create an offer or joining outcome.</p>:null}
    <p className="text-xs text-muted-foreground">Successful updates send in-app notifications only. Email delivery is unavailable.</p>
    {error?<p role="alert" className="text-sm text-error leading-[22px]">{error}</p>:null}
    {outcome&&outcome.results.length>5?<p id="pipeline-outcome-scroll-cue" className="text-xs text-muted-foreground leading-5">More outcomes below ↓</p>:null}
    {outcome?<div role="status" tabIndex={0} aria-label="Bulk application outcomes" aria-describedby={outcome.results.length>5?"pipeline-outcome-scroll-cue":undefined}
     className="max-h-36 overflow-y-auto overscroll-contain rounded border border-border p-3 pb-5 text-sm [mask-image:linear-gradient(to_bottom,#000_0%,#000_calc(100%-1rem),transparent_100%)]">
     <p className="font-semibold">{outcome.moved} updated, {outcome.skipped} skipped.</p>
     {outcome.results.filter(r=>r.status==="skipped").map(r=><p key={r.applicationId}>{rowMap.get(r.applicationId)?.name??r.applicationId}: {r.reason}</p>)}
    </div>:null}
  </Dialog>
 </section>;
}
